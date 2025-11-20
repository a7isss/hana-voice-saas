import React from "react";
import Link from "next/link";

interface DropdownItemProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  onItemClick?: () => void;
  tag?: string;
}

const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  href,
  onClick,
  className = "",
  onItemClick,
  tag,
}) => {
  const baseClasses = "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900";
  
  const handleClick = onClick || onItemClick;
  
  const classes = `${baseClasses} ${className}`;
  
  // If tag is explicitly set to "a" or href is provided, use Link
  if (tag === "a" || href) {
    return (
      <Link href={href || "#"} className={classes}>
        {children}
      </Link>
    );
  }
  
  return (
    <button onClick={handleClick} className={classes}>
      {children}
    </button>
  );
};

export { DropdownItem };
