import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { external, site } from "@/lib/routes";
import type { HomeHeroButton } from "@/types/content";
import TrackingDockAnimation from "./TrackingDockAnimation";

export default function TrackingLookupSection({ buttons }: { buttons?: HomeHeroButton[] }) {
  const primaryButton = buttons?.[0] ?? {
    label: "Rastrear agora",
    url: external.tracking,
    enabled: true,
  };
  const secondaryButton = buttons?.[1] ?? {
    label: "Como consultar",
    url: site.help,
    enabled: true,
  };
  const showPrimary = primaryButton.enabled !== false;
  const showSecondary = secondaryButton.enabled !== false;

  return (
    <section
      className="relative isolate overflow-hidden border-y border-blue-950/8 bg-[radial-gradient(ellipse_at_50%_38%,#fbfdff_0%,#edf5ff_58%,#e3edf9_100%)] py-14 sm:py-16 lg:py-14"
      aria-labelledby="tracking-section-title"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_6%_100%,rgba(29,78,216,0.16),transparent_48%),radial-gradient(ellipse_at_100%_0%,rgba(8,145,178,0.12),transparent_48%)]"
        aria-hidden="true"
      />
      <div
        className="decorative-grid pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(90deg,#000,transparent_30%,transparent_70%,#000)]"
        data-theme="light"
        aria-hidden="true"
      />

      <div className="mx-auto grid w-full max-w-[1440px] items-center justify-items-center gap-y-8 px-6 sm:gap-y-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1fr)] lg:gap-x-6 lg:px-10 xl:gap-x-10">
        <div className="flex w-full min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
          <p className="inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-strong)]">
            <span className="size-1.5 rounded-full bg-cyan-600" aria-hidden="true" />
            Área de rastreio
          </p>
          <h2
            id="tracking-section-title"
            className="mt-4 text-balance text-[clamp(2.15rem,3.75vw,3.65rem)] font-bold leading-[1.02] tracking-[-0.055em] text-[var(--foreground)]"
          >
            Rastreie sua carga agora.
          </h2>
          <p className="mt-4 max-w-[48ch] text-pretty text-sm leading-relaxed text-[var(--color-muted-raw)] sm:text-base">
            Entre direto no portal oficial para consultar o andamento da remessa.
          </p>

          {(showPrimary || showSecondary) && (
            <div className="mt-7 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:gap-x-4 lg:justify-start">
              {showPrimary && (
                <a
                  href={primaryButton.url || external.tracking}
                  target={(primaryButton.url || "").startsWith("http") ? "_blank" : undefined}
                  rel={(primaryButton.url || "").startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex min-h-13 max-w-full items-center justify-center gap-2.5 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(29,78,216,0.24)] transition-[background-color,box-shadow] hover:bg-[var(--color-primary-strong)] hover:shadow-[0_14px_30px_rgba(29,78,216,0.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)] sm:px-6"
                  aria-label="Acessar rastreio oficial"
                >
                  <span className="min-w-0 wrap-anywhere">{primaryButton.label || "Rastrear agora"}</span>
                  <ArrowUpRight size={16} weight="bold" className="shrink-0" aria-hidden="true" />
                </a>
              )}

              {showSecondary && (
                <Link
                  href={secondaryButton.url || site.help}
                  target={(secondaryButton.url || "").startsWith("http") ? "_blank" : undefined}
                  rel={(secondaryButton.url || "").startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group inline-flex min-h-13 max-w-full items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold text-[var(--color-primary-strong)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] sm:px-4"
                >
                  <span className="min-w-0 wrap-anywhere underline decoration-[var(--primary)]/30 underline-offset-4 group-hover:decoration-current">
                    {secondaryButton.label || "Como consultar"}
                  </span>
                  <ArrowRight size={16} weight="bold" className="shrink-0" aria-hidden="true" />
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="w-full min-w-0 max-w-[44rem]">
          <TrackingDockAnimation />
        </div>
      </div>
    </section>
  );
}
