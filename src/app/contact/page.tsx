import type { Metadata } from "next";
import { Contact } from "@/components/Contact";

export const metadata: Metadata = {
  title: "Contact — ReelSimple",
  description: "Tell us what you need shot and we'll follow up within a couple of days.",
};

export default function ContactPage() {
  return <Contact />;
}
