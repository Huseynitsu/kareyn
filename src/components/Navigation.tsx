"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Images, Film, MapPin, Heart } from "lucide-react";

const links = [
  { href: "/", label: "Map", icon: Globe },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/edits", label: "Edits", icon: Film },
  { href: "/plans", label: "Plans", icon: MapPin },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Heart className="w-5 h-5 text-accent fill-accent/30 group-hover:fill-accent/60 transition-colors duration-300" />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-serif text-text tracking-wide">Huseyn & Karla</span>
            <span className="text-[10px] text-text-muted tracking-widest uppercase">Our World</span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                  active
                    ? "bg-accent/15 text-accent font-medium"
                    : "text-text-muted hover:text-text hover:bg-surface-elevated"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-t border-border safe-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[64px] transition-all duration-200 ${
                  active ? "text-accent" : "text-text-muted"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "fill-accent/20" : ""}`} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
