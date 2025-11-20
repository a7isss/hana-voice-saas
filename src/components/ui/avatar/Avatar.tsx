import React from "react";
import Image from "next/image";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };
  
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  };
  
  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <div className={`relative inline-flex ${sizeClasses[size]} ${className}`}>
      {src ? (
        <Image
          className="rounded-full object-cover"
          fill
          src={src}
          alt={alt || name || "Avatar"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-500 text-white font-medium">
          <span className={textSizeClasses[size]}>
            {getInitials(name)}
          </span>
        </div>
      )}
    </div>
  );
};

export default Avatar;
