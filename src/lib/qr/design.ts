import type {
	CornerDotType,
	CornerSquareType,
	DotType,
	ErrorCorrectionLevel,
	Options,
} from "qr-code-styling";

/**
 * The saved QR design (`qr_configs.config`, jsonb): qr-code-styling's own
 * options plus two app fields. Both are optional, so designs saved before they
 * existed load unchanged.
 */
export type QrConfig = Options & {
	/** A short label printed under the code, in the preview and in downloads. */
	frameText?: { show: boolean; text: string };
	/** Hides the uploaded logo without forgetting it. Missing means shown. */
	showLogo?: boolean;
};

export const FRAME_TEXT_MAX = 28;
export const DEFAULT_FRAME_TEXT = "Scan for our menu";

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** Longest logo URL a design may store; UploadThing URLs are far shorter. */
export const LOGO_URL_MAX = 512;

/**
 * True for a logo the editor itself uploaded: an https URL on UploadThing's
 * file hosts (`<app>.ufs.sh/f/…`, or the legacy `utfs.io/f/…`). Anything else
 * (data: URLs, other hosts, plain http) is refused, so a saved design can
 * never make the editor fetch an arbitrary URL or carry a huge inline image.
 */
export function isUploadedLogoUrl(value: string): boolean {
	if (value.length > LOGO_URL_MAX) return false;
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return false;
	}
	const uploadHost =
		url.hostname === "utfs.io" || /^[a-z0-9-]+\.ufs\.sh$/.test(url.hostname);
	return (
		url.protocol === "https:" &&
		uploadHost &&
		url.port === "" &&
		url.username === "" &&
		url.password === "" &&
		url.pathname.startsWith("/f/")
	);
}

/** The four colours a preset sets, in the order the editor lists them. */
export type QrColors = {
	dots: string;
	background: string;
	cornerFrames: string;
	cornerDots: string;
};

export const COLOR_PRESETS: { name: string; colors: QrColors }[] = [
	{
		name: "Ink & amber",
		colors: {
			dots: "#16140F",
			background: "#FFFFFF",
			cornerFrames: "#16140F",
			cornerDots: "#C77F00",
		},
	},
	{
		name: "Coffee",
		colors: {
			dots: "#2A1F14",
			background: "#F5F0E8",
			cornerFrames: "#6B4C20",
			cornerDots: "#8B6914",
		},
	},
	{
		name: "Navy",
		colors: {
			dots: "#010E58",
			background: "#FFFFFF",
			cornerFrames: "#010E58",
			cornerDots: "#C77F00",
		},
	},
	{
		name: "Organic",
		colors: {
			dots: "#354834",
			background: "#F5F3EA",
			cornerFrames: "#5C7453",
			cornerDots: "#5C7453",
		},
	},
	{
		name: "Classic",
		colors: {
			dots: "#000000",
			background: "#FFFFFF",
			cornerFrames: "#000000",
			cornerDots: "#000000",
		},
	},
];

export const DOT_STYLES: { value: DotType; label: string }[] = [
	{ value: "square", label: "Square" },
	{ value: "dots", label: "Dots" },
	{ value: "rounded", label: "Rounded" },
	{ value: "extra-rounded", label: "Extra" },
	{ value: "classy", label: "Classy" },
	{ value: "classy-rounded", label: "Classy+" },
];

export const CORNER_FRAME_STYLES: { value: CornerSquareType; label: string }[] =
	[
		{ value: "square", label: "Square" },
		{ value: "dot", label: "Dot" },
		{ value: "extra-rounded", label: "Rounded" },
	];

export const CORNER_DOT_STYLES: { value: CornerDotType; label: string }[] = [
	{ value: "square", label: "Square" },
	{ value: "dot", label: "Dot" },
];

export const ERROR_CORRECTION: {
	value: ErrorCorrectionLevel;
	name: string;
	percent: number;
}[] = [
	{ value: "L", name: "Low", percent: 7 },
	{ value: "M", name: "Medium", percent: 15 },
	{ value: "Q", name: "Quartile", percent: 25 },
	{ value: "H", name: "High", percent: 30 },
];

/** The URL every catalogue's code points at. It is never taken from a saved design. */
export function catalogueUrl(catalogue: string): string {
	return `${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${catalogue}`;
}

