/** Routeform logo: vector (sharp at any size), shared by every page header and footer. */
export function LogoMark({ size = 32 }) {
  return <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="rf-bg" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#16303a"/><stop offset="1" stopColor="#08141a"/></linearGradient>
      <linearGradient id="rf-ln" x1="14" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#4fe0c4"/><stop offset="1" stopColor="#72d7ff"/></linearGradient>
      <linearGradient id="rf-bd" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#72d7ff" stopOpacity=".55"/><stop offset="1" stopColor="#44c7b0" stopOpacity=".12"/></linearGradient>
    </defs>
    <rect x="1.5" y="1.5" width="61" height="61" rx="17" fill="url(#rf-bg)" stroke="url(#rf-bd)" strokeWidth="1.5"/>
    <path d="M19 49V16h15a11 11 0 0 1 0 22H19m15 0 12 11M32 38l12-16" fill="none" stroke="url(#rf-ln)" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="46" cy="16" r="5" fill="#fff" stroke="url(#rf-ln)" strokeWidth="2.6"/>
  </svg>;
}

export default function Brand({ footer = false, href = "/" }) {
  return <a className={`brand${footer ? " brand-footer" : ""}`} href={href} aria-label="Routeform home"><LogoMark size={footer ? 30 : 34}/><span>routeform</span></a>;
}
