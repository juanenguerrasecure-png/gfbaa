const WIcon = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width={size} height={size} className={className} aria-hidden="true">
    <rect className="whatnot-bg" width="100" height="80" rx="16" fill="#1A1A1A" />
    <text x="50" y="52" textAnchor="middle" fontSize="34" fontWeight="800" fill="#F5E642" fontFamily="Arial, sans-serif">W</text>
  </svg>
);

export default WIcon;
