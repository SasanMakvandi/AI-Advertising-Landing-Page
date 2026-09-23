import { Hero } from "@/components/Hero";
import { PromptDemo } from "@/components/PromptDemo";
import { CapabilityStrip } from "@/components/CapabilityStrip";
import { Showcase } from "@/components/Showcase";
import { LogoMarquee } from "@/components/LogoMarquee";
import { PhoneReels } from "@/components/PhoneReels";
import { Pricing } from "@/components/Pricing";

export default function Home() {
  return (
    <>
      <Hero />
      <PromptDemo />
      <CapabilityStrip />
      <Showcase />
      <LogoMarquee />
      <PhoneReels />
      <Pricing />
    </>
  );
}
