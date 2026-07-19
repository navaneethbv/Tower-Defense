import type { StatusApplication, StatusKind } from "../types";

export interface StatusPresentation {
  label: string;
  icon: string;
  color: string;
  // Plain-language description of what this magnitude does.
  effect: (magnitude: number) => string;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// One visible identity per status kind: a compact board chip and the wording the
// selected tower panel uses. Icons stay single-character so chips read clearly
// at 13px.
export const STATUS_PRESENTATION: Record<StatusKind, StatusPresentation> = {
  burn: {
    label: "Burn",
    icon: "🔥",
    color: "#fb7185",
    effect: (magnitude) => `${magnitude} damage per second`,
  },
  poison: {
    label: "Poison",
    icon: "☠",
    color: "#c084fc",
    effect: (magnitude) => `${magnitude} damage per second`,
  },
  toxic: {
    label: "Toxic",
    icon: "♨",
    color: "#a855f7",
    effect: (magnitude) => `${magnitude} damage per second, rising each second`,
  },
  paralysis: {
    label: "Paralysis",
    icon: "⚡",
    color: "#facc15",
    effect: (magnitude) => `${percent(magnitude)} slower with brief stops`,
  },
  freeze: {
    label: "Freeze",
    icon: "❄",
    color: "#67e8f9",
    effect: () => "movement stopped until a fire hit thaws it",
  },
  sleep: {
    label: "Sleep",
    icon: "Z",
    color: "#818cf8",
    effect: () => "movement stopped until the next direct hit",
  },
  confusion: {
    label: "Confusion",
    icon: "?",
    color: "#f0abfc",
    effect: (magnitude) => `${magnitude} damage per pulse with brief stops`,
  },
  slow: {
    label: "Slow",
    icon: "▼",
    color: "#38bdf8",
    effect: (magnitude) => `${percent(magnitude)} slower`,
  },
  stun: {
    label: "Stun",
    icon: "✦",
    color: "#fbbf24",
    effect: () => "movement stopped",
  },
  armorBreak: {
    label: "Armor break",
    icon: "◇",
    color: "#94a3b8",
    effect: () => "armor removed",
  },
  curse: {
    label: "Curse",
    icon: "✧",
    color: "#a5b4fc",
    effect: (magnitude) => `armor removed and ${percent(magnitude)} more status damage`,
  },
};

export function statusSummary(application: StatusApplication): string {
  const presentation = STATUS_PRESENTATION[application.kind];
  return [
    presentation.label,
    `${percent(application.chance)} chance`,
    `${application.duration.toFixed(1)}s`,
    presentation.effect(application.magnitude),
  ].join(" · ");
}
