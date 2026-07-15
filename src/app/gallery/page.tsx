import GalleryGrid from "@/components/GalleryGrid";
import FadeIn from "@/components/FadeIn";

export default function GalleryPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <FadeIn className="mb-8">
        <h1 className="text-2xl md:text-3xl font-serif text-text">Gallery</h1>
        <p className="text-sm text-text-muted mt-1">
          Our photos and videos — moments we never want to forget
        </p>
      </FadeIn>
      <GalleryGrid />
    </div>
  );
}
