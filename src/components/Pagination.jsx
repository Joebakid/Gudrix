import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  if (totalPages <= 1) return null;

  const pages = [];

  const addPage = (p) => {
    if (!pages.includes(p) && p >= 1 && p <= totalPages) {
      pages.push(p);
    }
  };

  // First page
  addPage(1);

  // Pages around current
  addPage(currentPage - 1);
  addPage(currentPage);
  addPage(currentPage + 1);

  // Last page
  addPage(totalPages);

  pages.sort((a, b) => a - b);

  const handleChange = (page) => {
    if (page === currentPage) return;

    setIsAnimating(true);
    onPageChange(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setTimeout(() => {
      setIsAnimating(false);
    }, 400);
  };

  return (
    <div className="flex justify-center mt-12">
      <div
        className={`flex items-center gap-1 bg-white border rounded-full px-3 py-2 shadow-sm transition-all duration-300
          ${
            isAnimating
              ? "opacity-60 -translate-y-1"
              : "opacity-100 translate-y-0"
          }`}
      >
        {/* PREVIOUS */}
        <button
          onClick={() => handleChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 rounded-full text-sm disabled:opacity-40 hover:bg-neutral-100 transition"
        >
          <FiChevronLeft />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* PAGE NUMBERS */}
        <div className="flex items-center gap-1">
          {pages.map((page, i) => {
            const prev = pages[i - 1];
            const showDots = prev && page - prev > 1;

            return (
              <span key={page} className="flex items-center gap-1">
                {showDots && (
                  <span className="px-2 text-neutral-400">…</span>
                )}

                <button
                  onClick={() => handleChange(page)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-sm transition-all duration-300
                    ${
                      page === currentPage
                        ? "bg-indigo-600 text-white shadow scale-110"
                        : "hover:bg-neutral-100"
                    }`}
                >
                  {page}
                </button>
              </span>
            );
          })}
        </div>

        {/* NEXT */}
        <button
          onClick={() => handleChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-full text-sm disabled:opacity-40 hover:bg-neutral-100 transition"
        >
          <span className="hidden sm:inline">Next</span>
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}
