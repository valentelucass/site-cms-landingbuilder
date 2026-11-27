export const SVG_PATH = "/map.svg";

type MapState = {
  code: string;
  name: string;
  region: string;
  label: readonly [number, number];
};

// Entries follow the source path order: map.svg's IDs do not match its outlines.
// Label centers are measured in the projected plane before the selected state is raised.
export const MAP_STATES: readonly MapState[] = [
  { code: "ro", name: "Rondônia", region: "Norte", label: [99.99, 151.94] },
  { code: "ac", name: "Acre", region: "Norte", label: [34.82, 131.82] },
  { code: "am", name: "Amazonas", region: "Norte", label: [89.74, 89.41] },
  { code: "rr", name: "Roraima", region: "Norte", label: [123.46, 42.82] },
  { code: "ap", name: "Amapá", region: "Norte", label: [213.04, 52.15] },
  { code: "to", name: "Tocantins", region: "Norte", label: [243.9, 150.19] },
  { code: "mt", name: "Mato Grosso", region: "Centro-Oeste", label: [168.24, 173.71] },
  { code: "go", name: "Goiás", region: "Centro-Oeste", label: [225.83, 206.76] },
  { code: "ms", name: "Mato Grosso do Sul", region: "Centro-Oeste", label: [175.14, 243.61] },
  { code: "mg", name: "Minas Gerais", region: "Sudeste", label: [262.87, 232.76] },
  { code: "pr", name: "Paraná", region: "Sul", label: [202.56, 280.79] },
  { code: "rs", name: "Rio Grande do Sul", region: "Sul", label: [175.81, 329.47] },
  { code: "ba", name: "Bahia", region: "Nordeste", label: [299.8, 190.78] },
  { code: "pi", name: "Piauí", region: "Nordeste", label: [293.55, 132.43] },
  { code: "ce", name: "Ceará", region: "Nordeste", label: [331.17, 122.18] },
  { code: "rn", name: "Rio Grande do Norte", region: "Nordeste", label: [354.95, 129.22] },
  { code: "al", name: "Alagoas", region: "Nordeste", label: [352.79, 161.9] },
  { code: "se", name: "Sergipe", region: "Nordeste", label: [346.18, 169.1] },
  { code: "df", name: "Distrito Federal", region: "Centro-Oeste", label: [242.87, 206.66] },
  { code: "pe", name: "Pernambuco", region: "Nordeste", label: [340.64, 149.72] },
  { code: "ma", name: "Maranhão", region: "Nordeste", label: [274.67, 120.57] },
  { code: "pa", name: "Pará", region: "Norte", label: [208, 97.46] },
  { code: "sp", name: "São Paulo", region: "Sudeste", label: [229.61, 264.86] },
  { code: "rj", name: "Rio de Janeiro", region: "Sudeste", label: [284.1, 265.01] },
  { code: "es", name: "Espírito Santo", region: "Sudeste", label: [306.41, 245.18] },
  { code: "sc", name: "Santa Catarina", region: "Sul", label: [202.31, 307.37] },
  { code: "pb", name: "Paraíba", region: "Nordeste", label: [353.94, 140.14] },
];

export const MAP_STATE_BY_CODE = new Map(MAP_STATES.map((state) => [state.code, state]));
