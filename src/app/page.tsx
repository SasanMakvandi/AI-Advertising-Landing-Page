import { BackgroundFX } from "@/components/BackgroundFX";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Showcase } from "@/components/Showcase";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <BackgroundFX />
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Showcase />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
