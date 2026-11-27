import type { Metadata } from "next";
import { PhoneCall } from "@phosphor-icons/react/dist/ssr";
import { QuoteRequestLink } from "@/components/forms/QuoteRequestLink";
import { EslQuoteForm } from "@/components/forms/EslTransportForms";
import { OperationGuidanceAccordion } from "@/components/internal/OperationGuidanceAccordion";
import { QuoteOtherChannelsSection } from "@/components/internal/QuoteOtherChannelsSection";
import {
  ActionLink,
  PageContainer,
  PageSection,
  PageShell,
  SemanticLink,
  SectionHeader,
} from "@/components/internal/PageContent";
import { fetchPublicContent } from "@/lib/api";
import { buildCmsMetadata } from "@/lib/cmsPublic";
import { external, seo, site } from "@/lib/routes";
import type { QuotePageContent } from "@/types/content";

const fallbackMetadata: Metadata = {
  title: "Cotação",
  description: "Solicite uma cotação de transporte online para carga fracionada ou fechada.",
  alternates: { canonical: seo.absoluteUrl(site.quote) },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: seo.siteName,
    title: "Cotação | Rodogarcia Transportes",
    description: "Faça sua solicitação de cotação de transporte pelo formulário Rodogarcia.",
    url: seo.absoluteUrl(site.quote),
    images: [{ url: seo.absoluteUrl("/foto1.webp") }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cotação | Rodogarcia Transportes",
    description: "Faça sua solicitação de cotação de transporte pelo formulário Rodogarcia.",
    images: [seo.absoluteUrl("/foto1.webp")],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.quote, fallbackMetadata);
}

const FALLBACK_QUOTE_PAGE: QuotePageContent = {
  hero: {
    buttons: [
      { label: "Falar com atendimento", url: site.contact },
      { label: "Central de ajuda", url: site.help },
    ],
  },
  operationGuidance: {
    eyebrow: "Antes do atendimento",
    title: "Quer alinhar a operação antes?",
    description: "Veja qual caminho faz mais sentido para a sua carga antes de acionar o atendimento institucional.",
    items: [
      { id: "quote-guidance-cargo", order: 1, question: "Qual tipo de carga devo selecionar?", answer: "Use carga fracionada quando os volumes seguirem junto de outras cargas e você quiser calcular a proposta nesta página. Escolha carga fechada para uma operação com veículo dedicado." },
      { id: "quote-guidance-details", order: 2, question: "Quais informações agilizam o atendimento?", answer: "Tenha em mãos origem, destino, o CNPJ do cliente, peso, volume, valor da nota e quantidade de volumes. A cotação do site usa a tabela PADRÃO." },
      { id: "quote-guidance-support", order: 3, question: "Quando devo falar com o time institucional?", answer: "Use os canais abaixo para orientações, necessidades especiais ou para alinhar uma operação antes de enviar a solicitação. O formulário continua sendo o caminho principal para calcular ou preparar a cotação." },
    ],
  },
  approvalChannel: {
    whatsappUrl: external.whatsappQuoteApproval,
  },
  unservedOrigin: {
    title: "Ainda não atendemos esta origem",
    description:
      "A cidade de origem informada ainda não faz parte da nossa área de atendimento. Fale com nosso comercial para avaliar a sua operação.",
    button: { label: "Falar com o comercial", url: external.whatsappCommercial, external: true },
  },
  directChannels: [
    {
      id: "fractional-service",
      order: 1,
      title: "Atendimento para carga fracionada",
      description: "Se precisar de apoio antes de enviar a cotação, fale com o time comercial.",
      button: { label: "Abrir atendimento", url: external.whatsappQuoteFractional, external: true },
    },
    {
      id: "closed-service",
      order: 2,
      title: "Atendimento para carga fechada",
      description: "Para operações especiais e lotação, o time pode orientar o melhor caminho.",
      button: { label: "Abrir atendimento", url: external.whatsappQuoteFull, external: true },
    },
  ],
  otherChannels: [],
};

export default async function CotacaoPage() {
  const content = await fetchPublicContent();
  const quotePage = content.data?.quotePage ?? FALLBACK_QUOTE_PAGE;

  return (
    <PageShell className="!pb-0">
      <div className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.18),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />
        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="cotacao-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[920px] py-10 text-center sm:py-12 lg:py-16">
              <h1 id="cotacao-hero-title" className="mx-auto max-w-[16ch] text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.9] tracking-[-0.05em] sm:max-w-[18ch] sm:tracking-[-0.07em]">
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">Cotação de frete</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[44rem] text-sm leading-7 text-white/68 sm:text-base">Calcule a carga fracionada online ou peça uma proposta para carga fechada.</p>
              <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:flex sm:w-auto sm:flex-row sm:items-center sm:justify-center">
                {quotePage.hero.buttons.slice(0, 2).map((button, index) => (
                  button.url === "#formulario-cotacao" ? (
                    <QuoteRequestLink key={button.url} button={button} />
                  ) : (
                    <ActionLink key={`${button.label}-${button.url}`} action={{ label: button.label, href: button.url, variant: index === 1 ? "secondary" : "primary" }} tone="dark" className="w-full min-w-0 sm:w-auto" />
                  )
                ))}
              </div>
            </div>
          </PageContainer>
        </section>
      </div>

      <PageSection className="bg-[var(--color-form-backdrop,#dce5ed)] [--color-muted-raw:var(--color-foreground-soft)]">
        <PageContainer>
          <div id="formulario-cotacao" className="scroll-mt-28">
            <EslQuoteForm
              approvalWhatsappUrl={quotePage.approvalChannel.whatsappUrl}
              unservedOrigin={quotePage.unservedOrigin}
            />
          </div>
        </PageContainer>
      </PageSection>

      <section className="relative overflow-hidden bg-slate-950 py-14 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.14),transparent_60%)]" />
        <PageContainer>
          <div className="relative space-y-10">
            <SectionHeader eyebrow="Precisa de ajuda?" title="Também atendemos pelos canais comerciais." description="Os formulários são o caminho principal. Estes canais continuam disponíveis para orientações e operações especiais." theme="dark" align="center" />
            {quotePage.otherChannels.length > 0 ? <QuoteOtherChannelsSection channels={quotePage.otherChannels} /> : null}
            <div className="grid border-y border-white/10 md:grid-cols-2 md:divide-x md:divide-white/10">
              {quotePage.directChannels.map((channel) => (
                <SemanticLink key={channel.id} href={channel.button.url} external={channel.button.external} className="group border-b border-white/10 px-1 py-5 text-white transition-colors hover:bg-white/[0.03] md:border-b-0 md:px-6 md:first:pl-1 md:last:pr-1">
                  <p className="text-lg font-semibold tracking-[-0.03em] text-white">{channel.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/64">{channel.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-200 transition-transform group-hover:translate-x-1"><PhoneCall size={17} weight="bold" />{channel.button.label}</span>
                </SemanticLink>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] py-14 sm:py-16">
        <PageContainer>
          <OperationGuidanceAccordion
            {...quotePage.operationGuidance}
          />
        </PageContainer>
      </section>

    </PageShell>
  );
}
