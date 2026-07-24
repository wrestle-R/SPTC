export const TEAM_JERSEYS: Record<string, { front: string; back: string }> = {
  "crimson-warriors": { front: "/Jersey/red-front-v2.png", back: "/Jersey/red-back-v2.png" },
  "gods-gladiators": { front: "/Jersey/blue-front-v2.png", back: "/Jersey/blue-back-v2.png" },
  "karuppu-knights": { front: "/Jersey/black-front-v2.png", back: "/Jersey/black-back-v2.png" },
  "ivory-elites": { front: "/Jersey/ivory-front-v2.png", back: "/Jersey/ivory-back-v2.png" },
};

export const TEAM_GRADIENTS: Record<string, string> = {
  "crimson-warriors": "from-red-600 via-red-500 to-orange-500",
  "gods-gladiators": "from-blue-600 via-blue-500 to-cyan-500",
  "karuppu-knights": "from-zinc-700 via-zinc-600 to-slate-500",
  "ivory-elites": "from-amber-100 via-orange-50 to-rose-50",
};

export const TEAM_TEXT_COLORS: Record<string, string> = {
  "crimson-warriors": "text-white",
  "gods-gladiators": "text-white",
  "karuppu-knights": "text-white",
  "ivory-elites": "text-zinc-900",
};

export function teamAccentColor(color?: string | null) {
  if (!color) return "transparent";
  return ["#22c55e", "#10b981", "#16a34a", "#15803d", "#4ade80"].includes(color.toLowerCase()) ? "#3b82f6" : color;
}

export function teamInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
