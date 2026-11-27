"use client";

import { useEffect, useId, useState } from "react";
import { MAP_STATES, SVG_PATH } from "@/data/brazilMap";
import styles from "./BrazilMap.module.css";

type MapShape = (typeof MAP_STATES)[number] & { path: string };
type Geometry = MapShape[] | "unavailable" | null;

const PROJECTION = "matrix(1 .08 -.08 .89 0 0)";
const PATH_SCALE = "scale(.002)";
const ELEVATION = 4;
const PORCELAIN_DEPTH = [
  { y: 7, fill: "#101e30" },
  { y: 5, fill: "#7597ae" },
  { y: 2, fill: "#abcbdc" },
];
const LABEL_CALLOUTS = new Map([
  ["pe", [51, 8]],
  ["rj", [48, 15]],
]);

function readGeometry(svgText: string): MapShape[] {
  const document = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const paths = Array.from(document.querySelectorAll("svg > g > path[id]"), (path) =>
    path.getAttribute("d"),
  );
  if (paths.length !== MAP_STATES.length || document.querySelector("parsererror")) {
    throw new Error("Geometria do mapa indisponível.");
  }

  // Carry only path data into the new SVG; the source styling and markup stay inert.
  return MAP_STATES.map((state, index) => {
    const path = paths[index];
    if (!path) throw new Error("Contorno ausente no mapa.");
    return { ...state, path };
  });
}

export default function BrazilMapFigure({
  statesWithUnits,
  selectedState,
  onSelectState,
}: {
  statesWithUnits: ReadonlySet<string>;
  selectedState: string;
  onSelectState: (code: string) => void;
}) {
  const id = useId();
  const [geometry, setGeometry] = useState<Geometry>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(SVG_PATH, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Mapa indisponível.");
        return response.text();
      })
      .then(readGeometry)
      .then((shapes) => {
        if (!controller.signal.aborted) setGeometry(shapes);
      })
      .catch(() => {
        if (!controller.signal.aborted) setGeometry("unavailable");
      });
    return () => controller.abort();
  }, []);

  const country = id + "-country";
  const shapeRef = (code: string) => "#" + id + "-" + code;
  const activeShape = geometry && geometry !== "unavailable"
    ? geometry.find((shape) => shape.code === selectedState)
    : undefined;

  return (
    <figure className={styles.figure} aria-label="Mapa das unidades da Rodogarcia no Brasil">
      <div className={"svg-wrapper " + styles.map}>
        {geometry === null || geometry === "unavailable" ? (
          <p className={styles.mapStatus} role="status">
            {geometry === null ? "Carregando mapa do Brasil…" : "Mapa do Brasil indisponível."}
          </p>
        ) : (
          <svg
            viewBox="-32 -8 456 407"
            aria-hidden="true"
            focusable="false"
            onPointerOver={(event) => {
              if (event.pointerType === "touch") return;
              const target = event.target;
              setHoveredState(target instanceof Element ? target.closest("[data-region]")?.getAttribute("data-region") ?? null : null);
            }}
            onPointerLeave={() => setHoveredState(null)}
            onPointerCancel={() => setHoveredState(null)}
          >
            <defs>
              {geometry.map(({ code, path }) => <path key={code} id={id + "-" + code} d={path} />)}
              <g id={country}>
                {geometry.map(({ code }) => <use key={code} href={shapeRef(code)} transform={PATH_SCALE} />)}
              </g>
            </defs>

            <g pointerEvents="none">
              {PORCELAIN_DEPTH.map(({ y, fill }) => (
                <use key={y} href={"#" + country} fill={fill} transform={"translate(0 " + y + ") " + PROJECTION} />
              ))}
            </g>
            <g transform={PROJECTION}>
              <use href={"#" + country} fill="var(--map-land)" pointerEvents="none" />
              {geometry.map(({ code }) => {
                const hasBranch = statesWithUnits.has(code);
                return (
                  <use
                    key={code}
                    href={shapeRef(code)}
                    transform={PATH_SCALE}
                    fill={hasBranch ? "var(--map-branch)" : "none"}
                    data-hovered={hasBranch && hoveredState === code && selectedState !== code || undefined}
                    stroke={hasBranch ? "var(--branch-edge)" : "var(--map-boundary)"}
                    strokeWidth={hasBranch ? 500 : 420}
                    strokeLinejoin="round"
                    pointerEvents={hasBranch ? "visiblePainted" : "none"}
                    className={hasBranch ? styles.mapTarget : undefined}
                    data-map-state={hasBranch ? code : undefined}
                    data-region={hasBranch ? code : undefined}
                    onClick={hasBranch ? () => onSelectState(code) : undefined}
                  />
                );
              })}
            </g>
            {activeShape ? (
              <g transform={"translate(0 " + -ELEVATION + ")"} data-region={activeShape.code} className={styles.mapTarget}>
                <use
                  href={shapeRef(activeShape.code)}
                  transform={"translate(0 3) " + PROJECTION + " " + PATH_SCALE}
                  fill="#153d76"
                />
                <use
                  href={shapeRef(activeShape.code)}
                  transform={PROJECTION + " " + PATH_SCALE}
                  fill="var(--map-selected)"
                  stroke="var(--selected-edge)"
                  strokeWidth={700}
                  strokeLinejoin="round"
                  className={styles.mapTarget}
                  data-map-active={activeShape.code}
                  onClick={() => onSelectState(activeShape.code)}
                />
              </g>
            ) : null}
            <g className={styles.labels}>
              {geometry
                .filter(({ code }) => statesWithUnits.has(code))
                .map(({ code, label: [x, centerY] }) => {
                  const y = centerY - (code === selectedState ? ELEVATION : 0);
                  const callout = LABEL_CALLOUTS.get(code);
                  const labelX = callout ? x + callout[0] : x;
                  const labelY = callout ? y + callout[1] : y + 1;
                  const route = "M" + x + " " + y + " L" + (labelX - 18) + " " + labelY + " H" + (labelX - 2);
                  return (
                    <g key={code} data-region={code} className={styles.mapTarget} onClick={() => onSelectState(code)}>
                      {callout ? (
                        <g data-map-callout={code}>
                          <path d={route} stroke="transparent" strokeWidth={9} fill="none" pointerEvents="stroke" />
                          <path d={route} stroke="#132b45" strokeWidth={2.4} fill="none" />
                          <path d={route} stroke="#c1ddf4" strokeWidth={1.2} fill="none" />
                          <circle cx={x} cy={y} r={2.6} fill="#f8fcff" stroke="#1b456c" />
                        </g>
                      ) : null}
                      {callout && <rect x={labelX - 2} y={labelY - 11} width={27} height={22} fill="transparent" />}
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor={callout ? "start" : "middle"}
                        dominantBaseline="central"
                        fontSize={callout ? 18 : 16}
                        stroke={callout ? "#091427" : "#204671"}
                        strokeWidth={callout ? 3 : 1.3}
                        className={styles.mapTarget}
                        data-map-label={code}
                      >
                        {code.toUpperCase()}
                      </text>
                    </g>
                  );
                })}
            </g>
          </svg>
        )}
      </div>
    </figure>
  );
}
