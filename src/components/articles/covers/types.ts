import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

/** One article cover: its backdrop, optional corner chip, and illustration. */
export type CoverDefinition = {
	/** Tailwind background classes for the cover panel. */
	background: string;
	chip?: { icon: LucideIcon; label: string };
	/** Dark backdrop: light grid lines and a dark chip. */
	dark?: boolean;
	Art: ComponentType;
};

/** The warm amber backdrop most covers share. */
export const warmBackground =
	"bg-[radial-gradient(80%_90%_at_50%_40%,#fff1d2_0%,#fff8e8_60%,#fdf3df_100%)]";
