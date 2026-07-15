import DataBackup from "@/components/DataBackup";
import GlobeMap from "@/components/GlobeMap";
import FadeIn from "@/components/FadeIn";
import { Heart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="h-[calc(100dvh-0px)] md:h-[calc(100dvh-65px)] flex flex-col">
      <FadeIn className="px-4 md:px-8 pt-4 md:pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-accent fill-accent/20 md:hidden" />
          <h1 className="text-2xl md:text-3xl font-serif text-text">Our Map</h1>
        </div>
        <p className="text-sm text-text-muted mt-1">
          Every place we&apos;ve been, everywhere we&apos;re going — Huseyn & Karla
        </p>
        <div className="mt-2 md:hidden">
          <DataBackup />
        </div>
      </FadeIn>
      <div className="flex-1 px-4 md:px-8 pb-4 md:pb-6 min-h-0">
        <GlobeMap />
      </div>
    </div>
  );
}
