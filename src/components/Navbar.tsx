"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Container } from "./ui/Container";
import { navLinks } from "@/lib/content";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    const path = href.split("#")[0] || "/";
    return path !== "/" && pathname.startsWith(path);
  };

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

        <Link
          href="/contact"
          className="hidden rounded-full bg-text px-5 py-[11px] text-sm font-semibold text-bg transition-colors hover:bg-accent md:inline-block"
        >
          Start your project
        </Link>

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
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-text px-4 py-2 text-center text-sm font-semibold text-bg"
            >
              Start your project
            </Link>
          </Container>
        </div>
      )}
    </header>
  );
}
