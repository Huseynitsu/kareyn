"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { searchPlaces, type PlaceResult } from "@/lib/geocode";

interface MapSearchProps {
  onSelect: (place: PlaceResult) => void;
}

export default function MapSearch({ onSelect }: MapSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const places = await searchPlaces(query);
      setResults(places);
      setLoading(false);
      setOpen(true);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (place: PlaceResult) => {
      onSelect(place);
      setQuery(place.name.split(",")[0]);
      setOpen(false);
      setResults([]);
    },
    [onSelect]
  );

  return (
    <div ref={containerRef} className="absolute top-3 left-3 right-3 md:left-3 md:right-auto md:w-80 z-20">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search places, streets, cities..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-surface/95 backdrop-blur-md border border-border text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 shadow-lg"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {open && results.length > 0 && (
        <ul className="mt-1.5 rounded-xl bg-surface/98 backdrop-blur-md border border-border shadow-xl overflow-hidden max-h-56 overflow-y-auto animate-fade-in">
          {results.map((place, i) => (
            <li key={`${place.lat}-${place.lng}-${i}`}>
              <button
                onClick={() => handleSelect(place)}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-surface-elevated transition-colors border-b border-border/50 last:border-0"
              >
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm text-text truncate">{place.name.split(",")[0]}</p>
                  <p className="text-[11px] text-text-muted line-clamp-2 leading-snug">{place.name}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
