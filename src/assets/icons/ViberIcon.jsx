const ViberIcon = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
    <rect className="viber-bg" width="48" height="48" rx="12" fill="#7360F2" />
    <circle cx="24" cy="22" r="11" fill="white" />
    <path d="M18 18c1 7 5 11 12 12" stroke="#7360F2" strokeWidth="4" strokeLinecap="round" fill="none" />
    <circle cx="30" cy="30" r="2.5" fill="#7360F2" />
  </svg>
);

export default ViberIcon;
