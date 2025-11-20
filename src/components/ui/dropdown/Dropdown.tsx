import React, { useRef, useEffect } from "react";

interface DropdownProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const Dropdown: React.FC<DropdownProps> = ({ children, className = "", isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && onClose) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  if (isOpen === false) return null;
  
  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {children}
    </div>
  );
};

export { Dropdown };
