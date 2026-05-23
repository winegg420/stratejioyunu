/** Emoji yerine her platformda görünen küçük bayrak SVG'leri */

export function TurkeyFlagIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 24"
      width="28"
      height="18"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="36" height="24" fill="#E30A17" />
      <circle cx="13" cy="12" r="5.5" fill="#fff" />
      <circle cx="14.6" cy="12" r="4.4" fill="#E30A17" />
      <polygon
        fill="#fff"
        points="19.5,12 24.8,13.6 22.2,9.2 22.2,14.8 24.8,10.4"
      />
    </svg>
  );
}

export function UkFlagIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 60 30"
      width="28"
      height="18"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <clipPath id="uk-s">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="uk-t">
        <path d="M30,15 h30 v15 z v-30 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#uk-s)">
        <rect width="60" height="30" fill="#012169" />
        <path stroke="#fff" strokeWidth="6" d="M0,0 60,30 M60,0 0,30" />
        <path
          stroke="#C8102E"
          strokeWidth="4"
          d="M0,0 60,30 M60,0 0,30"
          clipPath="url(#uk-t)"
        />
        <path stroke="#fff" strokeWidth="10" d="M30,0 v30 M0,15 h60" />
        <path stroke="#C8102E" strokeWidth="6" d="M30,0 v30 M0,15 h60" />
      </g>
    </svg>
  );
}
