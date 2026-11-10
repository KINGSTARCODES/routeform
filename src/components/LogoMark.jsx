import nearUrl from "../assets/logo-near.png";
import routeformUrl from "../assets/logo-routeform.png";

// N slots: all NEAR marks (orb node, eco chips, flow origin, token, wallet)
// R slots: Routeform brand + central orb + wallet art orb + closing token.
// R uses the actual uploaded Routeform logo asset (logo-routeform.png), converted
// to a transparent PNG so it sits cleanly on the existing dark UI. N stays on logo-near.png.
export function LogoMark({ size = 24 }) {
  return <img src={nearUrl} width={size} height={size} style={{ display: "block", width: size, height: size, objectFit: "contain" }} alt="" aria-hidden="true" />;
}
export function RLogoMark({ size = 24 }) {
  return <img src={routeformUrl} width={size} height={size} style={{ display: "block", width: size, height: size, objectFit: "contain" }} alt="" aria-hidden="true" />;
}
export default LogoMark;
