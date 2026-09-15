"use client";

import { Moon, Sun, List } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { getAdminRouteContext } from "@/lib/routes";
import { DeveloperHelp } from "./ui";
import { useDeveloperPageHeader } from "./DeveloperPageHeaderContext";

interface DevTopbarProps {
  onOpenNavigation: () => void;
  darkTheme: boolean;
  onToggleTheme: () => void;
}

export default function DevTopbar({ onOpenNavigation, darkTheme, onToggleTheme }: DevTopbarProps) {
  const pathname = usePathname();
  const { session } = useSession();
  const { header } = useDeveloperPageHeader();
  const routeContext = getAdminRouteContext(pathname);
  const title = header?.title ?? routeContext.item.label;
  const eyebrow = header?.eyebrow ?? "Developer CMS";
  const description = header?.description;
  const stats = header?.stats ?? [];

  return (
    <header className="relative z-40 mx-3 mt-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/95 text-white shadow-[0_8px_24px_rgba(0,0,0,0.1)] backdrop-blur-xl sm:mx-4 sm:mt-4 lg:mx-6">
      {/* Textura visual do painel */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />
      
      {/* Efeito de profundidade e brilho do vidro */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-50" />

      <div className="relative flex flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label="Abrir navegação"
          className="group absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/90 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:scale-95 sm:left-5 lg:hidden"
        >
          <List size={22} weight="bold" className="transition-transform group-hover:scale-110" />
        </button>

        <div className="min-w-0 py-0.5 pl-13 lg:flex-1 lg:pl-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/80 sm:text-[11px]">
            {eyebrow}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-xl font-bold leading-tight tracking-[-0.025em] text-white drop-shadow-sm sm:text-2xl">
              {title}
            </h1>
            <DeveloperHelp label={title} kind="page" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {description ? <p className="max-w-[62ch] truncate text-xs leading-5 text-slate-300 sm:text-[13px]" title={description}>{description}</p> : null}
            {stats.length ? (
              <dl className="flex flex-wrap items-center gap-x-3 border-l border-white/15 pl-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-baseline gap-1.5">
                    <dt className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">{stat.label}</dt>
                    <dd className="text-sm font-bold tracking-[-0.02em] text-sky-200">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-3 lg:shrink-0 lg:justify-end">
          {header?.actions ? (
            <div className="flex items-stretch gap-2 [&>a]:min-h-10 [&>a]:rounded-xl [&>button]:min-h-10 [&>button]:rounded-xl">
              {header.actions}
            </div>
          ) : null}
          <div className="hidden shrink-0 items-center gap-3 border-l border-white/15 pl-4 sm:flex">
            <div className="hidden flex-col items-end text-right min-[1600px]:flex">
              <p className="max-w-[180px] truncate text-sm font-medium text-white/95 lg:max-w-[220px]">
                {session?.user?.email ?? "Acesso interno"}
              </p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-sky-300/70">Sessão interna</p>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={darkTheme ? "Ativar modo claro" : "Ativar modo noturno"}
              title={darkTheme ? "Ativar modo claro" : "Ativar modo noturno"}
              className={`cms-theme-toggle inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 ${darkTheme ? "cms-theme-toggle--dark !text-amber-200" : "text-sky-200"}`}
            >
              <span key={darkTheme ? "sun" : "moon"} className="cms-theme-toggle__icon">
                {darkTheme ? <Sun size={19} weight="bold" /> : <Moon size={19} weight="bold" />}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
