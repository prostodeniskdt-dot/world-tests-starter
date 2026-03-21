import { SectionDisclaimerGate } from "@/components/SectionDisclaimerGate";

export default function AlcoholLayout({ children }: { children: React.ReactNode }) {
  return <SectionDisclaimerGate>{children}</SectionDisclaimerGate>;
}
