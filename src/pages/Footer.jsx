// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

export default function Footer({
  className = "",
  whatsAppNumber = "+234 805 471 7837",
  fixed = false,
}) {
  const digits = whatsAppNumber.replace(/[^\d]/g, "");
  const fixedClasses = fixed ? " " : "";

  return (
  <footer
  role="contentinfo"
  className={`w-full border-t border-neutral-800 bg-black/95 supports-[backdrop-filter]:bg-black/80 backdrop-blur ${className}`}
>
  <div className="mx-auto max-w-7xl px-4 py-4">
    
    {/* Desktop: 3 columns | Mobile: stacked */}
    <div className="flex flex-col gap-4 text-xs text-gray-300 sm:flex-row sm:items-center sm:justify-between">
      
      {/* Left - Brand */}
      <div className="flex items-center gap-2">
        <span className="font-semibold font-orbitron lowercase text-white">
          gudrix
        </span>
        <span className="font-semibold font-orbitron lowercase">
          © {new Date().getFullYear()}
        </span>
        <span>All Rights Reserved</span>
      </div>

      {/* Center - Legal Links */}
      <div className="flex items-center justify-center gap-6 text-[11px]">
        <Link
          to="/terms"
          className="transition hover:text-white"
        >
          Terms & Conditions
        </Link>

        <Link
          to="/privacy"
          className="transition hover:text-white"
        >
          Privacy Policy
        </Link>
      </div>

      {/* Right - Credit */}
      <div className="flex justify-center sm:justify-end">
        <a
          href="https://www.josephbawo.tech/"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Visit Joseph Bawo's website"
          className="group inline-flex items-center gap-2 rounded-full border border-neutral-700/60 bg-neutral-900/40 px-3 py-1.5 text-[11px] text-gray-300 transition hover:border-neutral-600 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-700"
        >
          <span className="opacity-80 group-hover:opacity-100">
            Made by
          </span>

          <span className="bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text font-semibold text-transparent">
            Joseph Bawo
          </span>

          <ExternalLink className="h-3.5 w-3.5 opacity-50 group-hover:opacity-90" />
        </a>
      </div>
    </div>
  </div>
</footer>
  );
}