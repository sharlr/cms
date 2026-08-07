import { parseRichText } from "@/lib/content";

/** Rendu d'un texte administrateur : paragraphes et listes à puces. */
export function RichText({ body, className = "" }: { body: string; className?: string }) {
  const blocks = parseRichText(body);

  return (
    <div className={`space-y-3.5 text-[0.975rem] leading-relaxed text-ink-soft ${className}`}>
      {blocks.map((block, index) =>
        block.kind === "paragraph" ? (
          <p key={index}>{block.text}</p>
        ) : (
          <ul key={index} className="space-y-2">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
