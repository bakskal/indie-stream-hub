import { Link } from "react-router-dom";
import { Facebook } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10">
      <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/85">
        <p>Website built by Why Enterprises LLC</p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="hover:text-white transition"
          >
            <Facebook className="h-3.5 w-3.5" />
          </a>
        </div>
        <p>RockOnMotionPictures Copyright {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
