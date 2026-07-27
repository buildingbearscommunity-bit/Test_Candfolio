import React from 'react';

export default function BrandLogoIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <img
      src="/korsay-Icon.png"
      alt=""
      aria-hidden="true"
      className={`${className} object-contain`}
    />
  );
}
