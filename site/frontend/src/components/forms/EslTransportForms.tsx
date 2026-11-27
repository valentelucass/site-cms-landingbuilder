"use client";

import { cloneElement, useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ReactElement, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  ClipboardText,
  Copy,
  Package,
  PaperPlaneTilt,
  SpinnerGap,
  Truck,
  WarningCircle,
} from "@phosphor-icons/react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApiRequest } from "@/hooks/useApiRequest";
import { api, external, site } from "@/lib/routes";
import type { QuoteUnservedOriginContent } from "@/types/content";
import styles from "./EslTransportForms.module.css";

type RequestStatus = "idle" | "loading" | "success" | "error";
type QuoteKind = "fractional" | "closed";

interface QuoteValues {
  kind: QuoteKind | "";
  customerCnpj: string;
  senderCnpj: string;
  recipientCnpj: string;
  originPostalCode: string;
  originName: string;
  originStateCode: string;
  destinationPostalCode: string;
  destinationName: string;
  destinationStateCode: string;
  realWeight: string;
  cubicVolume: string;
  height: string;
  width: string;
  length: string;
  invoiceValue: string;
  invoiceVolumes: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string;
  productClassificationName: string;
  comments: string;
}

interface QuoteResponse {
  quote: {
    id: string;
    sequenceCode: string;
    referenceNumber: string;
    requestedAt: string;
    price: {
      stretches: Array<{ total: number }>;
      total: number | null;
    };
  };
}

interface WhatsappMessageResponse {
  whatsappMessage: string;
}

interface CollectionValues {
  customerCnpj: string;
  pickupLocationCnpj: string;
  senderCnpj: string;
  recipientCnpj: string;
  originName: string;
  originStateCode: string;
  deliveryPostalCode: string;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryComplement: string;
  deliveryNeighborhood: string;
  deliveryCity: string;
  deliveryStateCode: string;
  serviceDate: string;
  serviceStartHour: string;
  serviceEndHour: string;
  invoiceKey: string;
  invoiceNumber: string;
  invoiceSeries: string;
  referenceNumber: string;
  comments: string;
}

interface InvoiceValidationResponse {
  validated: true;
  validationToken: string;
}

interface CompanyAddressResponse {
  cnpj: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  stateCode: string;
}

interface CollectionResponse {
  requiresWhatsApp: false;
  collection: {
    id: string;
    sequenceCode: string;
    status: string;
    /** Capability efêmera em memória; nunca é exibida nem enviada em URL. */
    maintenanceToken: string;
  };
}

interface CollectionWhatsappResponse {
  requiresWhatsApp: true;
  whatsappMessage: string;
}

const fieldClassName =
  `${styles.field} w-full rounded-2xl border px-4 py-3 text-sm text-[var(--foreground)]`;

const sectionTitleClassName =
  "text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--form-accent)]";

const collectionSteps = [
  { id: "operation", label: "Operação", title: "Dados da operação", description: "Informe os CNPJs do cliente e do local de coleta, a cidade e a UF de origem." },
  { id: "address", label: "Endereço", title: "Endereço de entrega", description: "Confira o endereço preenchido pelo CNPJ ou digite os dados de entrega." },
  { id: "schedule", label: "Programação", title: "Quando podemos retirar?", description: "Escolha a data e o intervalo de horário em que a carga estará disponível." },
  { id: "invoice", label: "Nota fiscal", title: "Conferir e solicitar", description: "A nota fiscal é opcional. Para vinculá-la, informe a chave ou o número e consulte a NF com o CNPJ do remetente ou do destinatário." },
] as const;

const quoteSteps = [
  { id: "operation", label: "Operação", title: "Selecione o tipo de carga", description: "Em seguida, informe o CNPJ de quem paga o frete." },
  { id: "route", label: "Trajeto", title: "Origem e destino", description: "Informe os CEPs e confira as cidades e os estados do trajeto." },
  { id: "cargo", label: "Carga", title: "Dados da carga", description: "Informe a quantidade e as medidas de cada volume, o peso total e o valor da nota." },
  { id: "contact", label: "Contato", title: "Dados do solicitante", description: "Informe quem deve receber o retorno sobre esta cotação." },
] as const;

const collectionCnpjInput = {
  inputMode: "numeric",
  minLength: 18,
  maxLength: 18,
  autoComplete: "off",
  className: fieldClassName,
} as const;

const fieldHelp: Record<string, string> = {
  "CNPJ do cliente e pagador": "Informe os 14 números do CNPJ da empresa cliente, que também será usada como responsável pelo pagamento do frete. A pontuação é aplicada automaticamente.",
  "CNPJ do local de coleta": "Informe os 14 números do CNPJ do endereço onde a mercadoria será coletada. Este campo é obrigatório e a pontuação é aplicada automaticamente.",
  "CNPJ do remetente": "Informe os 14 números do CNPJ de quem está enviando a mercadoria, se disponível. A pontuação é aplicada automaticamente.",
  "CNPJ do destinatário": "Informe os 14 números do CNPJ de quem receberá a mercadoria, se disponível. A pontuação é aplicada automaticamente.",
  "CEP de entrega": "Informe os 8 números do CEP do endereço de entrega. O hífen é aplicado automaticamente e cidade e UF serão preenchidas quando a consulta estiver disponível.",
  Logradouro: "Informe a rua, avenida ou estrada do endereço de entrega.",
  Número: "Informe o número do endereço de entrega.",
  Complemento: "Informe bloco, sala, galpão, referência ou outro complemento, se necessário.",
  Bairro: "Informe o bairro do endereço de entrega, se disponível.",
  "Cidade de entrega": "Informe a cidade do endereço de entrega.",
  "UF de entrega": "Informe a sigla do estado do endereço de entrega, com duas letras.",
  "CEP de origem": "Informe os 8 números do CEP de onde a carga parte. O hífen é aplicado automaticamente para preencher cidade e UF.",
  "Cidade de origem": "Informe a cidade de onde a carga parte. O sistema consulta a região atendida para definir a filial responsável internamente.",
  "UF de origem": "Informe a sigla do estado de origem, com duas letras.",
  "CEP de destino": "Informe os 8 números do CEP para onde a carga seguirá. O hífen é aplicado automaticamente para preencher cidade e UF.",
  "Cidade de destino": "Informe a cidade para onde a carga seguirá.",
  "UF de destino": "Informe a sigla do estado de destino, com duas letras.",
  "Peso real (kg)": "Informe o peso total real da mercadoria em quilogramas. Para calcular a cotação, a API recebe o maior valor entre este peso e o peso taxado.",
  "Volume (m³)": "Calculado automaticamente: quantidade × altura × largura × comprimento.",
  "Peso taxado (kg)": "Calculado automaticamente em quilogramas: metro cúbico × 300. Para calcular a cotação, a API recebe o maior valor entre este peso e o peso real.",
  "Altura (m)": "Informe a altura de uma unidade em metros. Junto com quantidade, largura e comprimento, ela calcula o metro cúbico automaticamente. Com 3 m ou mais, a cotação usa a tabela PADRÃO - 3 METROS.",
  "Largura (m)": "Informe a largura de uma unidade em metros. Junto com quantidade, altura e comprimento, ela calcula o metro cúbico automaticamente. Com 3 m ou mais, a cotação usa a tabela PADRÃO - 3 METROS.",
  "Comprimento (m)": "Informe o comprimento de uma unidade em metros. Junto com quantidade, altura e largura, ele calcula o metro cúbico automaticamente. Com 3 m ou mais, a cotação usa a tabela PADRÃO - 3 METROS.",
  "Valor da NF (R$)": "Informe o valor total da nota fiscal em reais.",
  Quantidade: "Informe a quantidade total de caixas, pallets ou demais volumes.",
  "Classificação do produto": "Descreva o produto ou a categoria da mercadoria, se disponível.",
  "Nome": "Informe o nome da pessoa responsável por esta solicitação.",
  "Telefone": "Informe um telefone brasileiro com DDD para contato sobre a operação. A formatação é aplicada automaticamente e aceita até 11 números.",
  "E-mail": "Informe o e-mail que receberá as informações da solicitação.",
  "Observações": "Inclua detalhes úteis para a operação que não aparecem nos demais campos.",
  "Data": "Escolha a data desejada para a coleta.",
  "Horário inicial": "Informe a partir de que horário a coleta pode começar.",
  "Horário final": "Informe até que horário a coleta pode ser realizada.",
  "Referência interna": "Informe um código, pedido ou referência interna para facilitar a identificação.",
  "Chave da NF": "Informe a chave de acesso de 44 dígitos se quiser consultar a nota. A consulta é opcional e não impede o agendamento.",
  "Número da NF": "Informe o número da nota se quiser consultá-la. A consulta é opcional e não impede o agendamento.",
  "Série": "Informe a série da nota fiscal, se houver.",
};

