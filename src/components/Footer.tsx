import { Container } from "./ui/Container";
import { brand, navLinks } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <Container className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="font-display text-base font-semibold">{brand.name}</p>
          <p className="mt-1 text-sm text-muted-2">{brand.tagline}</p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="text-sm text-muted-2">
          © {new Date().getFullYear()} {brand.name}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
