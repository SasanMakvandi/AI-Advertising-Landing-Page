"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { Container } from "./ui/Container";
import { navLinks } from "@/lib/content";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isActive = (href: string) => {
    const path = href.split("#")[0] || "/";
    return path !== "/" && pathname.startsWith(path);
  };

  const loggedIn = status === "authenticated" && !!session?.user;

  return (
    <header className="relative z-50 border-b border-hair">
      <Container className="flex h-[76px] items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight text-text lowercase">
          reelsimple
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[14.5px] font-medium transition-colors hover:text-text ${
                isActive(link.href) ? "text-text" : "text-text-dim"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {loggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-[14.5px] font-medium text-text-dim transition-colors hover:text-text"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full bg-text px-5 py-[11px] text-sm font-semibold text-bg transition-colors hover:bg-accent"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[14.5px] font-medium text-text-dim transition-colors hover:text-text"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-text px-5 py-[11px] text-sm font-semibold text-bg transition-colors hover:bg-accent"
              >
                Start your project
              </Link>
            </>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          className="text-text md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-hair bg-bg md:hidden">
          <Container className="flex flex-col gap-4 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-base text-text-dim hover:text-text"
              >
                {link.label}
              </Link>
            ))}
            {loggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="text-base text-text-dim hover:text-text"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="mt-2 rounded-full bg-text px-4 py-2 text-center text-sm font-semibold text-bg"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-base text-text-dim hover:text-text"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-full bg-text px-4 py-2 text-center text-sm font-semibold text-bg"
                >
                  Start your project
                </Link>
              </>
            )}
          </Container>
        </div>
      )}
    </header>
  );
}
