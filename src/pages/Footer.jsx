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
      className={`${fixedClasses} w-full border-t border-neutral-800 bg-black/95 supports-[backdrop-filter]:bg-black/80 backdrop-blur ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4">
        {/* Grid on mobile -> 3 columns on sm+: [brand | nav | actions] */}
        <div className="grid grid-cols-1 gap-3 py-3 text-xs text-gray-300 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="font-semibold font-orbitron lowercase text-white">
              gudrix
            </span>
            <span className="font-semibold font-orbitron lowercase">
              © {new Date().getFullYear()}
            </span>
            <p>All Rights Reserved</p>
          </div>

         

          {/* Actions */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end sm:gap-3">
           

            <a
              href="https://www.josephbawo.tech/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Visit Joseph Bawo's website"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-700/60 bg-neutral-900/40 px-3 py-1.5 text-[11px] text-gray-300 transition hover:border-neutral-600 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-700 sm:w-auto"
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
