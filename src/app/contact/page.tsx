import type { Metadata } from "next";
import { Contact } from "@/components/Contact";

export const metadata: Metadata = {
  title: "Contact — adnova",
  description: "Tell us about your next campaign and we'll follow up within a couple of days.",
};

export default function ContactPage() {
  return <Contact />;
}
