import EditsGrid from "@/components/EditsGrid";
import FadeIn from "@/components/FadeIn";

export default function EditsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <FadeIn className="mb-8">
        <h1 className="text-2xl md:text-3xl font-serif text-text">Edits</h1>
        <p className="text-sm text-text-muted mt-1">
          Video edits we made together
        </p>
      </FadeIn>
      <EditsGrid />
    </div>
  );
}
