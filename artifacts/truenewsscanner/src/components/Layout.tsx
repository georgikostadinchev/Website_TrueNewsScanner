import { Link, useLocation } from "wouter";
import { ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Провери" },
    { href: "/report", label: "Докладвай" },
    { href: "/admin", label: "Администрация" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-[hsl(222,47%,11%)] text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity">
            <ShieldCheck className="w-7 h-7 text-blue-400" />
            <span>TrueNews<span className="text-blue-400">Scanner</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === link.href
                    ? "bg-blue-600 text-white"
                    : "text-blue-100 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === link.href
                    ? "bg-blue-600 text-white"
                    : "text-blue-100 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-[hsl(222,47%,11%)] text-blue-200 py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white">TrueNewsScanner</span>
            </div>
            <p className="text-sm text-center text-blue-300">
              Продуктът не претендира за абсолютна истина. Предоставя оценки, базирани на доказателства и рискова оценка.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
