"use client";

import { Popover } from "@base-ui/react/popover";
import { useState } from "react";

export function HelpTooltip({ label, content }: { label: string; content: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        type="button"
        openOnHover
        delay={0}
        closeDelay={100}
        aria-label={`Ajuda sobre ${label}`}
        onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) setOpen(true); }}
        onBlur={() => setOpen(false)}
        className="inline-grid size-6 shrink-0 cursor-help place-items-center rounded-full text-slate-600 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-700"
      >
        <span aria-hidden="true" className="grid size-4 place-items-center rounded-full border border-slate-400 bg-slate-50 text-[10px] font-bold leading-none">?</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={6} collisionPadding={12} className="z-[70]">
          <Popover.Popup
            initialFocus={false}
            finalFocus={false}
            aria-label={`Ajuda sobre ${label}`}
            className="w-max max-w-[min(18rem,calc(100vw-1.5rem))] rounded-xl bg-slate-900 px-4 py-3 text-left text-sm leading-relaxed text-white shadow-lg"
          >
            {content}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
