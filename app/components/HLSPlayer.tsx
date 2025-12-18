"use client";

import Hls from "hls.js";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, EllipsisVertical } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import { useRouter } from "next/navigation";
import "../globals.css";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Pdf02Icon,
  Download04Icon,
  Cancel01Icon,
  ReloadIcon,
  AttachmentIcon,
  LiveStreaming02Icon,
} from "@hugeicons/core-free-icons";

type Quality = {
  id: number; // or string, whatever your track id is
  height: number;
  label: string;
  // other props
};

type Props = {
  baseUrl: string;
  signedQuery: string;
  attachment?: string;
};

const VideoPlayer: React.FC<Props> = ({ baseUrl, signedQuery, attachment }) => {
  const hlsRef = useRef<Hls | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const LIVE_LATENCY = 5; // 5 seconds delay threshold

  const router = useRouter();
  const speeds = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<
    "fwd" | "back" | null
  >(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [volume, setVolume] = useState(1);

  const [showSettings, setShowSettings] = useState(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const [showQualitySelector, setShowQualitySelector] = useState(false);

  const [ShowMenu, setShowMenu] = useState(false);

  const popupRef = useRef<HTMLDivElement | null>(null);

  const [availableQualities, setAvailableQualities] = useState<Quality[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<"auto" | number>(
    "auto"
  );
  const [playbackRate, setPlaybackRate] = useState(1);

  const [bufferedTime, setBufferedTime] = useState(0); // Buffered time

  const [seekingTime, setSeekingTime] = useState<number | null>(null);

  const [isLive, setIsLive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);


const [controlsVisible, setControlsVisible] = useState(true);
const hideTimeoutRef = useRef<number | null>(null);


// Clear and restart hide timer
const resetHideTimer = () => {
  if (hideTimeoutRef.current) {
    clearTimeout(hideTimeoutRef.current);
  }
  hideTimeoutRef.current = window.setTimeout(() => {
    setControlsVisible(false);
  }, 3000);
};

// Show controls and reset timer
const showControls = () => {
  setControlsVisible(true);
  resetHideTimer();
};

// Handle mouse move (desktop)
const handleMouseMove = () => {
  showControls();
};

// Handle tap/click (mobile + desktop)
const handleTap = () => {
  showControls();
};

useEffect(() => {
  // Start timer on first load
  resetHideTimer();

  return () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  };
}, []);
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [
      h > 0 ? h : null,
      m.toString().padStart(2, "0"),
      s.toString().padStart(2, "0"),
    ]
      .filter(Boolean)
      .join(":");
  };

  // Check if we are at the live edge (within latency)
  const isAtLiveEdge = () => {
    const video = videoRef.current;
    if (!video || !video.seekable || video.seekable.length === 0) return false;
    const liveEdge = video.seekable.end(video.seekable.length - 1);
    const latency = liveEdge - video.currentTime;
    return latency <= LIVE_LATENCY;
  };

  const goToLive = () => {
    const video = videoRef.current;
    if (!video) return;
    const currentRate = video.playbackRate; // <-- Save current rate

    const seekToLiveEdge = () => {
      const liveEdge = video.seekable.end(video.seekable.length - 1);
      const targetTime = Math.max(0, liveEdge - LIVE_LATENCY);
      video.currentTime = targetTime;
      video.play();
      video.playbackRate = currentRate; // <-- Restore speed after seek
    };

    if (video.seekable?.length > 0) {
      seekToLiveEdge();
    }

    if (hlsRef.current) {
      hlsRef.current.startLoad(-1);
      setTimeout(() => {
        if (video.seekable?.length > 0) {
          seekToLiveEdge();
        }
      }, 300);
    }

    setIsLive(true);
    setTimeout(() => {
      setIsLive(isAtLiveEdge());
    }, 2000);
  };
  useEffect(() => {
    if (isLive && videoRef.current) {
      videoRef.current.playbackRate = 1;
      setPlaybackRate(1);
    }
  }, [isLive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const hls = new Hls({
      xhrSetup: (xhr, url) => {
        const sep = url.includes("?") ? "&" : "?";
        xhr.open("GET", `${url}${sep}${signedQuery.replace(/^\?/, "")}`, true);
      },
    });

    hlsRef.current = hls;
    hls.loadSource(baseUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      const qualities = hls.levels.map((level, index) => ({
        id: index,
        height: level.height ? `${level.height}p` : `Level ${index + 1}`,
        label: `${level.height}p`,
      }));
      setAvailableQualities(qualities);
      setSelectedQuality("auto");
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error("HLS.js error:", data);
    });

    return () => {
      hls.destroy();
    };
  }, [baseUrl, signedQuery]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
    };

    const updatePlaying = () => {
      setIsPlaying(!video.paused);
      video.playbackRate = playbackRate; // <-- Re-apply playback speed
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("play", updatePlaying);
    video.addEventListener("pause", updatePlaying);

    const interval = setInterval(() => {
      if (!video) return;

      const ranges = video.buffered;
      let bufferedEnd = video.currentTime;
      for (let i = 0; i < ranges.length; i++) {
        if (
          video.currentTime >= ranges.start(i) &&
          video.currentTime <= ranges.end(i)
        ) {
          bufferedEnd = ranges.end(i);
          break;
        }
      }
      setBufferedTime(bufferedEnd);

      if (video.seekable?.length > 0) {
        const liveEdge = video.seekable.end(0);
        const latency = liveEdge - video.currentTime;
        setIsLive(latency <= LIVE_LATENCY);
      }
    }, 500);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("play", updatePlaying);
      video.removeEventListener("pause", updatePlaying);
      clearInterval(interval);
    };
  }, []);

  const handlePlay = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };
  const handleForward = () => {
    setAnimationDirection("fwd");
    const video = videoRef.current;
    if (!video || !video.seekable || video.seekable.length === 0) return;

    const liveEdge = video.seekable.end(video.seekable.length - 1);
    const target = Math.min(video.currentTime + 10, liveEdge);
    video.currentTime = target;
  };

  const handleRewind = () => {
    setAnimationDirection("back");
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(video.currentTime - 10, 0);
  };

  const handleAnimationEnd = () => {
    setAnimationDirection(null);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setVolume(newVolume);
  };

  const toggleMute = () => {
    const newVolume = volume === 0 ? 1 : 0;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const performQualitySwitch = (target: "auto" | number) => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (target === "auto") {
      hls.currentLevel = -1; // Enable ABR (auto)
      console.log("Switched to AUTO quality");
    } else {
      // Set fixed quality level (0-based index)
      if (target >= 0 && target < hls.levels.length) {
        hls.currentLevel = target;
        const level = hls.levels[target];
        console.log(`Switched to ${level.height}p (${level.bitrate} bps)`);
      } else {
        console.warn("Level index not found:", target);
      }
    }
  };

  const handleQualityChange = (value: "auto" | number) => {
    setSelectedQuality(value);
    performQualitySwitch(value);
    setShowQualitySelector(false);
  };
  const handleToggleFullscreen = () => {
    const el = document.documentElement;

    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (event.key) {
        case " ": // Space toggles play/pause
          event.preventDefault(); // prevent page scroll on space
          handlePlay();
          break;

        case "ArrowRight": // Seek forward 10 seconds
          videoRef.current.currentTime = Math.min(
            videoRef.current.currentTime + 5
          );
          setAnimationDirection("fwd");

          break;

        case "ArrowLeft": // Seek backward 10 seconds
          videoRef.current.currentTime = Math.max(
            videoRef.current.currentTime - 5,
            0
          );
          setAnimationDirection("back");

          break;

        case "f": // Toggle fullscreen (if you want)
          handleToggleFullscreen();
          break;

        case "m": // Toggle mute/unmute
          toggleMute();
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePlay, handleToggleFullscreen, toggleMute]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
        setShowSettings(false);
        setShowSpeedSelector(false);
        setShowQualitySelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleSpeedChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const value = parseFloat(e.currentTarget.getAttribute("data-value") || "1");
    if (videoRef.current) {
      videoRef.current.playbackRate = value;
    }
    setPlaybackRate(value); // Keep track of selected rate
    setShowSpeedSelector(false);
  };

  return (
    <div
   onMouseMove={handleMouseMove}
  onClick={handleTap}
  style={{ touchAction: "manipulation" }}
      className="flex h-full w-full select-none"
    >
      <div id="player-animation"></div>

      <div
        style={{
      visibility: controlsVisible ? "visible" : "hidden",
      opacity: controlsVisible ? 1 : 0,
      pointerEvents: controlsVisible ? "auto" : "none",
      transition: "opacity 0.3s ease"
        }}
        className="interactive-layer-wrapper "
      >
        <div className="player-header ">
          <div className="flex space-x-2 lg:space-x-4 p-2 lg:p-4 items-center player-header ">
            <div
              onClick={() => router.back()}
              className="transition-all bg-opacity-30 animate-in slide-in-from-top duration-200 opacity-100 player-icon cursor-pointer hover:scale-105"
            >
              <ArrowLeft className="w-9 h-9" />
            </div>
            <div className="flex-1"></div>
            <div className="flex space-x-2 items-center lg:space-x-4">
              <div
                onClick={() => setShowMenu((prev) => !prev)}
                className="transition-all bg-opacity-30 animate-in slide-in-from-top duration-200 opacity-100 player-icon cursor-pointer hover:scale-105"
              >
                <div className="w-[35px] h-[35px] md:w-[35px] md:h-[35px] z-[10]">
                  <EllipsisVertical className="w-9 h-9" />
                </div>
              </div>
            </div>
            {ShowMenu && (
              <div
                ref={popupRef}
                className="z-[1000] absolute flex justify-end  items-start min-w-full top-[60px] right-[28px]"
              >
                <div className="bg-[#1B2124] flex flex-col  rounded-md w-[200px] p-3">
                  <div
                    onClick={() => window.location.reload()}
                    className="flex items-center cursor-pointer w-full p-2.5 gap-2.5"
                  >
                    <div className="w-6 h-6">
                      <HugeiconsIcon
                        icon={ReloadIcon}
                        size={20}
                        strokeWidth={2}
                      />
                    </div>
                    <div className=" w-full">
                      <div className="Typography_root__HsO0C font-semibold Typography_subHeading__v4fFR">
                        <span className="text-white">Reload</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 cursor-pointer" onClick={handlePlay}></div>

        <div className="opacity-100 transition-all duration-200 animate-in slide-in-from-bottom ">
          <div className="flex space-y-2 p-0 sm:p-0 lg:p-2 flex-col player-footer !px-3">
            <div className="relative">
              <div id="progress-placeholder" className="relative">
                <div className="flex justify-between  px-3 mb-4  pb-[6px]">
                  <div className="flex space-x-2 items-center">
                    {/* Current Time */}
                    <div className="vjs-current-time vjs-time-control vjs-control">
                      {formatTime(currentTime)}
                    </div>

                    {/* SPEED */}
                    <div className="text-black bg-white rounded px-1 text-xs">
                      {playbackRate.toFixed(2).replace(/\.00$/, "")}x
                    </div>
                  </div>
                  {/* duration */}
                  <div className="total-time-placeholder">
                    <div
                      className={`text-sm p-1 rounded-md flex items-center text-center flex-row gap-1 cursor-pointer ${
                        isLive
                          ? "bg-red-500"
                          : "border border-red-500 text-white"
                      }`}
                      title="Go Live"
                      onClick={goToLive}
                    >
                      <HugeiconsIcon
                        icon={LiveStreaming02Icon}
                        size={15}
                        strokeWidth={2}
                      />
                      LIVE
                    </div>
                  </div>
                </div>
                {/* Progress bar container */}
                <div
                  className="vjs-progress-control vjs-control"
                  style={{
                    bottom: "-15px",
                  }}
                >
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-3 cursor-pointer"
                    value={[
                      seekingTime !== null
                        ? seekingTime
                        : videoRef.current?.seekable?.length
                        ? Math.max(
                            0,
                            Math.min(
                              100,
                              ((videoRef.current.currentTime -
                                videoRef.current.seekable.start(0)) /
                                (videoRef.current.seekable.end(0) -
                                  videoRef.current.seekable.start(0))) *
                                100
                            )
                          )
                        : 0,
                    ]}
                    max={100}
                    step={0.1}
                    onValueChange={([value]) => {
                      setIsSeeking(true);
                      setSeekingTime(value);
                    }}
                    onValueCommit={([value]) => {
                      const video = videoRef.current;
                      if (video && video.seekable?.length > 0) {
                        const seekStart = video.seekable.start(0);
                        const seekEnd = video.seekable.end(0);
                        const seekTo =
                          seekStart + (value / 100) * (seekEnd - seekStart);
                        video.currentTime = seekTo;

                        setSeekingTime(null);
                        setIsSeeking(false);
                      }
                    }}
                  >
                    {/* Buffered Progress */}
                    <div className="absolute h-1 w-full bg-gray-300/30 rounded-full">
                      <div
                        className="absolute h-1 bg-white rounded-full satish"
                        style={{
                          width:
                            videoRef.current?.seekable?.length > 0
                              ? `${
                                  ((bufferedTime -
                                    videoRef.current.seekable.start(0)) /
                                    (videoRef.current.seekable.end(0) -
                                      videoRef.current.seekable.start(0))) *
                                  100
                                }%`
                              : `0%`,
                        }}
                      />
                    </div>

                    {/* Played Progress */}
                    <Slider.Track className="relative h-1 bg-transparent w-full rounded-full">
                      <Slider.Range className="absolute h-1 bg-indigo-700 rounded-full" />
                    </Slider.Track>

                    <Slider.Thumb className="relative block w-2 h-2 bg-indigo-600 rounded-full shadow hover:scale-110 transition-transform outline-none">
                      {isSeeking &&
                        seekingTime !== null &&
                        videoRef.current?.seekable?.length > 0 && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                            {/* Tooltip box */}
                            <div className="px-2 py-1 text-xs text-white bg-black/80 rounded-md">
                              {formatTime(
                                (seekingTime / 100) *
                                  (videoRef.current.seekable.end(0) -
                                    videoRef.current.seekable.start(0))
                              )}
                            </div>

                            {/* Arrow below tooltip */}
                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black/80" />
                          </div>
                        )}
                    </Slider.Thumb>
                  </Slider.Root>
                </div>

                {/*  */}
              </div>
            </div>
            <div className="flex space-x-2 lg:space-x-4 px-2 justify-between items-center">
              <div
                className="flex-1 space-x-1 sm:space-x-3 flex"
                id="footer-left-section"
              >
                <div
                  onClick={handlePlay}
                  className="flex flex-col items-center justify-center"
                  id="play-pause-action"
                >
                  {isPlaying ? (
                    // PAUSE icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="40"
                      height="40"
                      fill="#fff"
                      aria-hidden="false"
                      data-slot="icon"
                      className=" player-icon cursor-pointer hover:scale-105 transition-all duration-200"
                    >
                      <path
                        fill="#fff"
                        fillRule="evenodd"
                        d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  ) : (
                    // PLAY icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="40"
                      height="40"
                      fill="#fff"
                      className="player-icon cursor-pointer hover:scale-105 transition-all duration-200"
                    >
                      <path
                        fill="#fff"
                        fillRule="evenodd"
                        d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                <div
                  onClick={handleRewind}
                  onAnimationEnd={handleAnimationEnd}
                  id="time_backward_button"
                  className={`cursor-pointer hover:scale-110 duration-200 transition-all ${
                    animationDirection === "back" ? "animate-rotate-back" : ""
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    fill="none"
                  >
                    <path
                      fill="#fff"
                      d="M9.015 13.232a1.109 1.109 0 0 1 1.475-.125 1.001 1.001 0 0 1 .21 1.407 10.97 10.97 0 0 0-2.547 7.045c0 2.192.66 4.336 1.9 6.176a11.723 11.723 0 0 0 5.09 4.195c2.083.898 4.391 1.2 6.648.868a12.065 12.065 0 0 0 6.072-2.738 11.314 11.314 0 0 0 3.55-5.465c.609-2.112.569-4.348-.115-6.44a11.357 11.357 0 0 0-3.74-5.346 12.1 12.1 0 0 0-6.165-2.538l1.454 1.2a1.006 1.006 0 0 1 .118 1.457c-.186.208-.45.337-.735.358a1.106 1.106 0 0 1-.783-.245L17.68 9.94a1.04 1.04 0 0 1-.278-.354 1 1 0 0 1 .278-1.217l3.768-3.101a1.09 1.09 0 0 1 .784-.245c.14.01.278.048.404.11.126.06.239.145.33.249a.995.995 0 0 1 .142 1.14 1.04 1.04 0 0 1-.26.317l-1.622 1.337a14.335 14.335 0 0 1 7.422 2.818 13.46 13.46 0 0 1 4.611 6.253c.873 2.47.978 5.13.303 7.655a13.348 13.348 0 0 1-4.106 6.57 14.243 14.243 0 0 1-7.178 3.35c-2.68.423-5.432.09-7.919-.961a13.867 13.867 0 0 1-6.084-4.958A13.051 13.051 0 0 1 6 21.559c-.01-3.024 1.053-5.961 3.015-8.328Z"
                    ></path>
                    <path
                      fill="#fff"
                      d="M16.02 12.927a1.128 1.128 0 0 1-1.536.112l-3.812-3.101a1.032 1.032 0 0 1-.28-.352.991.991 0 0 1 0-.866c.065-.136.16-.256.28-.352l3.813-3.102a1.141 1.141 0 0 1 1.083-.21c.182.058.346.163.472.303a.991.991 0 0 1 .193 1.035 1.033 1.033 0 0 1-.333.442l-2.845 2.318 2.847 2.316c.108.087.197.195.262.316a.996.996 0 0 1-.144 1.14ZM15.158 24.985a.912.912 0 0 0-.64.238.816.816 0 0 0 0 1.214.914.914 0 0 0 .64.238h2.64a.914.914 0 0 0 .64-.238.816.816 0 0 0 0-1.214.912.912 0 0 0-.64-.238h-.444v-7.18a.82.82 0 0 0-.125-.433.866.866 0 0 0-.34-.311.91.91 0 0 0-.903.041l-1.32.846a.845.845 0 0 0-.363.523.817.817 0 0 0 .114.619.88.88 0 0 0 .528.372c.219.054.451.025.649-.08v5.603h-.436ZM22.197 16.96c-.583 0-1.143.223-1.555.619a2.069 2.069 0 0 0-.644 1.493v5.49c0 .56.231 1.097.644 1.493.412.396.972.619 1.555.619h1.32c.29 0 .576-.055.843-.161a2.21 2.21 0 0 0 .713-.458c.204-.196.367-.429.477-.685.11-.256.168-.53.168-.808v-5.49c0-.278-.057-.552-.168-.808a2.107 2.107 0 0 0-.477-.685 2.208 2.208 0 0 0-.713-.458 2.28 2.28 0 0 0-.842-.16h-1.32Zm1.76 2.112v5.49a.417.417 0 0 1-.13.301.453.453 0 0 1-.313.125h-1.317a.453.453 0 0 1-.313-.125.417.417 0 0 1-.13-.3v-5.491c0-.113.047-.221.13-.301a.453.453 0 0 1 .313-.125h1.32c.118.001.23.046.312.126.082.08.128.188.128.3Z"
                    ></path>
                  </svg>
                </div>
                <div
                  onClick={handleForward}
                  onAnimationEnd={handleAnimationEnd}
                  className={`cursor-pointer hover:scale-110 duration-200 transition-all ${
                    animationDirection === "fwd" ? "animate-rotate-fwd" : ""
                  }`}
                  id="time_forward_button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    fill="none"
                  >
                    <path
                      fill="#fff"
                      d="M30.99 13.236a1.11 1.11 0 0 0-1.496-.15 1.003 1.003 0 0 0-.195 1.43 10.965 10.965 0 0 1 2.548 7.045c.001 2.192-.659 4.337-1.899 6.177a11.726 11.726 0 0 1-5.091 4.196 12.303 12.303 0 0 1-6.65.868 12.071 12.071 0 0 1-6.076-2.737 11.313 11.313 0 0 1-3.55-5.465c-.61-2.112-.57-4.348.114-6.44a11.356 11.356 0 0 1 3.74-5.346 12.107 12.107 0 0 1 6.169-2.538l-1.459 1.2a1.008 1.008 0 0 0-.09 1.433 1.11 1.11 0 0 0 1.49.137l3.77-3.101a1.04 1.04 0 0 0 .278-.353 1 1 0 0 0-.277-1.217l-3.77-3.1a1.12 1.12 0 0 0-1.21-.165c-.13.062-.245.148-.339.254a.995.995 0 0 0-.128 1.165c.069.122.163.23.276.316l1.623 1.337a14.34 14.34 0 0 0-7.421 2.82 13.457 13.457 0 0 0-4.61 6.253 12.916 12.916 0 0 0-.299 7.653 13.345 13.345 0 0 0 4.107 6.567 14.248 14.248 0 0 0 7.18 3.346c2.68.424 5.432.09 7.919-.96 2.486-1.051 4.6-2.774 6.085-4.957a13.045 13.045 0 0 0 2.273-7.342c.012-3.023-1.05-5.96-3.012-8.326Z"
                    ></path>
                    <path
                      fill="#fff"
                      d="M24.029 12.931a1.107 1.107 0 0 0 1.52.112l3.77-3.1a1.04 1.04 0 0 0 .277-.353 1 1 0 0 0-.278-1.217l-3.77-3.1a1.12 1.12 0 0 0-1.21-.165c-.129.062-.244.148-.338.254a.993.993 0 0 0-.128 1.165c.069.122.163.23.276.316l2.814 2.316-2.815 2.316a1.007 1.007 0 0 0-.118 1.457ZM15.159 24.987a.914.914 0 0 0-.641.238.816.816 0 0 0 0 1.214.914.914 0 0 0 .64.238h2.64a.914.914 0 0 0 .641-.239.816.816 0 0 0 0-1.214.887.887 0 0 0-.64-.237h-.444v-7.178a.819.819 0 0 0-.125-.434.866.866 0 0 0-.34-.31.912.912 0 0 0-.903.04l-1.32.846a.843.843 0 0 0-.363.523.816.816 0 0 0 .114.619c.12.184.308.317.527.372.22.054.452.025.65-.08v5.602h-.436ZM22.2 16.964c-.583 0-1.143.222-1.556.618A2.069 2.069 0 0 0 20 19.075v5.489c0 .56.232 1.097.644 1.493.413.396.973.618 1.556.618h1.32c.29 0 .576-.055.843-.16a2.21 2.21 0 0 0 .714-.458c.204-.196.366-.429.476-.685.111-.256.168-.53.168-.808v-5.49c0-.277-.057-.551-.168-.807a2.105 2.105 0 0 0-.476-.685 2.208 2.208 0 0 0-.714-.458 2.281 2.281 0 0 0-.842-.16H22.2Zm1.76 2.11v5.49a.417.417 0 0 1-.13.3.453.453 0 0 1-.313.125H22.2a.453.453 0 0 1-.313-.124.417.417 0 0 1-.13-.301v-5.49c0-.112.047-.22.13-.3a.453.453 0 0 1 .313-.125h1.32c.118.001.23.046.312.126.082.08.129.188.129.3Z"
                    ></path>
                  </svg>
                </div>
                <div
                  className="flex max-w-[120px] items-center group custom-volume-slider lg:flex"
                  id="volume-btn-icon"
                >
                  <div className="" onClick={toggleMute}>
                    {volume === 0 ? (
                      // Mute icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="40"
                        stroke="currentColor"
                        height="40"
                        aria-hidden="false"
                        data-slot="icon"
                        className="player-icon cursor-pointer hover:scale-105 transition-all duration-200"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                        ></path>
                      </svg>
                    ) : (
                      // Volume icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="40"
                        height="40"
                        fill="#fff"
                        aria-hidden="false"
                        data-slot="icon"
                        className="player-icon cursor-pointer hover:scale-105 transition-all duration-200"
                      >
                        <path
                          fill="#fff"
                          d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z"
                        ></path>
                        <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z"></path>
                      </svg>
                    )}
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="custom-slider w-0 transition-all outline-none opacity-0 duration-500 group-hover:w-full group-hover:opacity-100 h-1 bg-gray-50 text-white rounded-lg appearance-none cursor-pointer range-sm"
                  />
                </div>
              </div>

              <div className="flex-1"></div>

              <div
                className="flex-1 flex justify-end space-x-1 sm:space-x-3 items-center"
                id="footer-right-section"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="relative flex flex-col items-center justify-center">
                    <button
                      onClick={() => setShowSettings((prev) => !prev)}
                      className="focus:outline-none"
                      id="setting-icon"
                    >
                      <div className="cursor-pointer  hover:scale-110 duration-200 transition-all">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="40"
                          height="40"
                          fill="none"
                        >
                          <path
                            stroke="#ffffff"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M29.858 20a9.885 9.885 0 0 0-.151-1.693l3.177-2.666-2.667-4.638-3.896 1.438a9.831 9.831 0 0 0-2.933-1.716l-.719-4.058h-5.333l-.719 4.058a9.831 9.831 0 0 0-2.933 1.716l-3.896-1.415-2.667 4.638 3.177 2.666a9.28 9.28 0 0 0 0 3.386l-3.177 2.643 2.667 4.638 3.896-1.426a9.843 9.843 0 0 0 2.933 1.704l.719 4.058h5.333l.719-4.058a9.845 9.845 0 0 0 2.945-1.692l3.896 1.426 2.666-4.638-3.177-2.667a9.88 9.88 0 0 0 .14-1.704v0Z"
                          ></path>
                          <path
                            stroke="#ffffff"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M20.003 25.217a5.217 5.217 0 1 0 0-10.434 5.217 5.217 0 0 0 0 10.434Z"
                          ></path>
                        </svg>
                      </div>
                    </button>
                    {/* Popup */}
                    {(showSettings ||
                      showSpeedSelector ||
                      showQualitySelector) && (
                      <div
                        ref={popupRef}
                        id="settings-popup"
                        className="fixed sm:absolute right-[-15px] bottom-[60px] sm:bottom-[45px] z-10 mt-3 w-screen transform px-4 max-w-screen sm:max-w-[360px]"
                        tabIndex={-1}
                        aria-modal="true"
                        role="dialog"
                      >
                        {showSettings && (
                          <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 pt-4 bg-[#17171C] pb-4">
                            <div className="bg-[#17171C]">
                              <div className="text-[#d9d9da] max-h-[200px] overflow-y-auto">
                                <div className="flex items-center justify-between py-2 px-4">
                                  <div className="flex items-center">
                                    <span className="lg:w-28 xl:w-28 2xl:w-28 inline-block text-base font-medium leading-6 text-[#d9d9da]">
                                      Speed
                                    </span>
                                  </div>
                                  <div
                                    onClick={() => {
                                      setShowSpeedSelector((prev) => !prev);
                                      setShowSettings(false);
                                      setShowQualitySelector(false);
                                    }}
                                    className="py-[10px] hover:bg-[#1E1E24] pl-3 pr-[6px] flex items-center gap-1 rounded-md bg-[#23232a] cursor-pointer"
                                  >
                                    <span className="w-[86px] h-fit inline-block text-sm font-medium leading-5 text-[#d9d9da]">
                                      {playbackRate
                                        .toFixed(2)
                                        .replace(/\.00$/, "")}
                                    </span>
                                    <svg
                                      width="20"
                                      height="20"
                                      viewBox="0 0 20 20"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M8 14L12 10L8 6L8 14Z"
                                        fill="#B3B3BC"
                                      ></path>
                                    </svg>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between py-2 px-4">
                                  <div className="flex items-center">
                                    <span className="lg:w-28 xl:w-28 2xl:w-28 inline-block text-base font-medium leading-6 text-[#d9d9da]">
                                      Quality
                                    </span>
                                  </div>
                                  <div
                                    onClick={() => {
                                      setShowSettings(false);
                                      setShowSpeedSelector(false);
                                      setShowQualitySelector((prev) => !prev);
                                    }}
                                    className="py-[10px] hover:bg-[#1E1E24] pl-3 pr-[6px] flex items-center gap-1 rounded-md bg-[#23232a] cursor-pointer"
                                  >
                                    <span className="w-[86px] h-fit inline-block text-sm font-medium capitalize leading-5 text-[#d9d9da]">
                                      {selectedQuality === "auto"
                                        ? "Auto"
                                        : availableQualities.find(
                                            (q) => q.id === selectedQuality
                                          )?.label ?? "Unknown"}
                                    </span>
                                    <svg
                                      width="20"
                                      height="20"
                                      viewBox="0 0 20 20"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M8 14L12 10L8 6L8 14Z"
                                        fill="#B3B3BC"
                                      ></path>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {/*  */}
                        {showSpeedSelector && (
                          <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 pt-4 bg-[#17171C] px-4 pb-3">
                            <div className="bg-[#17171C] ">
                              <div className="flex items-center justify-start cursor-pointer gap-3 mb-1 pb-3 border-b border-[#3A3A46]">
                                <div
                                  onClick={() => {
                                    setShowSettings((prev) => !prev);
                                    setShowSpeedSelector(false);
                                    setShowQualitySelector(false);
                                  }}
                                  className="hover:bg-[#23232A] hover:rounded"
                                >
                                  <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 32 32"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <g id="ChevronRightOutline">
                                      <path
                                        id="Vector"
                                        d="M18 21L13 16L18 11"
                                        stroke="#D9D9DA"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      ></path>
                                    </g>
                                  </svg>
                                </div>
                                <span className="inline-block text-lg font-semibold leading-[28px] text-[#D9D9DA]">
                                  Speed
                                </span>
                              </div>
                              <div className="sm:landscape:max-h-[150px] sm:landscape:overflow-y-auto lg:landscape:max-h-none SettingsAction_bar__Mrr7w">
                                {speeds.map((speed) => {
                                  const isActive = playbackRate === speed;
                                  return (
                                    <div
                                      key={speed}
                                      data-value={speed}
                                      onClick={handleSpeedChange}
                                      className={`mb-1 cursor-pointer rounded-md radio flex items-center justify-between py-2 pl-4 pr-2 hover:bg-[#23232A] ${
                                        isActive ? "bg-fill" : ""
                                      }`}
                                    >
                                      <label className="cursor-pointer text-base font-medium leading-6 text-[#D9D9DA] text-start w-full">
                                        {speed}
                                      </label>

                                      <div
                                        className={`border rounded-full border-solid flex items-center justify-center ${
                                          isActive
                                            ? "border-gradient-2 h-[18px] w-5"
                                            : "border-[#5A5A6C] h-4 w-4"
                                        }`}
                                      >
                                        <div
                                          className={`border-solid rounded-full ${
                                            isActive
                                              ? "bg-gradient-2 h-4 w-4 border-2 border-[#17171C]"
                                              : ""
                                          }`}
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* */}
                        {showQualitySelector && (
                          <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 pt-4 bg-[#17171C] px-4 pb-3">
                            <div className="bg-[#17171C]">
                              <div className="flex items-center justify-start cursor-pointer gap-3 mb-1 pb-3 border-b border-[#3A3A46]">
                                <div
                                  onClick={() => {
                                    setShowSettings((prev) => !prev);
                                    setShowQualitySelector(false);
                                    setShowSpeedSelector(false);
                                  }}
                                  className="hover:bg-[#23232A] hover:rounded"
                                >
                                  <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 32 32"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M18 21L13 16L18 11"
                                      stroke="#D9D9DA"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                                <span className="inline-block text-lg font-semibold leading-[28px] text-[#D9D9DA]">
                                  Quality
                                </span>
                              </div>

                              <div className="sm:landscape:max-h-[150px] sm:landscape:overflow-y-auto lg:landscape:max-h-none">
                                {["auto", ...availableQualities].map(
                                  (quality) => {
                                    const isAuto = quality === "auto";
                                    const q = !isAuto
                                      ? (quality as {
                                          id: number;
                                          height: string;
                                        })
                                      : null;

                                    return (
                                      <div
                                        key={isAuto ? "auto" : q!.id}
                                        onClick={() =>
                                          handleQualityChange(
                                            isAuto ? "auto" : q!.id
                                          )
                                        }
                                        className={`mb-1 cursor-pointer rounded-md radio flex items-center justify-between py-2 pl-4 pr-2 hover:bg-[#23232A] ${
                                          selectedQuality ===
                                          (isAuto ? "auto" : q!.id)
                                            ? "bg-fill"
                                            : ""
                                        }`}
                                      >
                                        <label className="cursor-pointer text-base font-medium leading-6 text-[#D9D9DA] text-start w-full">
                                          {isAuto ? "Auto" : q!.height}
                                        </label>
                                        <div
                                          className={`border rounded-full border-solid flex items-center justify-center ${
                                            selectedQuality ===
                                            (isAuto ? "auto" : q!.id)
                                              ? "border-gradient-2 h-[18px] w-5"
                                              : "border-[#5A5A6C] h-4 w-4"
                                          }`}
                                        >
                                          <div
                                            className={`border-solid rounded-full ${
                                              selectedQuality ===
                                              (isAuto ? "auto" : q!.id)
                                                ? "bg-gradient-2 h-4 w-4 border-2 border-[#17171C]"
                                                : ""
                                            }`}
                                          ></div>
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Quality toggle */}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  onClick={handleToggleFullscreen}
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  {isFullscreen ? (
                    // 🔙 Exit Fullscreen Icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="26"
                      height="27"
                      fill="none"
                      viewBox="0 0 26 27"
                      className="player-icon hover:scale-105 transition-all duration-200"
                    >
                      <path
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8.636 9.386V2.841m0 6.545H2.091m6.545 0L1 1.75m7.636 16.364v6.545m0-6.545H2.091m6.545 0L1 25.75M17.364 9.386h6.545m-6.545 0V2.841m0 6.545L25 1.75m-7.636 16.364h6.545m-6.545 0v6.545m0-6.545L25 25.75"
                      />
                    </svg>
                  ) : (
                    // 🖥 Enter Fullscreen Icon
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="#ffffff"
                      xmlns="http://www.w3.org/2000/svg"
                      className="player-icon hover:scale-105 transition-all duration-200"
                    >
                      <g clipPath="url(#clip0_1649_38029)">
                        <path
                          d="M30.1 9H32.6667V16.3333H30.1V11.4444H24.9667V9H30.1ZM9.56667 9H14.7V11.4444H9.56667V16.3333H7V9H9.56667ZM30.1 28.5556V23.6667H32.6667V31H24.9667V28.5556H30.1ZM9.56667 28.5556H14.7V31H7V23.6667H9.56667V28.5556Z"
                          fill="#ffffff"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_1649_38029">
                          <rect width="40" height="40" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 lg:space-x-4 px-2 justify-between items-center">
              <div className="flex-1 space-x-1 sm:space-x-3 flex">
                <div className="flex flex-col items-center justify-center"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-full flex flex-col items-center justify-center bg-black">
        <div className="relative w-full h-full bg-black">
          <div className="player bg-black">
            {/* <video
                  key={src} // <-- force remount on src change
                  ref={videoRef}
                  className="w-full h-full"  preload="auto"
    
                  // 🔥 Remove poster for YouTube type
                  // {...(type !== "youtube" && hasPoster
                  //   ? { poster: hasPoster }
                  //   : {})}
                /> */}
            {/* <video
                  id={src}
                  key={src} // This forces a clean remount of the video element on src change
                  ref={videoRef}
                  // controls
                  className="w-full h-full"
                /> */}
            <video
              ref={videoRef}
              className="w-full h-full"
              // controls
              // autoPlay
              playsInline
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
