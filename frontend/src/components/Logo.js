export default function Logo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 100 100"
      className="w-10 h-10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Circle */}
      <circle cx="50" cy="50" r="45" stroke="black" strokeWidth="4" />
      
      {/* Anarchy Symbol - A */}
      <g stroke="black" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Top left line */}
        <line x1="20" y1="70" x2="50" y2="20" />
        
        {/* Top right line */}
        <line x1="80" y1="70" x2="50" y2="20" />
        
        {/* Bottom horizontal line */}
        <line x1="35" y1="55" x2="65" y2="55" />
      </g>
      
      {/* Vertical dividers (cross) */}
      <line x1="50" y1="15" x2="50" y2="85" stroke="black" strokeWidth="3" strokeLinecap="round" />
      <line x1="15" y1="50" x2="85" y2="50" stroke="black" strokeWidth="3" strokeLinecap="round" />
      
      {/* Red accent - circle segment */}
      <g>
        <path
          d="M 50 25 A 25 25 0 0 1 65 35"
          stroke="#FF0000"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 70 50 A 25 25 0 0 1 65 65"
          stroke="#FF0000"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
