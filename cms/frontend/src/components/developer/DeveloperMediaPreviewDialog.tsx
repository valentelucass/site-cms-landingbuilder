"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";

interface DeveloperMediaPreviewDialogProps {
  src: string;
  reference: string;
  alt: string;
  mediaType: "image" | "video";
  onClose: () => void;
  trigger: HTMLButtonElement | null;
}

const buttonClassName = "inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--secondary)] px-3 py-2 text-xs font-semibold text-[var(--secondary-foreground)] transition-colors hover:bg-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]";

export function DeveloperMediaPreviewDialog({ src, reference, alt, mediaType, onClose, trigger }: DeveloperMediaPreviewDialogProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    // Cards com backdrop-filter criam um containing block para elementos fixed.
    // O portal preserva o tema do CMS sem herdar o recorte e as camadas do card.
    setPortalTarget(document.querySelector<HTMLElement>("[data-admin-shell='true']") ?? document.body);
  }, []);

  useEffect(() => {
    if (!portalTarget) return;
    const previousFocus = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const scrollContainers = [document.body, ...portalTarget.querySelectorAll<HTMLElement>("[data-admin-scroll]")];
    const previousOverflow = scrollContainers.map((container) => container.style.overflow);
    scrollContainers.forEach((container) => { container.style.overflow = "hidden"; });
    closeRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      // Notificações acima do modal mantêm seu próprio fechamento por Escape.
      if (event.target instanceof Element && event.target.closest(".cms-notification")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      } else if (event.key === "Tab") {
        const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], video[controls], [tabindex="0"]',
        ) ?? []).filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (first && last && (!dialogRef.current?.contains(document.activeElement)
          || (event.shiftKey ? document.activeElement === first : document.activeElement === last))) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus({ preventScroll: true });
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      scrollContainers.forEach((container, index) => { container.style.overflow = previousOverflow[index]; });
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [onClose, portalTarget, trigger]);

  if (!portalTarget) return null;

  return createPortal(
    <div
      data-media-preview-dialog="true"
      className="cms-content-dialog fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        // O foco padrão do mousedown não deve desfazer a restauração ao botão Ampliar.
        event.preventDefault();
        onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-full max-h-[52rem] min-h-0 w-full max-w-5xl flex-col gap-3 overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-3 text-[var(--foreground)] shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3">
          <h2 id={titleId} className="min-w-0 text-sm font-semibold">Preview da mídia</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar preview" className={buttonClassName}>
            <X size={16} aria-hidden="true" /> Fechar
          </button>
        </div>
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl bg-[var(--background)]" aria-busy={status === "loading"}>
          {status === "error" ? (
            <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 overflow-y-auto p-3 text-center text-sm">
              <p>Não foi possível carregar esta mídia.</p>
              <button type="button" className={buttonClassName} onClick={() => { setStatus("loading"); setAttempt((value) => value + 1); }}>Tentar novamente</button>
            </div>
          ) : (
            <>
              {status === "loading" ? <p role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-[var(--color-muted-raw)]">Carregando mídia…</p> : null}
              {mediaType === "video" ? (
                <video key={attempt} src={src} controls autoPlay muted playsInline tabIndex={0} aria-label={alt}
                  onLoadedData={() => setStatus("ready")} onError={() => setStatus("error")}
                  className="relative block h-full w-full min-w-0 object-contain" />
              ) : (
                <img key={attempt} src={src} alt={alt} onLoad={() => setStatus("ready")} onError={() => setStatus("error")}
                  className="relative block h-full w-full min-w-0 object-contain" />
              )}
            </>
          )}
        </div>
        <p title={reference} className="shrink-0 truncate text-xs leading-5 text-[var(--color-muted-raw)]">{reference}</p>
      </div>
    </div>,
    portalTarget,
  );
}
