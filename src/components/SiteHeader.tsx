import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Facebook } from "lucide-react";
import logo from "@/assets/logo.png";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItem = ({ isActive }: { isActive: boolean }) =>
    `px-2.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition ${
      isActive ? "bg-white/15 text-white" : "text-white/80 hover:text-white"
    }`;

  return (
    <header className="relative z-30">
      <div className="container flex items-center justify-between gap-2 sm:gap-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
        {/* Logo with spotlight beam */}
        <Link to="/" className="flex items-center gap-3 sm:gap-4 shrink-0 group min-w-0">
          <div className="relative shrink-0 ml-7 sm:ml-0">
            <img
              src={logo}
              alt="Rock On Motion Pictures"
              className="h-12 sm:h-16 w-auto relative z-10 drop-shadow-[0_0_18px_rgba(120,200,255,0.55)]"
            />
            {/* Spotlight beam pointing down, centered under the logo */}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 pointer-events-none w-[140px] sm:w-[180px] h-[56px] sm:h-[70px]"
              style={{
                background:
                  "linear-gradient(180deg, hsla(200, 95%, 75%, 0.55) 0%, hsla(200, 90%, 70%, 0.18) 50%, transparent 100%)",
                clipPath: "polygon(35% 0, 65% 0, 100% 100%, 0 100%)",
                filter: "blur(6px)",
                marginTop: "-6px",
              }}
            />
            {/* "Let There Be Light" tagline — centered under the logo */}
            <span className="absolute top-[calc(100%+22px)] sm:top-[calc(100%+30px)] left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-[10px] sm:text-[11px] tracking-[0.15em] text-white/90 italic">
              Let There Be Light
            </span>
          </div>
          <span className="hidden sm:inline font-sans text-base md:text-lg tracking-[0.18em] text-white/95 font-medium">
            ROCK ON MOTION PICTURES
          </span>
        </Link>

        {/* Nav pill */}
        <nav className="nav-pill">
          <NavLink to="/about" className={navItem}>About</NavLink>
          <NavLink to="/press" className={navItem}>Press Release</NavLink>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="hidden sm:inline text-white/80 hover:text-white"
          >
            <Facebook className="h-4 w-4" />
          </a>
          {user ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={signOut}
              className="rounded-full bg-white text-primary hover:bg-white/90"
            >
              Logout
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              className="rounded-full bg-white text-primary hover:bg-white/90"
            >
              <Link to={`/login?from=${encodeURIComponent(location.pathname)}`}>Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
