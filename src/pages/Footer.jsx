import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-6">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        
        {/* Left - Copyright */}
        <p className="text-sm">
          &copy; {year} <span className="font-semibold text-white">Gudrix</span>. All rights reserved.
        </p>

        {/* Right - Made by Joseph Bawo */}
        <p className="text-sm mt-2 md:mt-0">
          Made with 💛 by{" "}
          <a
            href="https://www.josephbawo.tech/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-semibold hover:underline"
          >
            Joseph Bawo
          </a>
        </p>

      </div>
    </footer>
  );
}
