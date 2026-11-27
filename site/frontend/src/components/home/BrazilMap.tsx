"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Select } from "@base-ui/react/select";
import { ArrowUpRight, CaretDown, Check, EnvelopeSimple, MapPin, Phone } from "@phosphor-icons/react";
import { MAP_STATE_BY_CODE } from "@/data/brazilMap";
import { site } from "@/lib/routes";
import type { HomeRegionalUnit } from "@/types/content";
import BrazilMapFigure from "./BrazilMapFigure";
import styles from "./BrazilMap.module.css";

function normalizeUnits(units: HomeRegionalUnit[]) {
  return units
    .filter((unit) => unit.active !== false)
    .map((unit) => ({ ...unit, state: unit.state?.trim().toLowerCase() ?? "" }))
    .filter((unit) => unit.id && unit.name && unit.state && unit.address)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export default function BrazilMap({ units }: { units: HomeRegionalUnit[] }) {
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const activeUnits = useMemo(() => normalizeUnits(units), [units]);
  const statesWithUnits = useMemo(() => new Set(activeUnits.map(({ state }) => state)), [activeUnits]);
  const selectedUnit = activeUnits.find(({ id }) => id === selectedUnitId) ?? activeUnits[0];

  if (!selectedUnit) return null;

  const { state: selectedState, address, description, phone, email, additionalEmail } = selectedUnit;
  const state = MAP_STATE_BY_CODE.get(selectedState);
  const locationLabel = state ? state.name + " · " + state.region : selectedState.toUpperCase();
  const emails = [...new Set([email, additionalEmail].map((value) => value?.trim()).filter(Boolean))];
  const phoneDigits = phone?.replace(/[^+\d]/g, "");
  const phoneHref = phoneDigits && phone && !/x{2,}/i.test(phone) && phoneDigits.replace("+", "").length >= 8
    ? `tel:${phoneDigits}` : undefined;

  function selectState(code: string) {
    if (code === selectedState) return;

    const firstUnit = activeUnits.find(({ state }) => state === code);
    if (firstUnit) setSelectedUnitId(firstUnit.id);
  }

  return (
    <div className={styles.scene}>
      <header className={styles.intro}>
        <span className={styles.kicker}>Presença regional</span>
        <h2>Filiais e pontos de apoio</h2>
        <p>Encontre a equipe que atende a sua operação.</p>
      </header>

      <div className={styles.directory}>
        <div className={styles.sheet}>
          <div className={styles.unit} aria-live="polite">
            <p className={styles.captionLabel}>{locationLabel}</p>
            <h3 className={styles.unitName}>{selectedUnit.name.replace(/\s*\/\s*[A-Z]{2}$/i, "")}</h3>
          </div>
          <div className={styles.location} aria-live="polite">
            {description && <p className={styles.description}>{description}</p>}
            <p className={styles.address}><MapPin size={17} aria-hidden="true" />{address}</p>
          </div>

          {(phoneHref || emails.length > 0) && (
            <div className={styles.contacts}>
              {phoneHref && <a href={phoneHref}><Phone size={17} aria-hidden="true" /><span>{phone}</span></a>}
              {emails.map((value) => <a key={value} href={`mailto:${value}`}><EnvelopeSimple size={17} aria-hidden="true" /><span>{value}</span></a>)}
            </div>
          )}
          <div className={styles.actions}>
            <Link href={selectedUnit.contactUrl || site.contact} className={styles.contactLink}>
              {selectedUnit.buttonLabel || "Falar com esta unidade"}
              <ArrowUpRight size={13} weight="bold" aria-hidden="true" />
            </Link>
            {activeUnits.length > 1 && (
              <Select.Root
                modal={false}
                value={selectedUnit.id}
                onValueChange={(id) => { if (id) setSelectedUnitId(id); }}
              >
                <Select.Trigger className={styles.change}>
                  Trocar unidade <Select.Icon><CaretDown size={14} aria-hidden="true" /></Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner align="start" side="bottom" sideOffset={4} alignItemWithTrigger={false} className={styles.positioner}>
                    <Select.Popup className={styles.picker}>
                      <Select.List>
                        {activeUnits.map((unit) => (
                          <Select.Item key={unit.id} value={unit.id} label={unit.name} className={styles.option}>
                            <Select.ItemText>{unit.name}</Select.ItemText>
                            <Select.ItemIndicator><Check size={14} aria-hidden="true" /></Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.List>
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            )}
          </div>
        </div>
      </div>

      <BrazilMapFigure
        statesWithUnits={statesWithUnits}
        selectedState={selectedState}
        onSelectState={selectState}
      />
    </div>
  );
}
