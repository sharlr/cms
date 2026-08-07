import Image from "next/image";
import type { News } from "@/generated/prisma";
import { formatDay } from "@/lib/format";

/** Carte d'actualité : image optionnelle, titre, date et extrait. */
export function NewsCard({ news, featured = false }: { news: News; featured?: boolean }) {
  return (
    <article
      className={`card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] ${
        featured ? "md:col-span-2" : ""
      }`}
    >
      {news.imageUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-surface-sunken">
          <Image
            src={news.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : null}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          {news.isPinned ? (
            <span className="pill bg-gold-100 text-gold-700">À la une</span>
          ) : null}
          {news.publishedAt ? (
            <time
              dateTime={news.publishedAt.toISOString()}
              className="text-xs font-semibold text-ink-faint"
            >
              {formatDay(news.publishedAt)}
            </time>
          ) : null}
        </div>

        <h3 className="mt-2 text-lg leading-snug font-bold text-ink">{news.title}</h3>
        <p className="mt-2 line-clamp-3 text-[0.925rem] leading-relaxed text-ink-soft">
          {news.body}
        </p>

        {news.videoUrl ? (
          <a
            href={news.videoUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
          >
            <span aria-hidden="true">▶</span> Voir la vidéo
          </a>
        ) : null}
      </div>
    </article>
  );
}
