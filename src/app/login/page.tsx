import type { Metadata } from "next";
import { Login } from "@/components/Login";

export const metadata: Metadata = {
  title: "Log in — ReelSimple",
  description: "Log in to your ReelSimple account.",
};

export default function LoginPage() {
  return <Login />;
}
