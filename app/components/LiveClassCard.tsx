import React from "react";
import Image from "next/image";
import { Clock } from "lucide-react"; // Or any clock icon lib

interface LiveClassCardProps {
  teacherName: string;
  teacherImage?: string;
  subject: string;
  startTime: string;
  tag: string;
  onClick?: () => void;
  priority?: boolean;
}

const LiveClassCard: React.FC<LiveClassCardProps> = ({
  teacherName,
  teacherImage = "/assets/img/teacher-placeholder.png",
  subject,
  startTime,
  tag,
  onClick,
  priority = false,
}) => {
  return (
    <div
      className="bg-background border p-2 rounded-md shadow-md hover:shadow-lg transition cursor-pointer select-none overflow-hidden"
      style={{
        width: "220px",
        minWidth: "220px",
        maxWidth: "220px",
      }}
      onClick={onClick}
    >
      {/* Top Image with Background */}
      <div
        className="relative w-full h-28 bg-center bg-cover"
        style={{
          backgroundImage:
            "url('https://study-mf.pw.live/static/image/teacherbg.807b2b2f.png')",
        }}
      >
        <Image
          src={teacherImage}
          alt={teacherName}
          fill
          style={{ objectFit: "contain" }}
          draggable={false}
          priority={priority}
        />
        {/* Name Overlay */}
        {teacherName?.trim() && (
          <div className="absolute capitalize bottom-0 w-full bg-foreground bg-opacity-90 text-background text-sm font-medium text-center py-1">
            {teacherName}
          </div>
        )}
      </div>

      {/* Status + Time */}
      <div className="flex justify-between items-center py-3 text-xs uppercase">
        <span
          className={`px-2 py-1 rounded-md font-medium ${
            tag.toUpperCase() === "LIVE"
              ? "bg-red-600 text-white"
              : tag.toUpperCase() === "UPCOMING"
              ? "bg-purple-600 text-purple-100" // my favorite color is purple 😊
              : tag.toUpperCase() === "ENDED"
              ? "bg-emerald-500 text-green-100"
              : "bg-blue-600 text-blue-100"
          }`}
        >
          {tag}
        </span>

        <span
          className="flex items-center
         text-muted-foreground

         gap-1 uppercase"
        >
          <Clock size={14} className="stroke-[2.5]" />
          {startTime}
        </span>
      </div>

      {/* Subject */}
      <div className=" py-1 text-sm font-semibold text-foreground text-center border border-t-1 border-x-0  border-b-0 ">
        {subject}
      </div>
    </div>
  );
};

export default LiveClassCard;
