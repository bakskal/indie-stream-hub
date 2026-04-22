import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Facebook } from "lucide-react";
import logo from "@/assets/logo.png";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItem = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-1.5 rounded-full text-sm transition ${
      isActive ? "bg-white/15 text-white" : "text-white/80 hover:text-white"
    }`;

  return (
    <header className="relative z-30">
      <div className="container flex items-center justify-between gap-6 pt-6 pb-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src={logo} alt="Rock On Motion Pictures" className="h-14 w-auto" />
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-sans text-base md:text-lg tracking-[0.18em] text-white/95 font-medium">
              ROCK ON MOTION PICTURES
            </span>
            <span className="text-[10px] tracking-[0.3em] text-white/60 mt-1 italic font-display">
              Let There Be Light
            </span>
          </div>
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
            className="text-white/80 hover:text-white"
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
