import { Link, useLocation } from "wouter";
import { ShieldCheck, Menu, X, LogIn, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

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

            <div className="ml-3 flex items-center">
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.firstName ?? "Потребител"}
                      className="w-8 h-8 rounded-full border-2 border-blue-400 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm text-blue-100 hidden lg:block">
                    {user.firstName ?? user.email ?? "Профил"}
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-blue-100 hover:bg-white/10 transition-colors"
                    title="Изход"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden lg:block">Изход</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Влезте
                </button>
              )}
            </div>
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
            <div className="pt-2 border-t border-white/10">
              {isAuthenticated && user ? (
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    {user.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="" className="w-7 h-7 rounded-full border border-blue-400" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <span className="text-sm text-blue-100">{user.firstName ?? user.email ?? "Профил"}</span>
                  </div>
                  <button onClick={logout} className="flex items-center gap-1 text-sm text-blue-200 hover:text-white transition-colors">
                    <LogOut className="w-4 h-4" />
                    Изход
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { login(); setMobileOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Влезте
                </button>
              )}
            </div>
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
