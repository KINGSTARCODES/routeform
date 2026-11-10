import { Flask } from "@phosphor-icons/react";

/** The single, persistent disclaimer for the whole site. */
export default function ConceptBanner() {
  return (
    <div className="concept-banner" role="note">
      <Flask size={14} aria-hidden="true" />
      <span>Interface concept for NEAR Intents · Demo data only, nothing is signed or sent.</span>
    </div>
  );
}
