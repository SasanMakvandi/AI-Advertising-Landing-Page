import type { Metadata } from "next";
import { Signup } from "@/components/Signup";

export const metadata: Metadata = {
  title: "Sign up — ReelSimple",
  description: "Create your account to view and generate content with ReelSimple.",
};

export default function SignupPage() {
  return <Signup />;
}
