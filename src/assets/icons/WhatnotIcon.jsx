const WhatnotIcon = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 80"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
  >
    <rect width="100" height="80" rx="16" fill="#1A1A1A" />
    <path
      fill="#F5E642"
      d="M15 15
         C15 5 25 2 33 8
         C38 12 42 18 50 26
         C58 18 62 12 67 8
         C75 2 85 5 85 15
         C85 28 74 38 50 58
         C26 38 15 28 15 15Z"
    />
  </svg>
);

export default WhatnotIcon;
