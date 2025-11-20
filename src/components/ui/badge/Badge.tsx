import React, { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "error" | "warning" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: string; // For backward compatibility
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  color,
}) => {
  // Map old color prop to new variant prop for compatibility
  const actualVariant = color === "success" ? "success" :
                       color === "error" ? "error" :
                       color === "warning" ? "warning" :
                       color === "info" ? "info" :
                       variant;
  
  const baseClasses = "inline-flex items-center font-medium rounded-full";
  
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
  };
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-sm",
    lg: "px-3 py-1 text-sm",
  };
  
  const classes = `${baseClasses} ${variantClasses[actualVariant]} ${sizeClasses[size]} ${className}`;
  
  return <span className={classes}>{children}</span>;
};

export default Badge;
