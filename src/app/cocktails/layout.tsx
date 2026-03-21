import { SectionDisclaimerGate } from "@/components/SectionDisclaimerGate";

export default function CocktailsLayout({ children }: { children: React.ReactNode }) {
  return <SectionDisclaimerGate>{children}</SectionDisclaimerGate>;
}
