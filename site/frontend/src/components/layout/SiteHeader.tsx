"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calculator, List, MagnifyingGlass } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { RODOGARCIA_WORDMARK } from "@/lib/brand";
import { site } from "@/lib/routes";
import { DEFAULT_HEADER_NAVIGATION } from "@/lib/headerNavigationDefaults";
import type { HeaderNavigationContent } from "@/types/content";
import { SiteSearchPanel } from "@/components/search/SiteSearchPanel";
import { useSiteSearch } from "@/components/search/SiteSearchProvider";
import { SiteNavigationDrawer } from "./SiteNavigationDrawer";

const DARK_HERO_ROUTES = [
  site.home,
  site.services,
  site.about,
  site.business,
  site.quote,
  site.collections,
  site.contact,
  site.careers,
  site.help,
  site.press,
  site.terms,
  site.privacy,
  site.voice,
  site.improvements,
] as const;

function matchesRoute(pathname: string, href: string) {
  if (href === site.home) return pathname === site.home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  initialNavigation,
}: {
  initialNavigation: HeaderNavigationContent;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const {
    isOpen: searchOpen,
    openSearch,
    closeSearch,
    toggleSearch,
  } = useSiteSearch();
  const isHidden = useScrollDirection();
  const pathname = usePathname();
  const navigation = initialNavigation?.items?.length
    ? initialNavigation
    : DEFAULT_HEADER_NAVIGATION;
  const hasDarkHero = DARK_HERO_ROUTES.some((route) => matchesRoute(pathname, route));
  const hasSolidChrome = isScrolled || searchOpen;
  const isOverlay = !hasSolidChrome;
  const useLightChrome = isOverlay && hasDarkHero;

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      setIsScrolled((prev) => {
        if (!prev && scrollY > 120) return true;
        if (prev && scrollY < 60) return false;
        return prev;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  /* Ctrl+K / Cmd+K shortcut to open search */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleSearch();
        return;
      }

      if (e.key === "Escape" && searchOpen) {
        e.preventDefault();
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSearch, searchOpen, toggleSearch]);

  useEffect(() => {
    closeSearch();
  }, [closeSearch, pathname]);

  useEffect(() => {
    if (drawerOpen) closeSearch();
  }, [drawerOpen, closeSearch]);

  useEffect(() => {
    if (searchOpen) setDrawerOpen(false);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (headerRef.current?.contains(target)) return;
      closeSearch();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closeSearch, searchOpen]);

  const iconButtonClassName = [
    "p-2 rounded-full transition-colors duration-[400ms] ease-out z-10",
    useLightChrome ? "text-white hover:bg-white/10" : "text-[var(--foreground)] hover:bg-black/5",
  ].join(" ");

  const logoWidthClassName = isOverlay
    ? useLightChrome
      ? "w-52"
      : "w-[11.4rem]"
    : "w-40";

  const quoteButtonClassName = [
    "p-2.5 rounded-full transition-all duration-[400ms] ease-out shadow-sm hover:shadow-md",
    useLightChrome
      ? "bg-white text-[var(--primary)] hover:bg-white/90 hover:-translate-y-0.5"
      : "bg-[var(--primary)] text-white hover:bg-[var(--color-primary-strong)] hover:-translate-y-0.5",
  ].join(" ");

  return (
    <>
      <header
        ref={headerRef}
        className={[
          "fixed top-0 inset-x-0 z-50",
          "transition-transform duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isHidden && isScrolled && !searchOpen ? "-translate-y-full pointer-events-none" : "translate-y-0",
        ].join(" ")}
        aria-label="Cabecalho do site"
      >
        <div
          className={[
            "absolute inset-0 transition-all duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-top",
            hasSolidChrome
              ? "bg-white/94 translate-y-0 border-b border-slate-900/[0.06] opacity-100 shadow-[0_18px_60px_rgba(15,23,42,0.085)] backdrop-blur-xl"
              : "pointer-events-none -translate-y-full border-transparent bg-white/0 opacity-0 shadow-none backdrop-blur-none",
          ].join(" ")}
          aria-hidden="true"
        />

        <div className="relative mx-auto flex h-[4.5rem] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex flex-1 justify-start">
            <button
              type="button"
              className={iconButtonClassName}
              aria-label={drawerOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={drawerOpen}
              aria-haspopup="dialog"
              aria-controls="site-mobile-nav"
              onClick={() => setDrawerOpen(true)}
            >
              <List size={22} weight="bold" />
            </button>
          </div>

          <Link
            href={site.home}
            className={[
              "absolute top-1/2 left-1/2 max-w-[calc(100%-9rem)] -translate-x-1/2 -translate-y-1/2",
              "transition-[width] duration-[400ms] ease-out motion-reduce:transition-none",
              logoWidthClassName,
            ].join(" ")}
            aria-label="Rodogarcia - Pagina inicial"
            onClick={(e) => {
              if (pathname === site.home) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <Image
              {...RODOGARCIA_WORDMARK}
              alt="Rodogarcia"
              className={[
                "block h-auto w-full transition-[filter] duration-[400ms] ease-out motion-reduce:transition-none",
                useLightChrome ? "brightness-0 invert drop-shadow-md" : "",
              ].join(" ")}
            />
          </Link>

          <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-2">
            <button
              type="button"
              id="site-search-trigger"
              className={["hidden sm:flex", iconButtonClassName].join(" ")}
              aria-label="Buscar no site (Ctrl+K)"
              title="Buscar (Ctrl+K)"
              aria-expanded={searchOpen}
              aria-controls="site-search-panel"
              onClick={openSearch}
            >
              <MagnifyingGlass size={22} weight="bold" />
            </button>
            <Link
              href={site.quote}
              className={quoteButtonClassName}
              aria-label="Solicitar cotação"
              title="Solicitar cotação"
            >
              <Calculator size={20} weight="bold" />
            </Link>
          </div>
        </div>

        <SiteSearchPanel open={searchOpen} onClose={closeSearch} />
      </header>

      <SiteNavigationDrawer
        open={drawerOpen}
        navigation={navigation}
        isActive={(href) => matchesRoute(pathname, href)}
        onClose={() => setDrawerOpen(false)}
        onSearch={() => {
          setDrawerOpen(false);
          openSearch();
        }}
      />
    </>
  );
}