/** A brand-new design: the redesign's "Ink & amber" look. */
export function defaultQrConfig(data: string): QrConfig {
	return {
		width: 300,
		height: 300,
		type: "svg",
		data,
		image: "",
		margin: 16,
		qrOptions: { typeNumber: 0, mode: "Byte", errorCorrectionLevel: "Q" },
		imageOptions: {
			hideBackgroundDots: true,
			imageSize: 0.6,
			margin: 0,
			crossOrigin: "anonymous",
		},
		dotsOptions: { color: "#16140F", type: "rounded" },
		backgroundOptions: { color: "#FFFFFF" },
		cornersSquareOptions: { color: "#16140F", type: "extra-rounded" },
		cornersDotOptions: { color: "#C77F00", type: "dot" },
		frameText: { show: true, text: DEFAULT_FRAME_TEXT },
		showLogo: true,
	};
}

/**
 * A saved design as the editor needs it: the URL is the catalogue's own, and
 * designs saved before frame text existed keep printing without it.
 */
export function loadQrConfig(
	saved: QrConfig | undefined,
	data: string,
): QrConfig {
	if (!saved) return defaultQrConfig(data);
	return {
		...saved,
		data,
		// A logo from before uploads were checked is dropped, so the design
		// can be saved again under today's rules.
		image:
			typeof saved.image === "string" && isUploadedLogoUrl(saved.image)
				? saved.image
				: "",
		frameText: sanitizeFrameText(saved.frameText) ?? {
			show: false,
			text: DEFAULT_FRAME_TEXT,
		},
		showLogo: saved.showLogo !== false,
	};
}

function sanitizeFrameText(
	value: unknown,
): { show: boolean; text: string } | undefined {
	if (!value || typeof value !== "object") return undefined;
	const { show, text } = value as { show?: unknown; text?: unknown };
	return {
		show: show === true,
		text: typeof text === "string" ? text.slice(0, FRAME_TEXT_MAX) : "",
	};
}

/**
 * What the server stores: the client's design with the app fields coerced to
 * their shapes and the URL replaced by the catalogue's own.
 */
export function normalizeQrConfig(config: QrConfig, data: string): QrConfig {
	return {
		...config,
		data,
		frameText: sanitizeFrameText(config.frameText),
		showLogo: config.showLogo !== false,
	};
}

/** The options qr-code-styling draws: the app fields stripped, a hidden logo dropped. */
export function toStylingOptions(config: QrConfig): Options {
	const { frameText: _frame, showLogo, ...options } = config;
	return {
		...options,
		// "" rather than undefined: update() merges, so undefined keeps the old logo.
		image: showLogo === false ? "" : (options.image ?? ""),
	};
}

/** The frame text to print, or null when it is off or blank. */
export function visibleFrameText(config: QrConfig): string | null {
	const text = config.frameText?.text.trim();
	return config.frameText?.show && text ? text : null;
}

export function colorsOf(config: QrConfig): QrColors {
	return {
		dots: config.dotsOptions?.color ?? "#000000",
		background: config.backgroundOptions?.color ?? "#FFFFFF",
		cornerFrames: config.cornersSquareOptions?.color ?? "#000000",
		cornerDots: config.cornersDotOptions?.color ?? "#000000",
	};
}

/** The option groups qr-code-styling nests; each is merged, not replaced. */
const OPTION_GROUPS = [
	"qrOptions",
	"imageOptions",
	"dotsOptions",
	"backgroundOptions",
	"cornersSquareOptions",
	"cornersDotOptions",
] as const;

/**
 * `prev` with `patch` applied: top-level keys replace, and an option group in
 * the patch is shallow-merged into the previous group. Groups the patch does
 * not mention are left exactly as they were (a missing group stays missing),
 * so undoing a change returns the design to its saved key.
 */
export function mergeQrConfig(
	prev: QrConfig,
	patch: Partial<QrConfig>,
): QrConfig {
	const next: QrConfig = { ...prev, ...patch };
	for (const group of OPTION_GROUPS) {
		if (patch[group]) {
			(next as Record<string, unknown>)[group] = {
				...prev[group],
				...patch[group],
			};
		}
	}
	return next;
}

/** A stable string for "has this design changed since it was saved?". */
export function designKey(config: QrConfig): string {
	const sort = (value: unknown): unknown => {
		if (Array.isArray(value)) return value.map(sort);
		if (value && typeof value === "object") {
			return Object.fromEntries(
				Object.entries(value as Record<string, unknown>)
					.filter(([, v]) => v !== undefined)
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([k, v]) => [k, sort(v)]),
			);
		}
		return value;
	};
	return JSON.stringify(sort(config));
}
