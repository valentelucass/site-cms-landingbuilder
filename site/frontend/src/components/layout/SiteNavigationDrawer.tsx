"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  Buildings,
  Calculator,
  CaretDown,
  CaretUp,
  ChatCircleDots,
  GearSix,
  HouseLine,
  Info,
  Lightbulb,
  MagnifyingGlass,
  ShieldCheck,
  Truck,
  X,
} from "@phosphor-icons/react";
import { RODOGARCIA_WORDMARK } from "@/lib/brand";
import { site } from "@/lib/routes";
import type { HeaderNavigationContent, NavigationHighlightTone } from "@/types/content";

type MenuIcon = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

const MENU_ICONS: Record<string, MenuIcon> = {
  home: HouseLine,
  services: GearSix,
  about: Info,
  business: Buildings,
  contact: ChatCircleDots,
  careers: Briefcase,
  quote: Calculator,
  collections: Truck,
  voice: ShieldCheck,
  improvements: Lightbulb,
};

const HIGHLIGHT_COLORS: Record<NavigationHighlightTone, string> = {
  blue: "text-blue-700",
  emerald: "text-emerald-700",
  amber: "text-amber-800",
  violet: "text-violet-700",
};

const MENU_GROUPS = [
  { id: "principal", label: "Principal" },
  { id: "explorar", label: "Explorar" },
] as const;

const INITIAL_SCROLL = { overflow: false, up: false, down: false };
const LIST_ID = "site-navigation-list";

function ScrollButton({ direction, available, onScroll }: {
  direction: -1 | 1;
  available: boolean;
  onScroll: (direction: -1 | 1) => void;
}) {
  const Icon = direction === -1 ? CaretUp : CaretDown;
  return (
    <div className="flex shrink-0 justify-center">
      <button
        type="button"
        aria-label={direction === -1 ? "Subir menu lateral" : "Descer menu lateral"}
        aria-controls={LIST_ID}
        aria-disabled={!available}
        className="grid h-9 w-14 place-items-center rounded-lg text-sidebar-accent-foreground transition-colors aria-disabled:opacity-35 aria-[disabled=false]:hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sidebar-ring"
        onClick={() => { if (available) onScroll(direction); }}
      >
        <Icon size={18} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
}

interface SiteNavigationDrawerProps {
  open: boolean;
  navigation: HeaderNavigationContent;
  isActive: (url: string) => boolean;
  onClose: () => void;
  onSearch: () => void;
}

export function SiteNavigationDrawer({ open, navigation, isActive, onClose, onSearch }: SiteNavigationDrawerProps) {
  const panelRef = useRef<HTMLDialogElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(INITIAL_SCROLL);

  useEffect(() => {
    const panel = panelRef.current;
    const region = regionRef.current;
    const viewport = viewportRef.current;
    const list = listRef.current;
    if (!open || !panel || !region || !viewport || !list) return;

    panel.showModal();
    document.documentElement.classList.add("has-nav-open");
    viewport.scrollTop = 0;

    const measure = () => {
      // The region includes both arrow slots, so rendering them cannot create its own overflow.
      const overflow = list.offsetHeight > region.clientHeight + 1;
      const remaining = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;
      const up = overflow && viewport.scrollTop > 1;
      const down = overflow && remaining > 1;
      setScroll((current) =>
        current.overflow === overflow && current.up === up && current.down === down
          ? current
          : { overflow, up, down }
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    observer.observe(viewport);
    observer.observe(list);
    viewport.addEventListener("scroll", measure, { passive: true });

    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", measure);
      panel.close();
      document.documentElement.classList.remove("has-nav-open");
    };
  }, [open]);

  function scrollMenu(direction: -1 | 1) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({
      top: direction * Math.max(44, Math.round(viewport.clientHeight * 0.65)),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <dialog
      ref={panelRef}
      id="site-mobile-nav"
      aria-label="Menu de navegação"
      className="fixed inset-y-0 left-0 right-auto m-0 hidden h-dvh max-h-none w-80 max-w-[90vw] overflow-hidden border-r border-sidebar-border bg-sidebar p-0 pb-[env(safe-area-inset-bottom)] text-sidebar-foreground shadow-xl backdrop:bg-slate-950/45 backdrop:backdrop-blur-[2px] open:flex open:flex-col motion-safe:open:animate-in motion-safe:open:slide-in-from-left-3 motion-safe:open:fade-in motion-safe:duration-200"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
        if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
          onClose();
        }
      }}
    >
      <div className="relative grid min-h-16 shrink-0 place-items-center border-b border-sidebar-border px-12">
        <Image {...RODOGARCIA_WORDMARK} alt="Rodogarcia" className="h-auto w-44 max-w-full" />
        <button
          type="button"
          aria-label="Fechar menu"
          className="absolute right-1.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sidebar-ring"
          onClick={onClose}
        >
          <X size={18} weight="bold" aria-hidden="true" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-76 shrink-0 px-3 pt-3 pb-1">
        <button
          type="button"
          aria-controls="site-search-panel"
          onClick={onSearch}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-lg bg-sidebar-accent/70 px-2.5 text-left text-sm font-medium text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sidebar-ring"
        >
          <MagnifyingGlass size={17} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          Buscar no site
        </button>
      </div>

      <div ref={regionRef} className="mx-auto flex min-h-0 w-full max-w-76 flex-1 flex-col">
        {scroll.overflow && <ScrollButton direction={-1} available={scroll.up} onScroll={scrollMenu} />}
        <nav
          ref={viewportRef}
          id={LIST_ID}
          aria-label="Navegação do site"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div ref={listRef} className="divide-y divide-sidebar-border px-3 pt-1 pb-3">
            {MENU_GROUPS.map(({ id, label }) => {
              const items = navigation.items.filter((item) => item.group === id);
              if (!items.length) return null;

              return (
                <ul key={id} aria-label={label} className="grid gap-0.5 py-2 first:pt-0 last:pb-0">
                  {items.map(({ id: itemId, label: itemLabel, url, icon, highlightLabel, highlightTone }) => {
                    const Icon = MENU_ICONS[icon] ?? Info;
                    const active = isActive(url);
                    return (
                      <li key={itemId}>
                        <Link
                          href={url}
                          prefetch={open && url.startsWith("/") && !url.startsWith("//")}
                          aria-current={active ? "page" : undefined}
                          onClick={onClose}
                          className={[
                            "flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sidebar-ring",
                            active
                              ? "bg-[var(--color-primary-soft)] font-semibold text-sidebar-primary"
                              : "font-medium text-sidebar-foreground hover:bg-sidebar-accent",
                          ].join(" ")}
                        >
                          <Icon size={17} className={active ? "shrink-0" : "shrink-0 text-muted-foreground"} aria-hidden={true} />
                          <span className="min-w-0 wrap-anywhere">{itemLabel}</span>
                          {highlightLabel && (
                            <span className={`ml-auto max-w-[40%] wrap-anywhere text-right text-xs leading-tight ${HIGHLIGHT_COLORS[highlightTone ?? "blue"]}`}>
                              {highlightLabel}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              );
            })}
          </div>
        </nav>
        {scroll.overflow && <ScrollButton direction={1} available={scroll.down} onScroll={scrollMenu} />}
      </div>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Link
          href={site.quote}
          prefetch={open}
          onClick={onClose}
          className="mx-auto grid min-h-11 w-full max-w-70 place-items-center rounded-lg bg-sidebar-primary px-3 text-sm font-semibold text-sidebar-primary-foreground transition-colors hover:bg-[var(--color-primary-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
        >
          Solicitar cotação
        </Link>
      </div>
    </dialog>
  );
}
