import React from 'react';

const MessengerIcon = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    fill="currentColor"
  >
    <path d="M12 2C6.5 2 2 6.14 2 11.25c0 2.92 1.48 5.53 3.8 7.15V22l3.41-1.87c.88.24 1.8.37 2.79.37 5.5 0 10-4.14 10-9.25S17.5 2 12 2zm1.2 12l-2.6-2.77-5.07 2.77 5.57-5.92 2.6 2.77 5.07-2.77-5.57 5.92z" />
  </svg>
);

export default MessengerIcon;
