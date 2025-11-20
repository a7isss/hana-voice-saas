import React from "react";
import Image from "next/image";

interface ImageGridProps {
  images: Array<{
    src: string;
    alt: string;
    className?: string;
  }>;
  className?: string;
}

const TwoColumnImageGrid: React.FC<ImageGridProps> = ({ images, className = "" }) => {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${className}`}>
      {images.map((image, index) => (
        <div key={index} className={`relative aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg ${image.className || ""}`}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
      ))}
    </div>
  );
};

export default TwoColumnImageGrid;
