"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function Loader() {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-[2px] nav-loader-overlay">
      <div className="nav-loader-dialog flex flex-col items-center gap-5 rounded-2xl bg-white px-12 py-8 shadow-2xl">
        {/* Double-ring spinner */}
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-slate-100 border-t-primary" />
          <div
            className="absolute inset-[6px] animate-spin rounded-full border-[3px] border-transparent border-t-primary/50"
            style={{ animationDirection: "reverse", animationDuration: "0.65s" }}
          />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-0.5 text-center">
          <p className="text-sm font-semibold text-slate-700">Loading</p>
          <p className="text-xs text-slate-400">Please wait…</p>
        </div>

        {/* Bouncing dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block h-2 w-2 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Show loader on internal link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target === "_blank") return;
      if (anchor.hasAttribute("download")) return;
      // Skip external links
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) return;

      const targetPath = href.startsWith("http")
        ? new URL(href).pathname
        : href.split("?")[0];

      // Only show loader when actually changing the route
      if (targetPath !== pathname) {
        setLoading(true);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  // Hide loader when navigation settles
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // Safety fallback: auto-dismiss after 8 s
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  if (!loading) return null;
  return <Loader />;
}

// useSearchParams must be wrapped in Suspense
export function NavigationLoader() {
  return (
    <Suspense>
      <NavigationLoaderInner />
    </Suspense>
  );
}
