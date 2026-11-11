import React from 'react';

interface BrandMarkProps {
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ className = 'w-7 h-7' }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="7" fill="#0F172A" />
      <path
        d="M9 22L14.2 10H17.8L23 22H19.6L18.5 19.2H13.5L12.4 22H9ZM14.5 16.5H17.5L16 12.6L14.5 16.5Z"
        fill="#FFFFFF"
      />
      <rect x="22" y="9" width="3" height="3" rx="0.75" fill="#2563EB" />
    </svg>
  );
};
