import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { SemanticLink } from "@/components/internal/PageContent";
import type { PageButton } from "@/types/content";

export function QuoteRequestLink({ button, outlined = false }: { button: PageButton; outlined?: boolean }) {
  const appearance = outlined
    ? "rounded-full border border-blue-300/40 bg-blue-400/10 px-4 hover:border-blue-200/70 hover:bg-blue-400/20"
    : "rounded-sm px-1 underline-offset-4 hover:text-white hover:underline";
  return (
    <SemanticLink href={button.url} external={button.external} className={`inline-flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold text-blue-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-200 ${appearance}`}>
      {button.label}
      <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
    </SemanticLink>
  );
}
