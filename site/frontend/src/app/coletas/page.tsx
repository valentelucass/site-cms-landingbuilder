import type { Metadata } from "next";
import { QuoteRequestLink } from "@/components/forms/QuoteRequestLink";
import { EslCollectionForm } from "@/components/forms/EslTransportForms";
import { OperationGuidanceAccordion } from "@/components/internal/OperationGuidanceAccordion";
import { PageContainer, PageSection, PageShell, SemanticLink } from "@/components/internal/PageContent";
import { fetchPublicContent } from "@/lib/api";
import { buildCmsMetadata } from "@/lib/cmsPublic";
import { external, seo, site } from "@/lib/routes";
import type { CollectionsPageContent, QuoteUnservedOriginContent } from "@/types/content";

const fallbackMetadata: Metadata = {
  title: "Solicitar coleta",
  description: "Agende uma coleta Rodogarcia e receba o número do registro pelo site.",
  alternates: { canonical: seo.absoluteUrl(site.collections) },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: seo.siteName,
    title: "Solicitar coleta | Rodogarcia Transportes",
    description: "Valide a nota fiscal e registre sua solicitação de coleta pelo site.",
    url: seo.absoluteUrl(site.collections),
    images: [{ url: seo.absoluteUrl("/foto1.webp") }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solicitar coleta | Rodogarcia Transportes",
    description: "Valide a nota fiscal e registre sua solicitação de coleta pelo site.",
    images: [seo.absoluteUrl("/foto1.webp")],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.collections, fallbackMetadata);
}

const FALLBACK_COLLECTIONS_PAGE: CollectionsPageContent = {
  hero: {
    buttons: [
      { label: "Solicitar coleta", url: "#formulario-coleta" },
      { label: "Solicitar cotação", url: site.quote },
    ],
  },
  operationGuidance: {
    eyebrow: "Antes de solicitar",
    title: "Orientações para a coleta",
    description: "Confira os pontos essenciais antes de finalizar para a solicitação seguir sem retrabalho.",
    items: [
      { id: "collections-guidance-request", order: 1, question: "O que preciso informar para solicitar a coleta?", answer: "Preencha os CNPJs da operação, escolha a data e a janela de horário e informe os dados da nota fiscal. Os campos com a interrogação explicam cada dado." },
      { id: "collections-guidance-invoice", order: 2, question: "Por que a nota fiscal precisa ser validada?", answer: "A validação confirma os valores, volumes e peso da nota antes de liberar o agendamento. Se algum dado da nota ou dos CNPJs for alterado depois, valide novamente." },
      { id: "collections-guidance-confirmation", order: 3, question: "Quando recebo a confirmação?", answer: "Após validar a nota e enviar a solicitação, o site mostra o número da coleta. Caso o cadastro do cliente exija atendimento, a mensagem da operação fica pronta para continuar pelo canal comercial." },
    ],
  },
};

const FALLBACK_UNSERVED_ORIGIN: QuoteUnservedOriginContent = {
  title: "Ainda não atendemos esta origem",
  description:
    "A cidade de origem informada ainda não faz parte da nossa área de atendimento. Fale com nosso comercial para avaliar a sua operação.",
  button: { label: "Falar com o comercial", url: external.whatsappCommercial, external: true },
};

export default async function CollectionsPage() {
  const content = await fetchPublicContent();
  const collectionsPage = content.data?.collectionsPage ?? FALLBACK_COLLECTIONS_PAGE;
  const unservedOrigin = content.data?.quotePage?.unservedOrigin ?? FALLBACK_UNSERVED_ORIGIN;

  return (
    <PageShell className="!pb-0">
      <div className="relative isolate min-h-[100svh] bg-slate-950">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />
        <section className="relative pt-[7.25rem] sm:pt-[8.5rem]" aria-labelledby="coletas-hero-title">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.18),transparent_60%)]" />
          <PageContainer>
            <div className="mx-auto max-w-2xl pb-5 text-center sm:pb-6">
              <h1 id="coletas-hero-title" className="text-[clamp(2.15rem,4.2vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.045em] text-white">Agende sua coleta</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">Retiradas na nossa área de cobertura.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
                {collectionsPage.hero.buttons.slice(0, 2).map((button) => (
                  button.url === site.quote ? (
                    <QuoteRequestLink key={button.url} button={button} outlined />
                  ) : (
                    <SemanticLink key={button.url} href={button.url} external={button.external} className="inline-flex min-h-11 items-center rounded-sm px-1 text-sm font-medium text-slate-300 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-200">
                      {button.label}
                    </SemanticLink>
                  )
                ))}
              </div>
            </div>
          </PageContainer>
        </section>

        <PageSection className="pb-14 pt-3 sm:pb-16 sm:pt-4 lg:pb-20 lg:pt-5">
          <PageContainer>
            <div id="formulario-coleta" className="scroll-mt-28">
              <EslCollectionForm unservedOrigin={unservedOrigin} />
            </div>
          </PageContainer>
        </PageSection>
      </div>

      <PageSection className="bg-[var(--color-form-backdrop,#dce5ed)] [--color-muted-raw:var(--color-foreground-soft)]">
        <PageContainer>
          <OperationGuidanceAccordion {...collectionsPage.operationGuidance} />
        </PageContainer>
      </PageSection>
    </PageShell>
  );
}