const defaultQuoteValues: QuoteValues = {
  kind: "",
  customerCnpj: "",
  senderCnpj: "",
  recipientCnpj: "",
  originPostalCode: "",
  originName: "",
  originStateCode: "",
  destinationPostalCode: "",
  destinationName: "",
  destinationStateCode: "",
  realWeight: "",
  cubicVolume: "",
  height: "",
  width: "",
  length: "",
  invoiceValue: "",
  invoiceVolumes: "",
  requesterName: "",
  requesterPhone: "",
  requesterEmail: "",
  productClassificationName: "",
  comments: "",
};

const defaultCollectionValues: CollectionValues = {
  customerCnpj: "",
  pickupLocationCnpj: "",
  senderCnpj: "",
  recipientCnpj: "",
  originName: "",
  originStateCode: "",
  deliveryPostalCode: "",
  deliveryStreet: "",
  deliveryNumber: "",
  deliveryComplement: "",
  deliveryNeighborhood: "",
  deliveryCity: "",
  deliveryStateCode: "",
  serviceDate: "",
  serviceStartHour: "",
  serviceEndHour: "",
  invoiceKey: "",
  invoiceNumber: "",
  invoiceSeries: "",
  referenceNumber: "",
  comments: "",
};

function dispatchFormTracking(form: "quote" | "collection", status: "success" | "fail", reason = "") {
  window.dispatchEvent(
    new CustomEvent(status === "success" ? "rg:form-success" : "rg:form-fail", {
      detail: { form, reason },
    })
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function isWhatsappUrl(url: string) {
  return /^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i.test(url);
}

function whatsappUrl(baseUrl: string, message: string) {
  if (!isWhatsappUrl(baseUrl)) return null;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
}

async function copyMessage(message: string) {
  if (!navigator.clipboard?.writeText) return false;
  await navigator.clipboard.writeText(message);
  return true;
}

function Field({
  label,
  required = false,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactElement<{ id?: string; required?: boolean; "aria-describedby"?: string }>;
  className?: string;
}) {
  const id = useId();
  const help = fieldHelp[label];
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-1 flex min-h-6 items-center gap-1 text-sm font-medium text-[var(--foreground)]">
        <label htmlFor={id}>{label}{required && <span className="text-[var(--form-accent)]"> *</span>}</label>
        <HelpTooltip label={label} content={help} />
      </div>
      <span id={`${id}-help`} className="sr-only">{help}</span>
      {cloneElement(children, { id, required, "aria-describedby": `${id}-help` })}
    </div>
  );
}

function Alert({ kind, children }: { kind: "error" | "info"; children: ReactNode }) {
  const className =
    kind === "error"
      ? "border-red-500/16 bg-red-500/8 text-red-700"
      : "border-sky-500/16 bg-sky-500/8 text-sky-900";
  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${className}`} role={kind === "error" ? "alert" : "status"}>
      <WarningCircle size={19} weight="fill" className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function MessageActions({
  message,
  fallbackLabel,
  channelUrl,
}: {
  message: string;
  fallbackLabel: string;
  channelUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = whatsappUrl(channelUrl, message);

  async function handleCopy() {
    try {
      const didCopy = await copyMessage(message);
      setCopied(didCopy);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-6">
      <textarea value={message} readOnly rows={7} aria-label="Mensagem preparada para atendimento" className={`${styles.field} w-full resize-none rounded-2xl border p-4 text-left text-xs leading-5 text-[var(--foreground)]`} />
      <div className="mt-3 flex flex-col justify-center gap-3 sm:flex-row">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Abrir WhatsApp
          </a>
        ) : (
          <a
            href={site.contact}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-strong)]"
          >
            {fallbackLabel}
          </a>
        )}
        <button
          type="button"
          onClick={() => void handleCopy()}
          className={`${styles.secondaryAction} inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-semibold transition-colors`}
        >
          <Copy size={17} weight="bold" />
          {copied ? "Mensagem copiada" : "Copiar mensagem"}
        </button>
      </div>
    </div>
  );
}

function SubmitButton({
  loading,
  disabled = false,
  icon = <PaperPlaneTilt size={18} weight="bold" aria-hidden="true" />,
  children,
  className = "",
}: {
  loading: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`${styles.submit} inline-flex min-h-14 min-w-[13rem] items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? <SpinnerGap size={18} className="animate-spin" weight="bold" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}

function useFormSteps(focusResult: boolean) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const headingId = useId();
  useEffect(() => {
    if ((!moveFocus.current && !focusResult) || !headingRef.current) return;
    moveFocus.current = false;
    headingRef.current.focus({ preventScroll: true });
    const target = formRef.current ?? headingRef.current;
    const headerOffset = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    if (target.getBoundingClientRect().top < headerOffset || headingRef.current.getBoundingClientRect().bottom > window.innerHeight) {
      target.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [step, focusResult]);

  function navigate(next: number) {
    moveFocus.current = true;
    setDirection(next < step ? "back" : "forward");
    setStep(next);
  }

  return { step, direction, navigate, headingRef, formRef, headingId };
}

function StepProgress({ label, description, steps, step, disabled, onBack }: {
  label: string;
  description?: string;
  steps: ReadonlyArray<{ id: string; label: string }>;
  step: number;
  disabled: boolean;
  onBack: (step: number) => void;
}) {
  return (
    <nav className={styles.progress} aria-label={label}>
      {description && <p className={styles.progressIntro}>{description}</p>}
      <ol>
        {steps.map((item, index) => {
          const complete = index < step;
          return (
            <li key={item.id} aria-current={index === step ? "step" : undefined} data-complete={complete || undefined}>
              {complete ? (
                <button type="button" disabled={disabled} aria-label={`Voltar à etapa ${item.label}`} onClick={() => onBack(index)}>
                  <Check size={13} weight="bold" aria-hidden="true" />
                  {item.label}
                </button>
              ) : <span>{item.label}</span>}
              <div className={styles.track} aria-hidden="true"><i /></div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepFooter({ step, onBack, busy, submitting, last, submitLabel }: {
  step: number;
  onBack: (step: number) => void;
  busy: boolean;
  submitting: boolean;
  last: boolean;
  submitLabel: string;
}) {
  return (
    <div className={styles.footer}>
      {step > 0 && (
        <button type="button" onClick={() => onBack(step - 1)} disabled={busy} className={`${styles.secondary} inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold disabled:opacity-60`}>
          <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          Voltar
        </button>
      )}
      <SubmitButton
        loading={submitting}
        disabled={busy}
        icon={last ? undefined : <ArrowRight size={16} weight="bold" aria-hidden="true" />}
        className="ml-auto flex-row-reverse px-4"
      >
        {submitting ? "Enviando..." : last ? submitLabel : "Continuar"}
      </SubmitButton>
    </div>
  );
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCnpj(value: string) {
  const cnpj = digits(value).slice(0, 14);
  if (cnpj.length <= 2) return cnpj;
  if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
  if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
  if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

function formatPostalCode(value: string) {
  const postalCode = digits(value).slice(0, 8);
  return postalCode.length <= 5 ? postalCode : `${postalCode.slice(0, 5)}-${postalCode.slice(5)}`;
}

function formatPhone(value: string) {
  const phone = digits(value).slice(0, 11);
  if (phone.length <= 2) return phone.length ? `(${phone}` : "";
  if (phone.length <= 6) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
  if (phone.length <= 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
}

function volumeFromDimensions(quantity: string, height: string, width: string, length: string) {
  const measures = [quantity, height, width, length].map((value) => Number(value.replace(",", ".")));
  return measures.every((value) => Number.isFinite(value) && value > 0)
    ? measures.reduce((total, value) => total * value, 1)
    : null;
}

function quoteApprovalMessage(quote: QuoteResponse["quote"], values: QuoteValues) {
  const reference = quote.sequenceCode || quote.referenceNumber || "registrada";
  const value = quote.price.total === null ? "em análise" : formatCurrency(quote.price.total);
  return [
    "Olá, fiz uma cotação pelo site Rodogarcia e gostaria de aprová-la para seguir com o transporte.",
    `Cotação: ${reference}`,
    `Valor apresentado: ${value}`,
    `Origem: ${values.originName}/${values.originStateCode}`,
    `Destino: ${values.destinationName}/${values.destinationStateCode}`,
  ].join("\n");
}

function isUnservedOriginError(message: string) {
  return message.startsWith("Ainda não atendemos a cidade de origem");
}

function UnservedOriginDialog({
  content,
  open,
  onOpenChange,
}: {
  content: QuoteUnservedOriginContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(32rem,calc(100%-2rem))] overflow-hidden border-amber-500/25 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,1)_100%)] p-0 shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:max-w-[32rem]" showCloseButton>
        <DialogHeader className="items-center px-6 pb-2 pt-8 text-center sm:px-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white shadow-[0_12px_28px_rgba(217,119,6,0.24)]">
            <WarningCircle size={27} weight="fill" />
          </span>
          <DialogTitle className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{content.title}</DialogTitle>
          <DialogDescription className="max-w-sm text-center leading-6 text-[var(--color-muted-raw)]">{content.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mx-0 mb-0 flex-col gap-3 border-0 bg-white/72 px-6 py-5 sm:flex-row sm:justify-between sm:px-8">
          <button type="button" onClick={() => onOpenChange(false)} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--color-surface-2)]">Revisar origem</button>
          <a href={content.button.url} target={content.button.external ? "_blank" : undefined} rel={content.button.external ? "noopener noreferrer" : undefined} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] transition-colors hover:bg-emerald-700"><PaperPlaneTilt size={18} weight="bold" />{content.button.label}</a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EslQuoteForm({
  approvalWhatsappUrl = external.whatsappQuoteApproval,
  unservedOrigin,
}: {
  approvalWhatsappUrl?: string;
  unservedOrigin: QuoteUnservedOriginContent;
}) {
  const { apiRequest } = useApiRequest();
  const [values, setValues] = useState<QuoteValues>(defaultQuoteValues);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<QuoteResponse["quote"] | null>(null);
  const [quoteResultOpen, setQuoteResultOpen] = useState(false);
  const [unservedOriginOpen, setUnservedOriginOpen] = useState(false);
  const [closedMessage, setClosedMessage] = useState("");
  const postalLookupTimer = useRef<number | null>(null);

  const { step, direction, navigate, headingRef, formRef, headingId } = useFormSteps(status === "success" && Boolean(closedMessage));
  const currentStep = quoteSteps[step];
  const isLastStep = step === quoteSteps.length - 1;

  function goToStep(next: number) {
    navigate(next);
    setStatus("idle");
    setError("");
  }

  const kindLabel = values.kind === "fractional" ? "carga fracionada" : "carga fechada";
  const approvalMessage = quote ? quoteApprovalMessage(quote, values) : "";
  const approvalUrl = quote ? whatsappUrl(approvalWhatsappUrl, approvalMessage) : null;

  function update<K extends keyof QuoteValues>(key: K, value: QuoteValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateDimensions(key: "height" | "width" | "length", value: string) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      const calculated = volumeFromDimensions(next.invoiceVolumes, next.height, next.width, next.length);
      return { ...next, cubicVolume: calculated === null ? "" : String(Number(calculated.toFixed(4))) };
    });
  }

  function updateQuantity(value: string) {
    setValues((current) => {
      const next = { ...current, invoiceVolumes: value };
      const calculated = volumeFromDimensions(next.invoiceVolumes, next.height, next.width, next.length);
      return { ...next, cubicVolume: calculated === null ? "" : String(Number(calculated.toFixed(4))) };
    });
  }

  const taxedWeight = Number(values.cubicVolume) > 0 ? Number(values.cubicVolume) * 300 : null;

  async function fillCityFromPostalCode(kind: "origin" | "destination", rawPostalCode: string) {
    const postalCode = digits(rawPostalCode);
    if (postalCode.length !== 8) return;
    try {
      const response = await fetch(api.public.postalCode(postalCode));
      if (!response.ok) return;
      const data: unknown = await response.json();
      if (!data || typeof data !== "object") return;
      const address = data as { city?: unknown; stateCode?: unknown };
      const city = typeof address.city === "string" ? address.city : "";
      const stateCode = typeof address.stateCode === "string" ? address.stateCode : "";
      if (city && stateCode) {
        setValues((current) =>
          digits(current[`${kind}PostalCode`]) === postalCode
            ? { ...current, [`${kind}Name`]: city, [`${kind}StateCode`]: stateCode }
            : current
        );
      }
    } catch {
      // O visitante ainda pode preencher cidade e UF manualmente se a consulta estiver indisponível.
    }
  }

  function schedulePostalLookup(kind: "origin" | "destination", postalCode: string) {
    if (postalLookupTimer.current !== null) window.clearTimeout(postalLookupTimer.current);
    if (digits(postalCode).length !== 8) return;
    postalLookupTimer.current = window.setTimeout(() => {
      void fillCityFromPostalCode(kind, postalCode);
      postalLookupTimer.current = null;
    }, 350);
  }

  function input<K extends keyof QuoteValues>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      update(key, event.target.value as QuoteValues[K]);
    };
  }

  function formattedInput<K extends "customerCnpj" | "senderCnpj" | "recipientCnpj" | "requesterPhone">(key: K) {
    const formatter = key === "requesterPhone" ? formatPhone : formatCnpj;
    return (event: ChangeEvent<HTMLInputElement>) => {
      update(key, formatter(event.target.value) as QuoteValues[K]);
    };
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading" || !event.currentTarget.reportValidity()) return;
    if (!isLastStep) {
      goToStep(step + 1);
      return;
    }
    setStatus("loading");
    setError("");
    setQuote(null);
    setClosedMessage("");

    const payload = {
      customerCnpj: values.customerCnpj,
      senderCnpj: values.senderCnpj,
      recipientCnpj: values.recipientCnpj,
      origin: {
        postalCode: values.originPostalCode,
        name: values.originName,
        stateCode: values.originStateCode,
      },
      destination: {
        postalCode: values.destinationPostalCode,
        name: values.destinationName,
        stateCode: values.destinationStateCode,
      },
      height: values.height,
      width: values.width,
      length: values.length,
      realWeight: values.realWeight,
      cubicVolume: values.cubicVolume,
      invoiceValue: values.invoiceValue,
      invoiceVolumes: values.invoiceVolumes,
      requesterName: values.requesterName,
      requesterPhone: values.requesterPhone,
      requesterEmail: values.requesterEmail,
      productClassificationName: values.productClassificationName,
      comments: values.comments,
    };

    if (values.kind === "fractional") {
      const result = await apiRequest<QuoteResponse>(api.eslTransport.quoteFractional, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!result.success || !result.data) {
        const reason = result.error ?? "Não foi possível calcular a cotação.";
        if (isUnservedOriginError(reason)) {
          setError("");
          setStatus("idle");
          setUnservedOriginOpen(true);
          dispatchFormTracking("quote", "fail", "unserved_origin");
          return;
        }
        setError(reason);
        setStatus("error");
        dispatchFormTracking("quote", "fail", reason);
        return;
      }
      setQuote(result.data.quote);
      setQuoteResultOpen(true);
      setStatus("success");
      dispatchFormTracking("quote", "success");
      return;
    }

    const result = await apiRequest<WhatsappMessageResponse>(api.eslTransport.quoteClosedWhatsapp, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!result.success || !result.data) {
      const reason = result.error ?? "Não foi possível preparar o atendimento.";
      setError(reason);
      setStatus("error");
      dispatchFormTracking("quote", "fail", reason);
      return;
    }
    setClosedMessage(result.data.whatsappMessage);
    setStatus("success");
    dispatchFormTracking("quote", "success");
  }

  if (status === "success" && closedMessage) {
    return (
      <div className={`${styles.card} ${styles.result}`} data-kind={values.kind || undefined} role="status">
        <CheckCircle size={38} weight="fill" className="mx-auto text-[var(--form-accent)]" />
        <h2 ref={headingRef} tabIndex={-1} className="mt-4 scroll-mt-28 text-2xl font-semibold">Dados prontos para o atendimento.</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">A carga fechada seguirá pelo time comercial. Envie a mensagem abaixo para continuar.</p>
        <MessageActions message={closedMessage} fallbackLabel="Abrir atendimento" channelUrl={external.whatsappQuoteFull} />
        <button type="button" onClick={() => goToStep(0)} className="mt-4 text-sm font-semibold text-[var(--primary)] hover:underline">Editar dados</button>
      </div>
    );
  }

  return (
    <>
      <Dialog open={quoteResultOpen && Boolean(quote)} onOpenChange={setQuoteResultOpen}>
        <DialogContent className="max-w-[min(34rem,calc(100%-2rem))] overflow-hidden border-emerald-500/20 bg-[linear-gradient(180deg,rgba(236,253,245,0.98)_0%,rgba(255,255,255,1)_100%)] p-0 shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:max-w-[34rem]" showCloseButton>
          <DialogHeader className="items-center px-6 pb-2 pt-8 text-center sm:px-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_12px_28px_rgba(5,150,105,0.26)]">
              <CheckCircle size={27} weight="fill" />
            </span>
            <DialogTitle className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Cotação pronta.</DialogTitle>
            <DialogDescription className="max-w-sm text-center leading-6 text-[var(--color-muted-raw)]">Confira o valor e aprove pelo atendimento para seguir com o transporte.</DialogDescription>
          </DialogHeader>
          {quote ? (
            <div className="space-y-5 px-6 pb-6 pt-4 sm:px-8">
              <div className="rounded-2xl border border-slate-200 bg-white/88 px-5 py-4 text-center shadow-[0_12px_26px_rgba(15,23,42,0.05)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">Cotação</p>
                <p className="mt-1 text-lg font-bold text-[var(--foreground)]">{quote.sequenceCode || quote.referenceNumber || "Registrada"}</p>
                <div className="my-4 h-px bg-slate-200" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Valor da cotação</p>
                <p className="mt-1 text-4xl font-bold tracking-[-0.06em] text-[var(--foreground)]">{quote.price.total === null ? "Em análise" : formatCurrency(quote.price.total)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left text-sm">
                <div className="rounded-xl border border-slate-200/90 bg-white/68 p-3"><p className="text-xs text-[var(--color-muted-raw)]">Origem</p><p className="mt-1 font-semibold text-[var(--foreground)]">{values.originName}/{values.originStateCode}</p></div>
                <div className="rounded-xl border border-slate-200/90 bg-white/68 p-3"><p className="text-xs text-[var(--color-muted-raw)]">Destino</p><p className="mt-1 font-semibold text-[var(--foreground)]">{values.destinationName}/{values.destinationStateCode}</p></div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="mx-0 mb-0 flex-col gap-3 border-0 bg-white/72 px-6 py-5 sm:flex-row sm:justify-between sm:px-8">
            <button type="button" onClick={() => { setValues(defaultQuoteValues); setQuote(null); setQuoteResultOpen(false); goToStep(0); }} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--color-surface-2)]">Fazer outra cotação</button>
            {approvalUrl ? <a href={approvalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] transition-colors hover:bg-emerald-700"><PaperPlaneTilt size={18} weight="bold" />Aprovar cotação</a> : <a href={site.contact} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-5 text-sm font-semibold text-white">Falar com atendimento</a>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UnservedOriginDialog
        content={unservedOrigin}
        open={unservedOriginOpen}
        onOpenChange={(open) => {
          setUnservedOriginOpen(open);
          if (!open) goToStep(1);
        }}
      />

      <form ref={formRef} onSubmit={(event) => void onSubmit(event)} className={styles.card} data-kind={values.kind || undefined} aria-labelledby={headingId} noValidate>
        <StepProgress label="Etapas da cotação" description="Escolha a modalidade e siga as quatro etapas." steps={quoteSteps} step={step} disabled={status === "loading"} onBack={goToStep} />
        <div key={currentStep.id} className={styles.body} data-direction={direction}>
          <header className={styles.heading}>
            <p className={sectionTitleClassName}>Etapa {step + 1} de {quoteSteps.length}</p>
            <h2 id={headingId} ref={headingRef} tabIndex={-1}>{currentStep.title}</h2>
            <p>{currentStep.description}</p>
          </header>
          <fieldset disabled={status === "loading"} aria-labelledby={headingId} className="min-w-0">
            {currentStep.id === "operation" && (
              <>
                <fieldset className="mb-6 grid min-w-0 gap-3 sm:grid-cols-2">
                  <legend className="sr-only">Modalidade de transporte obrigatória</legend>
                  {(["fractional", "closed"] as const).map((kind) => {
                    const fractional = kind === "fractional";
                    const Icon = fractional ? Package : Truck;
                    const name = fractional ? "Carga fracionada" : "Carga fechada";
                    return (
                      <label key={kind} className={`${styles.quoteKindCard} ${fractional ? styles.green : styles.blue}`}>
                        <span className={styles.kindIcon}><Icon size={23} weight="duotone" aria-hidden="true" /></span>
                        <span>
                          <span className="block text-base font-semibold text-[var(--foreground)]">{name}</span>
                          <span className="mt-1 block text-xs leading-5 text-[var(--color-muted-raw)]">{fractional ? "Espaço compartilhado. Valor calculado online." : "Veículo dedicado. Proposta pelo comercial."}</span>
                        </span>
                        <input
                          type="radio"
                          name="quote-kind"
                          value={kind}
                          aria-label={name}
                          required
                          checked={values.kind === kind}
                          onChange={() => update("kind", kind)}
                          className={styles.kindRadio}
                        />
                      </label>
                    );
                  })}
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="CNPJ do cliente e pagador" required><input value={values.customerCnpj} onChange={formattedInput("customerCnpj")} inputMode="numeric" maxLength={18} autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
                  <Field label="CNPJ do remetente"><input value={values.senderCnpj} onChange={formattedInput("senderCnpj")} inputMode="numeric" maxLength={18} autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
                  <Field label="CNPJ do destinatário"><input value={values.recipientCnpj} onChange={formattedInput("recipientCnpj")} inputMode="numeric" maxLength={18} autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
                </div>
              </>
            )}
            {currentStep.id === "route" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="CEP de origem" required><input value={values.originPostalCode} onChange={(event) => { const postalCode = formatPostalCode(event.target.value); update("originPostalCode", postalCode); schedulePostalLookup("origin", postalCode); }} onBlur={(event) => void fillCityFromPostalCode("origin", event.currentTarget.value)} inputMode="numeric" maxLength={9} autoComplete="postal-code" placeholder="00000-000" className={fieldClassName} /></Field>
                <Field label="Cidade de origem" required><input value={values.originName} onChange={input("originName")} autoComplete="address-level2" placeholder="Ex.: Osasco" className={fieldClassName} /></Field>
                <Field label="UF de origem" required><input value={values.originStateCode} onChange={input("originStateCode")} maxLength={2} autoComplete="address-level1" placeholder="SP" className={fieldClassName} /></Field>
                <Field label="CEP de destino" required><input value={values.destinationPostalCode} onChange={(event) => { const postalCode = formatPostalCode(event.target.value); update("destinationPostalCode", postalCode); schedulePostalLookup("destination", postalCode); }} onBlur={(event) => void fillCityFromPostalCode("destination", event.currentTarget.value)} inputMode="numeric" maxLength={9} autoComplete="postal-code" placeholder="00000-000" className={fieldClassName} /></Field>
                <Field label="Cidade de destino" required><input value={values.destinationName} onChange={input("destinationName")} autoComplete="address-level2" placeholder="Ex.: Agudos" className={fieldClassName} /></Field>
                <Field label="UF de destino" required><input value={values.destinationStateCode} onChange={input("destinationStateCode")} maxLength={2} autoComplete="address-level1" placeholder="SP" className={fieldClassName} /></Field>
              </div>
            )}
            {currentStep.id === "cargo" && (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,0.72fr)_repeat(3,minmax(0,1fr))]">
                  <Field label="Quantidade" required><input value={values.invoiceVolumes} onChange={(event) => updateQuantity(event.target.value)} type="number" min="1" step="1" inputMode="numeric" placeholder="1" className={fieldClassName} /></Field>
                  <Field label="Altura (m)" required><input value={values.height} onChange={(event) => updateDimensions("height", event.target.value)} type="number" min="0" step="any" inputMode="decimal" placeholder="1,2" className={fieldClassName} /></Field>
                  <Field label="Largura (m)" required><input value={values.width} onChange={(event) => updateDimensions("width", event.target.value)} type="number" min="0" step="any" inputMode="decimal" placeholder="0,8" className={fieldClassName} /></Field>
                  <Field label="Comprimento (m)" required><input value={values.length} onChange={(event) => updateDimensions("length", event.target.value)} type="number" min="0" step="any" inputMode="decimal" placeholder="2,5" className={fieldClassName} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Volume (m³)" required><input value={values.cubicVolume} readOnly aria-live="polite" placeholder="Calculado automaticamente" className={fieldClassName} /></Field>
                  <Field label="Peso taxado (kg)"><input value={taxedWeight === null ? "" : String(Number(taxedWeight.toFixed(2)))} readOnly aria-live="polite" placeholder="Calculado automaticamente" className={fieldClassName} /></Field>
                  <Field label="Peso real (kg)" required><input value={values.realWeight} onChange={input("realWeight")} type="number" min="0" step="any" inputMode="decimal" placeholder="20" className={fieldClassName} /></Field>
                  <Field label="Valor da NF (R$)" required><input value={values.invoiceValue} onChange={input("invoiceValue")} type="number" min="0" step="any" inputMode="decimal" placeholder="200" className={fieldClassName} /></Field>
                </div>
                <Field label="Classificação do produto"><input value={values.productClassificationName} onChange={input("productClassificationName")} placeholder="Ex.: Produtos químicos" className={fieldClassName} /></Field>
              </div>
            )}
            {currentStep.id === "contact" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome" required><input value={values.requesterName} onChange={input("requesterName")} autoComplete="name" placeholder="Seu nome" className={fieldClassName} /></Field>
                <Field label="Telefone" required><input value={values.requesterPhone} onChange={formattedInput("requesterPhone")} type="tel" inputMode="tel" maxLength={15} autoComplete="tel" placeholder="(00) 00000-0000" className={fieldClassName} /></Field>
                <Field label="E-mail" required><input value={values.requesterEmail} onChange={input("requesterEmail")} type="email" autoComplete="email" placeholder="seu@email.com" className={fieldClassName} /></Field>
                <Field label="Observações"><input value={values.comments} onChange={input("comments")} placeholder="Informações adicionais (opcional)" className={fieldClassName} /></Field>
              </div>
            )}
          </fieldset>
          {status === "error" && <div className="mt-4"><Alert kind="error">{error}</Alert></div>}
        </div>
        <StepFooter step={step} onBack={goToStep} busy={status === "loading"} submitting={status === "loading"} last={isLastStep} submitLabel={values.kind === "fractional" ? "Calcular cotação" : `Preparar ${kindLabel}`} />
      </form>
    </>
  );
}

