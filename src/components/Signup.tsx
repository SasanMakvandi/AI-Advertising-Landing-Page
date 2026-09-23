"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Upload, X } from "lucide-react";
import { Reveal } from "./ui/Reveal";
import { AutoScrollPhone } from "./AutoScrollPhone";

type Status = "idle" | "submitting" | "error";

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Organization" },
  { id: 3, label: "Branding" },
];

const inputClass =
  "rounded-xl border border-hair bg-bg px-4 py-3 text-sm text-text outline-none transition-colors placeholder:text-text-dim focus:border-accent";

export function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");

  const [slogan, setSlogan] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  function handleStep1Continue() {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setStep(2);
  }

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    setStatus("submitting");
    setError("");

    const formData = new FormData();
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);
    formData.set("organization", organization);
    formData.set("role", role);
    formData.set("slogan", slogan);
    if (logoFile) formData.set("logo", logoFile);

    try {
      const res = await fetch("/api/signup", { method: "POST", body: formData });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong — please try again.");
      }

      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error) throw new Error("Account created — please log in.");

      router.push("/dashboard");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    }
  }

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-[90px] lg:px-12">
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center">
      <Reveal className="w-full max-w-2xl rounded-[28px] border border-hair bg-panel p-8 shadow-[0_1px_2px_rgba(33,30,25,0.05),0_16px_36px_rgba(33,30,25,0.08)] sm:p-12">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent">
          <span className="h-[7px] w-[7px] rounded-full bg-coral" />
          Create your account
        </div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Start your project
        </h1>
        <p className="mt-4 text-base leading-relaxed text-text-dim">
          A few details so we can tailor content to your brand — then you&apos;re
          ready to start creating.
        </p>

        <div className="mt-8 flex items-center gap-2">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                  step >= s.id ? "bg-text text-bg" : "bg-panel-2 text-text-dim"
                }`}
              >
                {s.id}
              </div>
              <span
                className={`text-[12.5px] font-medium ${step >= s.id ? "text-text" : "text-text-dim"}`}
              >
                {s.label}
              </span>
              {s.id !== STEPS.length && <div className="h-px flex-1 bg-hair" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                />
                <input
                  required
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <input
                required
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <input
                required
                type="password"
                placeholder="Password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              <input
                required
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />

              <button
                type="button"
                onClick={handleStep1Continue}
                className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-text px-6 py-3 text-sm font-semibold text-bg transition-colors hover:bg-accent"
              >
                Continue
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  placeholder="Organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className={inputClass}
                />
                <input
                  placeholder="Role in organization"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center justify-center rounded-full border border-hair px-6 py-3 text-sm font-semibold text-text-dim transition-colors hover:border-text/30 hover:text-text"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-text px-6 py-3 text-sm font-semibold text-bg transition-colors hover:bg-accent"
                >
                  Continue
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-[13px] text-text-dim">
                Optional — add these now, or skip and set them up later.
              </p>

              <input
                placeholder="Slogan"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className={inputClass}
              />

              <div>
                <span className="mb-2 block text-[11.5px] font-semibold tracking-wide text-text-dim uppercase">
                  Company logo
                </span>
                {logoPreview ? (
                  <div className="flex items-center gap-3 rounded-xl border border-hair bg-bg px-4 py-3">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <span className="flex-1 truncate text-sm text-text-dim">{logoFile?.name}</span>
                    <button
                      type="button"
                      aria-label="Remove logo"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                      className="rounded-full p-1.5 text-text-dim transition-colors hover:bg-panel-2 hover:text-text"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-hair bg-bg px-4 py-6 text-sm text-text-dim transition-colors hover:border-accent hover:text-text">
                    <Upload size={16} />
                    Upload a logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center justify-center rounded-full border border-hair px-6 py-3 text-sm font-semibold text-text-dim transition-colors hover:border-text/30 hover:text-text"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-text px-6 py-3 text-sm font-semibold text-bg transition-colors hover:bg-accent disabled:opacity-60"
                >
                  {status === "submitting" ? "Creating account..." : "Create account"}
                  {status !== "submitting" && (
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              </div>
              {!slogan && !logoFile && (
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="text-center text-[13px] font-semibold text-text-dim hover:text-text disabled:opacity-60"
                >
                  Skip for now
                </button>
              )}
            </>
          )}

          {error && <p className="text-center text-sm text-coral">{error}</p>}
        </form>

        <p className="mt-6 text-center text-sm text-text-dim">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-accent hover:underline">
            Log in
          </a>
        </p>
      </Reveal>

      <Reveal delay={0.15} className="hidden shrink-0 lg:block">
        <AutoScrollPhone />
      </Reveal>
      </div>
    </section>
  );
}
