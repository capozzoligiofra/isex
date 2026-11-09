import { Bike, Dumbbell, Footprints, Waves, Zap } from "lucide-react";
import type { Sport } from "@/lib/nutrition";

const ICONS = {
  cycling: Bike,
  running: Footprints,
  swimming: Waves,
  strength: Dumbbell,
  other: Zap,
} satisfies Record<Sport, unknown>;

export function SportIcon({ sport, className = "h-5 w-5" }: { sport: Sport; className?: string }) {
  const Icon = ICONS[sport];
  return <Icon className={className} aria-hidden />;
}