export function EslCollectionForm({ unservedOrigin }: { unservedOrigin: QuoteUnservedOriginContent }) {
  const { apiRequest } = useApiRequest();
  const [values, setValues] = useState<CollectionValues>(defaultCollectionValues);

  const [status, setStatus] = useState<RequestStatus>("idle");
  const [validationStatus, setValidationStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState("");
  const [invoiceValidationToken, setInvoiceValidationToken] = useState("");
  const [collection, setCollection] = useState<CollectionResponse["collection"] | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [companyLookupStatus, setCompanyLookupStatus] = useState<RequestStatus>("idle");
  const [companyLookupMessage, setCompanyLookupMessage] = useState("");
  const [unservedOriginOpen, setUnservedOriginOpen] = useState(false);
  const companyLookupTimer = useRef<number | null>(null);
  const companyLookup = useRef<{ cnpj: string; controller: AbortController } | null>(null);
  const postalLookup = useRef<AbortController | null>(null);
  const { step, direction, navigate, headingRef, formRef, headingId } = useFormSteps(status === "success");
  const currentStep = collectionSteps[step];
  const isLastStep = step === collectionSteps.length - 1;
  const isBusy = status === "loading" || validationStatus === "loading";

  const validationFingerprint = useMemo(
    () => [values.customerCnpj, values.pickupLocationCnpj, values.senderCnpj, values.recipientCnpj, values.originName, values.originStateCode, values.invoiceKey, values.invoiceNumber, values.invoiceSeries].join("|"),
    [values.customerCnpj, values.invoiceKey, values.invoiceNumber, values.invoiceSeries, values.originName, values.originStateCode, values.pickupLocationCnpj, values.recipientCnpj, values.senderCnpj]
  );
  const [validatedFingerprint, setValidatedFingerprint] = useState("");
  const isInvoiceCurrent = Boolean(
    invoiceValidationToken && validationFingerprint === validatedFingerprint
  );

  useEffect(() => () => {
    if (companyLookupTimer.current !== null) window.clearTimeout(companyLookupTimer.current);
    companyLookup.current?.controller.abort();
    postalLookup.current?.abort();
  }, []);

  function goToStep(next: number) {
    navigate(next);
    setStatus("idle");
    setValidationStatus("idle");
    setError("");
  }

  function update<K extends keyof CollectionValues>(key: K, value: CollectionValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (["customerCnpj", "pickupLocationCnpj", "senderCnpj", "recipientCnpj", "originName", "originStateCode", "invoiceKey", "invoiceNumber", "invoiceSeries"].includes(key)) {
      setInvoiceValidationToken("");
      setValidatedFingerprint("");
    }
  }

  function updateDeliveryAddress<K extends keyof CollectionValues>(key: K, value: CollectionValues[K]) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === "deliveryCity" && value.trim()) next.originName = value;
      if (key === "deliveryStateCode" && /^[a-z]{2}$/i.test(value)) next.originStateCode = value;
      return next;
    });
    if (key === "deliveryCity" || key === "deliveryStateCode") {
      postalLookup.current?.abort();
      setInvoiceValidationToken("");
      setValidatedFingerprint("");
    }
  }

  async function lookupPickupLocationAddress(rawCnpj: string) {
    const cnpj = digits(rawCnpj);
    if (cnpj.length !== 14 || companyLookup.current?.cnpj === cnpj) return;
    if (companyLookupTimer.current !== null) window.clearTimeout(companyLookupTimer.current);
    companyLookupTimer.current = null;
    const controller = new AbortController();
    companyLookup.current = { cnpj, controller };
    setCompanyLookupStatus("loading");
    setCompanyLookupMessage("");
    try {
      const response = await fetch(api.public.company(cnpj), { signal: controller.signal });
      const data: unknown = await response.json().catch(() => null);
      if (controller.signal.aborted) return;
      if (!response.ok || !data || typeof data !== "object") {
        throw new Error("Não foi possível confirmar o endereço pelo CNPJ.");
      }
      const address = data as CompanyAddressResponse;
      const addressValues = {
        deliveryPostalCode: address.postalCode,
        deliveryStreet: address.street,
        deliveryNumber: address.number,
        deliveryComplement: address.complement,
        deliveryNeighborhood: address.neighborhood,
        deliveryCity: address.city,
        deliveryStateCode: address.stateCode,
        originName: address.city,
        originStateCode: address.stateCode,
      };
      setValues((current) => {
        const next = { ...current };
        for (const key of Object.keys(addressValues) as Array<keyof typeof addressValues>) {
          if (current[key] === values[key] && addressValues[key]) next[key] = addressValues[key];
        }
        return next;
      });
      setInvoiceValidationToken("");
      setValidatedFingerprint("");
      setCompanyLookupStatus("success");
      setCompanyLookupMessage("Endereço confirmado pelo CNPJ. Confira os dados antes de solicitar.");
    } catch {
      if (controller.signal.aborted) return;
      setCompanyLookupStatus("error");
      setCompanyLookupMessage("Não foi possível confirmar pelo CNPJ. Preencha o endereço manualmente.");
    }
  }

  function schedulePickupLocationLookup(rawCnpj: string) {
    if (companyLookupTimer.current !== null) window.clearTimeout(companyLookupTimer.current);
    companyLookupTimer.current = null;
    companyLookup.current?.controller.abort();
    companyLookup.current = null;
    setCompanyLookupMessage("");
    if (digits(rawCnpj).length !== 14) {
      setCompanyLookupStatus("idle");
      return;
    }
    setCompanyLookupStatus("loading");
    companyLookupTimer.current = window.setTimeout(() => {
      void lookupPickupLocationAddress(rawCnpj);
    }, 350);
  }

  async function fillDeliveryCityFromPostalCode(rawPostalCode: string) {
    postalLookup.current?.abort();
    const postalCode = digits(rawPostalCode);
    if (postalCode.length !== 8) return;
    const controller = new AbortController();
    postalLookup.current = controller;
    try {
      const response = await fetch(api.public.postalCode(postalCode), { signal: controller.signal });
      const data: unknown = await response.json().catch(() => null);
      if (controller.signal.aborted || !response.ok || !data || typeof data !== "object") return;
      const address = data as { city?: unknown; stateCode?: unknown };
      const city = typeof address.city === "string" ? address.city : "";
      const stateCode = typeof address.stateCode === "string" ? address.stateCode : "";
      if (!city || !stateCode) return;
      setValues((current) => ({
        ...current,
        deliveryCity: city,
        deliveryStateCode: stateCode,
        originName: city,
        originStateCode: stateCode,
      }));
      setInvoiceValidationToken("");
      setValidatedFingerprint("");
    } catch {
      // O endereço manual continua disponível quando a consulta de CEP falha.
    }
  }

  function input<K extends keyof CollectionValues>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      update(key, event.target.value as CollectionValues[K]);
    };
  }

  function formattedInput<K extends "customerCnpj" | "pickupLocationCnpj" | "senderCnpj" | "recipientCnpj">(key: K) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      update(key, formatCnpj(event.target.value) as CollectionValues[K]);
    };
  }

  async function validateInvoice() {
    if (isBusy) return;
    setValidationStatus("loading");
    setError("");
    setInvoiceValidationToken("");
    const result = await apiRequest<InvoiceValidationResponse>(api.eslTransport.collectionInvoiceValidation, {
      method: "POST",
      body: JSON.stringify({
        invoiceKey: values.invoiceKey,
        invoiceNumber: values.invoiceNumber,
        invoiceSeries: values.invoiceSeries,
        senderCnpj: values.senderCnpj,
        recipientCnpj: values.recipientCnpj,
      }),
    });
    if (!result.success || !result.data) {
      const reason = result.error ?? "Não foi possível validar a nota fiscal.";
      setError(reason);
      setValidationStatus("error");
      return;
    }
    setInvoiceValidationToken(result.data.validationToken);
    setValidatedFingerprint(validationFingerprint);
    setValidationStatus("success");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy || !event.currentTarget.reportValidity()) return;
    if (!isLastStep) {
      goToStep(step + 1);
      return;
    }

    if (companyLookupStatus === "loading") schedulePickupLocationLookup("");
    postalLookup.current?.abort();
    setStatus("loading");
    setError("");
    setValidationStatus("idle");
    setCollection(null);
    setWhatsappMessage("");

    const result = await apiRequest<CollectionResponse | CollectionWhatsappResponse>(api.eslTransport.collections, {
      method: "POST",
      body: JSON.stringify({
        customerCnpj: values.customerCnpj,
        pickupLocationCnpj: values.pickupLocationCnpj,
        senderCnpj: values.senderCnpj,
        recipientCnpj: values.recipientCnpj,
        origin: {
          name: values.originName,
          stateCode: values.originStateCode,
        },
        deliveryAddress: {
          postalCode: values.deliveryPostalCode,
          street: values.deliveryStreet,
          number: values.deliveryNumber,
          complement: values.deliveryComplement,
          neighborhood: values.deliveryNeighborhood,
          city: values.deliveryCity,
          stateCode: values.deliveryStateCode,
        },
        serviceDate: values.serviceDate,
        serviceStartHour: values.serviceStartHour,
        serviceEndHour: values.serviceEndHour,
        invoiceValidationToken: isInvoiceCurrent ? invoiceValidationToken : "",
        invoice: {
          invoiceKey: values.invoiceKey,
          invoiceNumber: values.invoiceNumber,
          invoiceSeries: values.invoiceSeries,
          senderCnpj: values.senderCnpj,
          recipientCnpj: values.recipientCnpj,
        },
        referenceNumber: values.referenceNumber,
        comments: values.comments,
      }),
    });
    if (!result.success || !result.data) {
      const reason = result.error ?? "Não foi possível agendar a coleta.";
      if (isUnservedOriginError(reason)) {
        setError("");
        setStatus("idle");
        setUnservedOriginOpen(true);
        dispatchFormTracking("collection", "fail", "unserved_origin");
        return;
      }
      setError(reason);
      setStatus("error");
      dispatchFormTracking("collection", "fail", reason);
      return;
    }
    if (result.data.requiresWhatsApp) {
      setWhatsappMessage(result.data.whatsappMessage);
    } else {
      setCollection(result.data.collection);
    }
    setStatus("success");
    dispatchFormTracking("collection", "success");
  }

  if (status === "success" && collection) {
    return (
      <div className={`${styles.card} ${styles.result}`} role="status">
        <CheckCircle size={38} weight="fill" className="mx-auto text-[var(--form-accent)]" aria-hidden="true" />
        <h2 ref={headingRef} tabIndex={-1} className="mt-4 scroll-mt-28 text-2xl font-semibold">Coleta registrada.</h2>
        <p className="mt-3 text-sm leading-7">Número da coleta</p>
        <p className="mt-1 text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)]">{collection.sequenceCode || collection.id}</p>
        <button
          type="button"
          onClick={() => {
            setValues(defaultCollectionValues);
            setInvoiceValidationToken("");
            setValidatedFingerprint("");
            schedulePickupLocationLookup("");
            goToStep(0);
          }}
          className={`${styles.secondary} mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-colors`}
        >
          Solicitar outra coleta
        </button>
      </div>
    );
  }

  if (status === "success" && whatsappMessage) {
    return (
      <div className={`${styles.card} ${styles.result}`} role="status">
        <WarningCircle size={38} weight="fill" className="mx-auto text-amber-800" aria-hidden="true" />
        <h2 ref={headingRef} tabIndex={-1} className="mt-4 scroll-mt-28 text-2xl font-semibold">Precisamos concluir com o atendimento.</h2>
        <p className="mt-3 text-sm leading-7">O CNPJ do cliente não foi reconhecido para registrar a coleta automaticamente.</p>
        <MessageActions message={whatsappMessage} fallbackLabel="Abrir atendimento" channelUrl={external.whatsappCommercial} />
        <button type="button" onClick={() => goToStep(0)} className="mt-4 text-sm font-semibold text-[var(--form-accent)] hover:underline">Editar dados</button>
      </div>
    );
  }

  return (
    <>
      <UnservedOriginDialog
        content={unservedOrigin}
        open={unservedOriginOpen}
        onOpenChange={(open) => {
          setUnservedOriginOpen(open);
          if (!open) goToStep(0);
        }}
      />
      <form
        ref={formRef}
        onSubmit={(event) => void onSubmit(event)}
        className={styles.card}
        aria-labelledby={headingId}
        noValidate
      >
        <StepProgress label="Etapas da coleta" steps={collectionSteps} step={step} disabled={isBusy} onBack={goToStep} />

        <div key={currentStep.id} className={styles.body} data-direction={direction}>
          <header className={styles.heading}>
            <p className={sectionTitleClassName}>Etapa {step + 1} de {collectionSteps.length}</p>
            <h2 id={headingId} ref={headingRef} tabIndex={-1}>{currentStep.title}</h2>
            <p>{currentStep.description}</p>
          </header>
          <fieldset disabled={isBusy} aria-labelledby={headingId} className="min-w-0">
            {currentStep.id === "operation" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="CNPJ do cliente e pagador" required>
                  <input {...collectionCnpjInput} required value={values.customerCnpj} onChange={formattedInput("customerCnpj")} placeholder="00.000.000/0000-00" />
                </Field>
                <Field label="CNPJ do local de coleta" required>
                  <input
                    {...collectionCnpjInput}
                    required
                    value={values.pickupLocationCnpj}
                    onChange={(event) => {
                      const cnpj = formatCnpj(event.target.value);
                      update("pickupLocationCnpj", cnpj);
                      schedulePickupLocationLookup(cnpj);
                    }}
                    onBlur={(event) => void lookupPickupLocationAddress(event.currentTarget.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </Field>
                <Field label="CNPJ do remetente">
                  <input {...collectionCnpjInput} value={values.senderCnpj} onChange={formattedInput("senderCnpj")} placeholder="Opcional" />
                </Field>
                <Field label="CNPJ do destinatário">
                  <input {...collectionCnpjInput} value={values.recipientCnpj} onChange={formattedInput("recipientCnpj")} placeholder="Opcional" />
                </Field>
                <Field label="Cidade de origem" required>
                  <input required value={values.originName} onChange={input("originName")} autoComplete="address-level2" placeholder="Ex.: Osasco" className={fieldClassName} />
                </Field>
                <Field label="UF de origem" required>
                  <input required value={values.originStateCode} onChange={input("originStateCode")} maxLength={2} pattern="[A-Za-z]{2}" autoComplete="address-level1" placeholder="SP" className={fieldClassName} />
                </Field>
              </div>
            )}

            {currentStep.id === "address" && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                <Field label="CEP de entrega" className="col-span-2 md:col-span-1">
                  <input
                    value={values.deliveryPostalCode}
                    onChange={(event) => {
                      const postalCode = formatPostalCode(event.target.value);
                      updateDeliveryAddress("deliveryPostalCode", postalCode);
                      void fillDeliveryCityFromPostalCode(postalCode);
                    }}
                    inputMode="numeric"
                    maxLength={9}
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    className={fieldClassName}
                  />
                </Field>
                <Field label="Logradouro" className="col-span-2 md:col-span-3">
                  <input value={values.deliveryStreet} onChange={(event) => updateDeliveryAddress("deliveryStreet", event.target.value)} autoComplete="address-line1" placeholder="Rua, avenida ou estrada" className={fieldClassName} />
                </Field>
                <Field label="Número">
                  <input value={values.deliveryNumber} onChange={(event) => updateDeliveryAddress("deliveryNumber", event.target.value)} autoComplete="address-line2" placeholder="Número" className={fieldClassName} />
                </Field>
                <Field label="Complemento">
                  <input value={values.deliveryComplement} onChange={(event) => updateDeliveryAddress("deliveryComplement", event.target.value)} autoComplete="address-line2" placeholder="Opcional" className={fieldClassName} />
                </Field>
                <Field label="Bairro" className="col-span-2">
                  <input value={values.deliveryNeighborhood} onChange={(event) => updateDeliveryAddress("deliveryNeighborhood", event.target.value)} autoComplete="address-level3" placeholder="Bairro" className={fieldClassName} />
                </Field>
                <Field label="Cidade de entrega" className="md:col-span-3">
                  <input value={values.deliveryCity} onChange={(event) => updateDeliveryAddress("deliveryCity", event.target.value)} autoComplete="address-level2" placeholder="Cidade" className={fieldClassName} />
                </Field>
                <Field label="UF de entrega">
                  <input value={values.deliveryStateCode} onChange={(event) => updateDeliveryAddress("deliveryStateCode", event.target.value)} maxLength={2} pattern="[A-Za-z]{2}" autoComplete="address-level1" placeholder="UF" className={fieldClassName} />
                </Field>
              </div>
            )}

            {currentStep.id === "schedule" && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
                <Field label="Data" required className="col-span-2">
                  <input required value={values.serviceDate} onChange={input("serviceDate")} type="date" className={fieldClassName} />
                </Field>
                <Field label="Horário inicial" required className="sm:col-span-2">
                  <input required value={values.serviceStartHour} onChange={input("serviceStartHour")} type="time" className={fieldClassName} />
                </Field>
                <Field label="Horário final" required className="sm:col-span-2">
                  <input required value={values.serviceEndHour} onChange={input("serviceEndHour")} type="time" className={fieldClassName} />
                </Field>
                <Field label="Referência interna" className="col-span-2 sm:col-span-3">
                  <input value={values.referenceNumber} onChange={input("referenceNumber")} placeholder="Opcional" className={fieldClassName} />
                </Field>
                <Field label="Observações" className="col-span-2 sm:col-span-3">
                  <input value={values.comments} onChange={input("comments")} placeholder="Opcional" className={fieldClassName} />
                </Field>
              </div>
            )}

            {currentStep.id === "invoice" && (
              <div className="space-y-4">
                <dl className={styles.summary}>
                  <div><dt>Origem</dt><dd>{values.originName} / {values.originStateCode.toUpperCase()}</dd></div>
                  <div><dt>Retirada solicitada</dt><dd>{values.serviceDate.split("-").reverse().join("/")} · {values.serviceStartHour} às {values.serviceEndHour}</dd></div>
                </dl>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Chave da NF"><input value={values.invoiceKey} onChange={input("invoiceKey")} inputMode="numeric" autoComplete="off" placeholder="44 dígitos" className={fieldClassName} /></Field>
                  <Field label="Número da NF"><input value={values.invoiceNumber} onChange={input("invoiceNumber")} autoComplete="off" placeholder="Ex.: 12345" className={fieldClassName} /></Field>
                  <Field label="Série"><input value={values.invoiceSeries} onChange={input("invoiceSeries")} autoComplete="off" placeholder="Ex.: 1" className={fieldClassName} /></Field>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => void validateInvoice()} disabled={isBusy} className={`${styles.secondary} inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors disabled:opacity-60`}>
                    {validationStatus === "loading" ? <SpinnerGap size={17} className="animate-spin" weight="bold" aria-hidden="true" /> : <ClipboardText size={17} weight="bold" aria-hidden="true" />}
                    {validationStatus === "loading" ? "Consultando..." : "Consultar NF"}
                  </button>
                  {isInvoiceCurrent && <span role="status" className="text-sm font-semibold text-emerald-800">NF confirmada</span>}
                </div>
              </div>
            )}

            {step < 2 && companyLookupStatus === "loading" && <p role="status" className="mt-4 text-sm">Buscando o endereço pelo CNPJ...</p>}
            {step < 2 && companyLookupMessage && <p role="status" className={`mt-4 text-sm ${companyLookupStatus === "success" ? "text-emerald-800" : "text-amber-800"}`}>{companyLookupMessage}</p>}
            {(status === "error" || validationStatus === "error") && <div className="mt-4"><Alert kind="error">{error}</Alert></div>}
          </fieldset>
        </div>

        <StepFooter step={step} onBack={goToStep} busy={isBusy} submitting={status === "loading"} last={isLastStep} submitLabel="Solicitar coleta" />
      </form>
    </>
  );
}
