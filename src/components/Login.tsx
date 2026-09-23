"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./ui/Reveal";

export function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-[90px] lg:px-12">
      <Reveal className="mx-auto max-w-md rounded-[28px] border border-hair bg-panel p-8 shadow-[0_1px_2px_rgba(33,30,25,0.05),0_16px_36px_rgba(33,30,25,0.08)] sm:p-12">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent">
          <span className="h-[7px] w-[7px] rounded-full bg-coral" />
          Welcome back
        </div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Log in
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            required
            type="email"
            name="email"
            placeholder="Email address"
            className="rounded-xl border border-hair bg-bg px-4 py-3 text-sm text-text outline-none transition-colors placeholder:text-text-dim focus:border-accent"
          />
          <input
            required
            type="password"
            name="password"
            placeholder="Password"
            className="rounded-xl border border-hair bg-bg px-4 py-3 text-sm text-text outline-none transition-colors placeholder:text-text-dim focus:border-accent"
          />

          <button
            type="submit"
            disabled={loading}
            className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-text px-6 py-3 text-sm font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
            {!loading && (
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            )}
          </button>

          {error && <p className="text-center text-sm text-coral">{error}</p>}
        </form>

        <p className="mt-6 text-center text-sm text-text-dim">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="font-semibold text-accent hover:underline">
            Sign up
          </a>
        </p>
      </Reveal>
    </section>
  );
}
