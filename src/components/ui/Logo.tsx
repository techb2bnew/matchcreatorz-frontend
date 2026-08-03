interface LogoProps {
  iconOnly?: boolean;   // just the emblem, no wordmark
  className?: string;
}

// Sourced from public/logo.png (white artwork on a transparent background —
// only visible on dark surfaces), pre-cropped into two lockups so each usage
// gets the right aspect ratio without CSS cropping hacks:
//   logo-icon.png -> emblem only   (sidebar collapsed state)
//   logo-full.png -> emblem + wordmark, no tagline (everywhere else)
export default function Logo({ iconOnly = false, className = '' }: LogoProps) {
  const src = iconOnly ? '/logo-icon.png' : '/logo-full.png';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="MatchCreatorz" className={`object-contain ${className}`} />
  );
}
