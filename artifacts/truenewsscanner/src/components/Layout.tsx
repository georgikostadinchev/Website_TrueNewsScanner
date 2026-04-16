import { Link, useLocation } from "wouter";
import { ShieldCheck, Menu, X, LogIn, LogOut, User, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Проверка" },
    { href: "/report", label: "Докладвай" },
    ...(user?.isAdmin ? [{ href: "/admin", label: "Администрация" }] : []),
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm py-3" 
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group outline-none">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl leading-none tracking-tight text-foreground">
                TrueNews<span className="text-primary">Scanner</span>
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-500" />
                Активна защита
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <div className="flex items-center bg-muted/50 p-1 rounded-full border border-border">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-colors outline-none ${
                      isActive ? "text-primary-foreground" : "text-foreground hover:text-primary"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-primary rounded-full shadow-md"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="ml-4 pl-4 border-l border-border flex items-center">
              {isLoading ? (
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.firstName ?? "Потребител"}
                        className="w-9 h-9 rounded-full border border-border object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground border border-border flex items-center justify-center shadow-sm">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors outline-none"
                    title="Изход"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm outline-none"
                >
                  <LogIn className="w-4 h-4" />
                  Вход
                </button>
              )}
            </div>
          </nav>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground transition-colors outline-none"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-b border-border bg-background"
            >
              <div className="px-6 py-4 flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = location === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="h-px bg-border my-2" />
                {isAuthenticated && user ? (
                  <div className="flex items-center justify-between px-2 py-2">
                    <div className="flex items-center gap-3">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="" className="w-10 h-10 rounded-full border border-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <User className="w-5 h-5 text-secondary-foreground" />
                        </div>
                      )}
                      <span className="font-semibold text-foreground">{user.firstName ?? user.email ?? "Профил"}</span>
                    </div>
                    <button onClick={logout} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-2 font-medium">
                      <LogOut className="w-5 h-5" />
                      Изход
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { login(); setMobileOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-semibold bg-foreground text-background transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    Влезте в профила си
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="mt-auto border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <span className="font-bold text-foreground tracking-tight">TrueNewsScanner</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground text-center md:text-right max-w-md leading-relaxed">
              Инструмент за гражданска защита. Предоставя оценки, базирани на доказателства, без претенция за абсолютна истина.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
