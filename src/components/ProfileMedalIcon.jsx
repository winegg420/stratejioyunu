/** Profil rozeti — vektör madalya (emoji yerine, keskin görünüm). */

export default function ProfileMedalIcon({ className = '', size = 72 }) {
  return (
    <svg
      className={['profile-medal-icon', className].filter(Boolean).join(' ')}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="Komutan rozeti"
    >
      <defs>
        <linearGradient id="profileMedalFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7a8" />
          <stop offset="100%" stopColor="#3d7a52" />
        </linearGradient>
        <linearGradient id="profileMedalRibbon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#2d6a45" />
        </linearGradient>
      </defs>
      <path
        d="M18 44 14 58h8l2-6 4 6h8l-4-14-6 2Z"
        fill="url(#profileMedalRibbon)"
        stroke="#1a3020"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <circle
        cx="32"
        cy="26"
        r="17"
        fill="url(#profileMedalFill)"
        stroke="#8dffc0"
        strokeWidth="1.4"
      />
      <circle cx="32" cy="26" r="12" fill="none" stroke="#1a3020" strokeWidth="0.9" opacity="0.35" />
      <path
        d="M32 14 35.2 22.5H44l-6.8 5 2.6 8.5L32 31.5 24.2 36l2.6-8.5L20 22.5h8.8L32 14Z"
        fill="#0f1a12"
        opacity="0.82"
      />
      <path
        d="M26 38h12"
        stroke="#8dffc0"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}
