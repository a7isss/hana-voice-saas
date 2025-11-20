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

const ThreeColumnImageGrid: React.FC<ImageGridProps> = ({ images, className = "" }) => {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {images.map((image, index) => (
        <div key={index} className={`relative aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg ${image.className || ""}`}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ))}
    </div>
  );
};

export default ThreeColumnImageGrid;
