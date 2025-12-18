"use client";

import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";

type CarouselItem = {
  content: React.ReactNode;
  href?: string;
};

const Skeleton = () => (
      <div className="h-full border rounded-lg p-4 space-y-4 animate-pulse bg-muted">
        <div className="h-full bg-muted-foreground/30 rounded" />
      </div>
);

export default function Carousel({ items }: { items: CarouselItem[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  // Track failed slides by index
  const [failedSlides, setFailedSlides] = useState<Set<number>>(new Set());

  const timer = useRef<NodeJS.Timeout | null>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: { perView: 1 },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
  });

  // Autoplay
  useEffect(() => {
    const slider = instanceRef.current;
    if (!slider) return;

    const play = () => {
      timer.current = setInterval(() => {
        slider.next();
      }, 3000);
    };

    const stop = () => {
      if (timer.current) clearInterval(timer.current);
    };

    play();

    const container = sliderContainerRef.current;
    container?.addEventListener("mouseenter", stop);
    container?.addEventListener("mouseleave", play);

    return () => {
      stop();
      container?.removeEventListener("mouseenter", stop);
      container?.removeEventListener("mouseleave", play);
    };
  }, [instanceRef]);

  function wrapContentWithErrorHandler(
    content: React.ReactNode,
    index: number
  ): React.ReactNode {
    if (
      React.isValidElement(content) &&
      // Check if it's an img element:
      (content.type === "img" ||
        (typeof content.type === "string" &&
          content.type.toLowerCase() === "img"))
    ) {
      const imgElement = content as React.ReactElement<
        React.ImgHTMLAttributes<HTMLImageElement>
      >;

      return React.cloneElement(imgElement, {
        onError: () => {
          setFailedSlides((prev) => new Set(prev).add(index));
        },
      });
    }
    return content;
  }

  const renderSlideContent = (item: CarouselItem, index: number) => {
    if (failedSlides.has(index)) {
      return <Skeleton />;
    }

    const wrappedContent = wrapContentWithErrorHandler(item.content, index);

    if (item.href) {
      return (
        <Link href={item.href}>
          <div className="cursor-pointer">{wrappedContent}</div>
        </Link>
      );
    }

    return wrappedContent;
  };

  return (
    <div ref={sliderContainerRef} className="relative border my-5 rounded-lg">
      {/* Carousel */}
      <div ref={sliderRef} className="keen-slider rounded-lg overflow-hidden">
        {items.map((item, i) => (
          <div key={i} className="keen-slider__slide">
            {renderSlideContent(item, i)}
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-muted-foreground/50 p-1 rounded-lg">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => instanceRef.current?.moveToIdx(i)}
            className={`h-2 w-2 rounded-full transition-all ${
              currentSlide === i ? "bg-background" : "bg-muted-foreground"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
