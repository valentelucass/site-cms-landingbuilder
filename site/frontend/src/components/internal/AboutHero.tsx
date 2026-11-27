import { ActionLink, PageContainer, type PageAction } from "./PageContent";
import { site } from "@/lib/routes";

import { PresentedImage } from "@/components/media/PresentedImage";
import type { PageMedia } from "@/types/content";

interface StatItem {
  value: string;
  label: string;
}

interface AboutHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  stats: StatItem[];
  image: PageMedia;
  buttons?: PageAction[];
}

export function AboutHero({
  eyebrow,
  title,
  description,
  stats,
  image,
  buttons,
}: AboutHeroProps) {
  const visibleStats = Array.isArray(stats) ? stats : [];
  const heroButtons = buttons?.length
    ? buttons
    : [
        { label: "Solicitar cotação", href: site.quote },
        { label: "Conhecer serviços", href: site.services, variant: "secondary" as const },
      ];

  return (
    <section aria-labelledby="about-title" className="relative isolate overflow-hidden bg-[#020617] pt-16 text-white md:pt-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,.15),transparent_70%)]" />
      <div aria-hidden="true" className="decorative-grid absolute inset-0 -z-10" data-theme="dark" />

      <PageContainer>
        <div className="relative">
          <div className="relative h-[clamp(14rem,62vw,22rem)] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent),linear-gradient(to_bottom,transparent,black_12%,black_72%,transparent)] md:absolute md:-top-12 md:right-0 md:bottom-0 md:h-auto md:w-[58%] md:[mask-image:linear-gradient(to_right,transparent,black_37%,black_80%,transparent),linear-gradient(to_bottom,transparent,black_20%,black_67%,transparent)]">
            <PresentedImage
              {...image}
              alt={image.alt || title}
              sizes="(min-width: 1440px) 798px, (min-width: 768px) calc(58vw - 2.32rem), 100vw"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover brightness-[0.96] saturate-[0.9]"
            />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-slate-900/10" />
          </div>

          <div className="relative flex flex-col items-start pb-8 pt-3 md:min-h-[clamp(25rem,34vw,36rem)] md:w-[50%] md:justify-center md:py-14">
            {eyebrow && (
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-sky-300" />
                {eyebrow}
              </span>
            )}
            <h1 id="about-title" className="mt-3 text-balance text-[clamp(2.25rem,5vw,5rem)] font-bold leading-[1.02] tracking-[-0.055em]">
              {title}
            </h1>
            <p className="mt-4 max-w-[49ch] text-sm leading-relaxed text-slate-300 sm:text-base">
              {description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              {heroButtons.slice(0, 2).map((button, index) => (
                <ActionLink
                  key={`${button.href}-${index}`}
                  action={{ ...button, variant: index === 1 ? "ghost" : button.variant }}
                  tone="dark"
                  className={index === 1
                    ? "min-h-11 rounded-sm px-0 text-white hover:bg-transparent hover:underline hover:underline-offset-4 sm:px-0"
                    : "min-h-11 rounded-full shadow-none"}
                />
              ))}
            </div>
          </div>
        </div>
      </PageContainer>

      {visibleStats.length > 0 && (
        <PageContainer className="pb-9 sm:pb-12">
          <dl className="grid max-w-[52rem] grid-cols-3 gap-x-3 gap-y-5 border-t border-white/15 pt-5">
            {visibleStats.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex min-w-0 flex-col gap-1">
                <dt className="text-xs leading-snug text-slate-300 sm:text-sm">{item.label}</dt>
                <dd className="order-first text-[clamp(1.5rem,3vw,2.75rem)] font-bold leading-none tracking-[-0.05em]">{item.value}</dd>
              </div>
            ))}
          </dl>
        </PageContainer>
      )}
    </section>
  );
}
