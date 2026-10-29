import {
	ArrowLeft,
	Copy,
	Download,
	Globe,
	Image as ImageIcon,
	Info,
	type LucideIcon,
	Palette,
	Save,
	Shapes,
	SlidersHorizontal,
} from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { AppNavbar, Btn, PageWash } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

/**
 * The QR code editor, drawn as the full 1280px page it really is: the app
 * navbar, the page header, then a two-column grid with the tabbed controls on
 * the left and the sticky preview panel on the right.
 *
 * The code in the preview is the real matrix for the sample catalogue URL,
 * generated at error correction Q the way the product generates it, so the
 * pattern a reader sees is the pattern the editor would draw.
 */

/** The four colours a design sets, in the order the Colors tab lists them. */
type QrColors = {
	dots: string;
	background: string;
	cornerFrames: string;
	cornerDots: string;
};

/** A brand-new design: ink dots, frames and eyes on white (defaultQrConfig). */
const DEFAULT_COLORS: QrColors = {
	background: "#FFFFFF",
	cornerDots: "#16140F",
	cornerFrames: "#16140F",
	dots: "#16140F",
};

const COLOR_PRESETS: { name: string; colors: QrColors }[] = [
	{
		colors: {
			background: "#FFFFFF",
			cornerDots: "#C77F00",
			cornerFrames: "#16140F",
			dots: "#16140F",
		},
		name: "Ink & amber",
	},
	{
		colors: {
			background: "#F5F0E8",
			cornerDots: "#8B6914",
			cornerFrames: "#6B4C20",
			dots: "#2A1F14",
		},
		name: "Coffee",
	},
	{
		colors: {
			background: "#FFFFFF",
			cornerDots: "#C77F00",
			cornerFrames: "#010E58",
			dots: "#010E58",
		},
		name: "Navy",
	},
	{
		colors: {
			background: "#F5F3EA",
			cornerDots: "#5C7453",
			cornerFrames: "#5C7453",
			dots: "#354834",
		},
		name: "Organic",
	},
	{
		colors: {
			background: "#FFFFFF",
			cornerDots: "#000000",
			cornerFrames: "#000000",
			dots: "#000000",
		},
		name: "Classic",
	},
];

const COLOR_ROWS: { name: string; hint: string; value: string }[] = [
	{ hint: "The data pattern", name: "QR Dots", value: DEFAULT_COLORS.dots },
	{
		hint: "Behind the code",
		name: "Background",
		value: DEFAULT_COLORS.background,
	},
	{
		hint: "Outer ring of the 3 markers",
		name: "Corner Frames",
		value: DEFAULT_COLORS.cornerFrames,
	},
	{
		hint: "Centre of the 3 markers",
		name: "Corner Dots",
		value: DEFAULT_COLORS.cornerDots,
	},
];

const TABS: { label: string; icon: LucideIcon }[] = [
	{ icon: Palette, label: "Colors" },
	{ icon: Shapes, label: "Style" },
	{ icon: ImageIcon, label: "Logo" },
	{ icon: SlidersHorizontal, label: "Settings" },
];

/**
 * The real 37 x 37 matrix for https://www.quicktalog.app/catalogues/brightside-cafe-menu
 * at error correction Q, one string per row, "1" for a dark module.
 */
const QR_ROWS = [
	"1111111001000011010011110111001111111",
	"1000001000100001000001101010101000001",
	"1011101011010111100101101010001011101",
	"1011101000001011011010000101101011101",
	"1011101010101001101011110111001011101",
	"1000001011000011001011100100101000001",
	"1111111010101010101010101010101111111",
	"0000000001100100010001010010000000000",
	"0100101010001101110101111011010110100",
	"1011100111101101000110011011100010100",
	"1101111011000101011010010111110100100",
	"0010100100011101100001010010010110110",
	"0011111011110001011001101000111100111",
	"0110110011100011000110011001110010100",
	"0101001010011111111101011111010111100",
	"1100110000101011111111001001000110100",
	"0001111000100000000010001000011101100",
	"1011000000101000100000010011100010000",
	"0010111011111000110001111111000000000",
	"0110110111011000001011011010001100111",
	"0110011001000011110011101001011000100",
	"0101010011110101101000110011010010000",
	"1101011010101110100110110011110000100",
	"1001010000101101110111000010101100101",
	"0011101101100100000111100001011100101",
	"1110100110000100010101010111100111010",
	"0001101001011011111101110111010101100",
	"0000110100001010001001110011101100100",
	"1100011111010101110011100000111110101",
	"0000000011011100100011110100100011000",
	"1111111001100110000100011000101011100",
	"1000001000000001110010101010100010100",
	"1011101011001010101100101000111111111",
	"1011101000101100010110010101001100110",
	"1011101001101101101011011100101100010",
	"1000001010100111101001111001001000110",
	"1111111000111101001101110001001001111",
];

/** The code is drawn at width 300 with margin 16, exactly as the editor sets it. */
const QR_SIZE = 300;
const QR_QUIET = 16;
const QR_COUNT = QR_ROWS.length;
const QR_DOT = (QR_SIZE - QR_QUIET * 2) / QR_COUNT;

/** Top-left, top-right and bottom-left, as [row, column]. */
const FINDERS: [number, number][] = [
	[0, 0],
	[0, QR_COUNT - 7],
	[QR_COUNT - 7, 0],
];

/** The three markers are drawn as frames and eyes, not as plain dots. */
function inFinder(row: number, column: number) {
	return FINDERS.some(
		([r, c]) => row >= r && row < r + 7 && column >= c && column < c + 7,
	);
}

/**
 * Dark modules merged into horizontal runs. The default dot style is `rounded`,
 * which joins neighbours instead of leaving a grid of separate squares.
 */
const QR_RUNS = QR_ROWS.flatMap((row, rowIndex) => {
	const runs: { id: string; width: number; x: number; y: number }[] = [];
	let start = -1;

	for (let column = 0; column <= QR_COUNT; column += 1) {
		const dark = row[column] === "1" && !inFinder(rowIndex, column);
		if (dark && start < 0) start = column;
		if (!dark && start >= 0) {
			runs.push({
				id: `r${rowIndex}c${start}`,
				width: (column - start) * QR_DOT,
				x: QR_QUIET + start * QR_DOT,
				y: QR_QUIET + rowIndex * QR_DOT,
			});
			start = -1;
		}
	}

	return runs;
});

/** The live code: rounded dots, extra-rounded corner frames, round eyes. */
function QrCodeArt({ colors }: { colors: QrColors }) {
	return (
		<svg
			aria-hidden="true"
			className="block h-auto w-full"
			viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`}
		>
			<title>QR code</title>
			<rect fill={colors.background} height={QR_SIZE} width={QR_SIZE} />
			{QR_RUNS.map((run) => (
				<rect
					fill={colors.dots}
					height={QR_DOT}
					key={run.id}
					rx={QR_DOT * 0.36}
					width={run.width}
					x={run.x}
					y={run.y}
				/>
			))}
			{FINDERS.map(([row, column]) => {
				const x = QR_QUIET + column * QR_DOT;
				const y = QR_QUIET + row * QR_DOT;

				return (
					<g key={`finder-${row}-${column}`}>
						<rect
							fill="none"
							height={QR_DOT * 6}
							rx={QR_DOT * 2}
							stroke={colors.cornerFrames}
							strokeWidth={QR_DOT}
							width={QR_DOT * 6}
							x={x + QR_DOT / 2}
							y={y + QR_DOT / 2}
						/>
						<circle
							cx={x + QR_DOT * 3.5}
							cy={y + QR_DOT * 3.5}
							fill={colors.cornerDots}
							r={QR_DOT * 1.5}
						/>
					</g>
				);
			})}
		</svg>
	);
}

/** The 52px mini-code on a preset tile, drawn on the product's 24-unit grid. */
function PresetGlyph({ colors }: { colors: QrColors }) {
	const finders = [
		[2, 2],
		[15, 2],
		[2, 15],
	];
	const dots = [
		[11, 3],
		[11, 6.5],
		[11, 11],
		[14.5, 11],
		[18, 11],
		[18, 14.5],
		[14.5, 18],
		[18, 19],
		[11, 18],
		[4, 11.2],
		[7, 11.2],
	];

	return (
		<svg
			aria-hidden="true"
			className="block h-full w-full rounded-[9px] shadow-[inset_0_0_0_1px_rgb(var(--product-foreground-rgb)/0.08)]"
			viewBox="0 0 24 24"
		>
			<rect fill={colors.background} height="24" width="24" />
			{finders.map(([x, y]) => (
				<g key={`glyph-${x}-${y}`}>
					<path
						d={`M${x} ${y}h7v7h-7zM${x + 1.4} ${y + 1.4}v4.2h4.2v-4.2z`}
						fill={colors.cornerFrames}
						fillRule="evenodd"
					/>
					<rect
						fill={colors.cornerDots}
						height="2.2"
						rx=".4"
						width="2.2"
						x={x + 2.4}
						y={y + 2.4}
					/>
				</g>
			))}
			{dots.map(([x, y]) => (
				<rect
					fill={colors.dots}
					height="2.4"
					key={`dot-${x}-${y}`}
					rx=".6"
					width="2.4"
					x={x}
					y={y}
				/>
			))}
		</svg>
	);
}

/** One open L, 26px on a side, 3px thick, sitting outside the code card. */
const BRACKET =
	"absolute h-[26px] w-[26px] border-[3px] border-product-foreground opacity-80";

/** The QR code editor page: controls on the left, live preview on the right. */
export function QrEditorScreen() {
	return (
		<Screen
			caption="The QR code editor at 1280px: a full page under the app navbar, with the tabbed colour, style, logo and settings controls on the left and a sticky live preview with download and save actions on the right."
			height={950}
			legend={[
				"Full page under the app navbar: back link, title and intro.",
				"The catalogue link the code points at: copyable, never editable.",
				"Colors, Style, Logo and Settings; the amber bar marks the open tab.",
				"Pick a palette, or set each of the four colours by swatch or hex.",
				"Live preview with a scan check that updates as you edit.",
				"Download in three formats, or save the design to the catalogue.",
			]}
			title="https://www.quicktalog.app/admin/brightside-cafe-menu/qr-editor"
			width={1280}
		>
			<PageWash>
				<AppNavbar />

				{/* The main column: 32px gutters, 120px under the fixed navbar. */}
				<div className="absolute inset-x-0 top-0 px-8 pt-[120px]">
					<div className="min-w-0 pt-1 text-product-foreground">
						<header className="relative mb-[22px]">
							<SpotMarker n={1} />
							<span className="inline-flex h-8 items-center gap-[7px] rounded-full border border-product-border bg-product-card/70 pl-2.5 pr-[13px] text-[13px] font-semibold text-product-foreground-accent">
								<ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
								Back to dashboard
							</span>
							<div className="mt-3.5">
								<p className="font-product-heading text-[40px] font-extrabold leading-[1.08] tracking-[-0.035em] text-product-foreground">
									QR code editor
								</p>
								<p className="mt-2 max-w-[560px] text-[15.5px] leading-normal text-product-foreground-accent">
									Create beautiful, customized QR codes for your brand with our
									easy-to-use editor.
								</p>
							</div>
						</header>

						{/*
						 * The preview comes first in the DOM but sits in the second
						 * track on desktop, so the controls are on the left.
						 */}
						<div className="grid grid-cols-[minmax(0,1fr)_minmax(360px,420px)] items-start gap-6">
							<div className="order-2 min-w-0">
								<section className="relative rounded-product-panel border border-product-border bg-product-card p-5 shadow-product-hover">
									<div className="mb-3.5 flex items-center justify-between gap-2.5">
										<p className="font-product-heading text-[17px] font-extrabold leading-tight tracking-[-0.015em] text-product-foreground">
											Preview
										</p>
										<span className="inline-flex h-7 items-center gap-[7px] whitespace-nowrap rounded-full border border-product-success/[0.22] bg-product-success-soft px-[11px] text-[12.5px] font-semibold leading-none text-product-success">
											<i
												aria-hidden="true"
												className="h-2 w-2 rounded-full bg-current shadow-[0_0_0_3px_rgb(var(--product-success-rgb)/0.16)]"
											/>
											Scannable
										</span>
									</div>

									<div className="relative">
										<SpotMarker n={5} />
										{/* Warm cream with an amber bloom, not a white box. */}
										<div className="relative grid place-items-center overflow-hidden rounded-[20px] bg-[radial-gradient(60%_60%_at_50%_42%,#FFF1CF_0,rgba(255,241,207,0)_70%),linear-gradient(160deg,#FBF6EB,#F1ECE0)] px-5 py-[30px]">
											<span
												aria-hidden="true"
												className="absolute inset-0 bg-[radial-gradient(rgb(var(--product-foreground-rgb)/0.07)_1px,transparent_1.2px)] bg-[length:14px_14px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_30%,transparent_90%)]"
											/>
											<div className="relative w-full max-w-[280px] p-3.5">
												<span
													aria-hidden="true"
													className={cn(
														BRACKET,
														"left-0 top-0 rounded-tl-xl border-b-0 border-r-0",
													)}
												/>
												<span
													aria-hidden="true"
													className={cn(
														BRACKET,
														"right-0 top-0 rounded-tr-xl border-b-0 border-l-0",
													)}
												/>
												<span
													aria-hidden="true"
													className={cn(
														BRACKET,
														"bottom-0 left-0 rounded-bl-xl border-r-0 border-t-0",
													)}
												/>
												<span
													aria-hidden="true"
													className={cn(
														BRACKET,
														"bottom-0 right-0 rounded-br-xl border-l-0 border-t-0",
													)}
												/>
												<div
													className="relative flex flex-col items-center overflow-hidden rounded-2xl shadow-[0_22px_40px_-20px_rgb(var(--product-foreground-rgb)/0.45),0_2px_6px_rgb(var(--product-foreground-rgb)/0.06)]"
													style={{ background: DEFAULT_COLORS.background }}
												>
													<QrCodeArt colors={DEFAULT_COLORS} />
												</div>
												{/* The scan line, caught a third of the way down. */}
												<span
													aria-hidden="true"
													className="pointer-events-none absolute left-2 right-2 top-[86px]"
												>
													<span className="block h-[34px] rounded border-b border-product-primary-accent/60 bg-[linear-gradient(180deg,rgb(var(--product-primary-rgb)/0),rgb(var(--product-primary-rgb)/0.2)_80%,rgb(var(--product-primary-rgb)/0.7)_100%)]" />
												</span>
											</div>
										</div>
									</div>

									<div className="relative mt-3.5">
										<SpotMarker n={6} />
										<div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
											<Btn className="h-11 min-w-0 px-4 text-[15px]">
												<Download />
												Download PNG
											</Btn>
											<Btn className="h-11 px-4 text-[15px]" variant="outline">
												SVG
											</Btn>
											<Btn className="h-11 px-4 text-[15px]" variant="outline">
												JPEG
											</Btn>
										</div>
										{/*
										 * Save is a white pill with navy ink, never the amber
										 * primary. Nothing has changed yet, so the amber dirty
										 * dot beside the label is invisible.
										 */}
										<span className="mt-2 flex h-[46px] w-full items-center gap-[9px] rounded-full border-[1.5px] border-product-secondary/20 bg-product-card px-4 text-[15px] font-semibold leading-none text-product-secondary">
											<Save aria-hidden="true" className="h-[17px] w-[17px]" />
											Save design
											<small className="ml-auto text-[12.5px] font-medium leading-none text-product-muted">
												Default design, not saved yet
											</small>
										</span>
									</div>
								</section>
							</div>

							<div className="order-1 flex min-w-0 flex-col gap-3.5">
								<div className="relative">
									<SpotMarker n={2} />
									<div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-product-border bg-product-card py-1.5 pl-3.5 pr-1.5 shadow-product">
										<Globe
											aria-hidden="true"
											className="h-[17px] w-[17px] shrink-0 text-product-muted"
										/>
										<span className="min-w-0 flex-1 truncate font-mono text-[13.5px] font-medium text-product-foreground">
											quicktalog.app/catalogues/brightside-cafe-menu
										</span>
										<span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[11px] border border-product-border-strong bg-product-background px-[13px] text-[13px] font-semibold text-product-foreground">
											<Copy aria-hidden="true" className="h-[15px] w-[15px]" />
											Copy
										</span>
									</div>
									<p className="mx-1 mt-2 flex items-start gap-1.5 text-[12.5px] leading-snug text-product-muted">
										<Info
											aria-hidden="true"
											className="mt-px h-3.5 w-3.5 shrink-0"
										/>
										This QR code links to your catalog. The URL cannot be
										changed.
									</p>
								</div>

								<div className="rounded-product-card border border-product-border bg-product-card p-3 shadow-product">
									<div className="relative grid w-full grid-cols-4 gap-0 rounded-[15px] border border-product-border bg-product-background-hero p-1">
										<SpotMarker n={3} />
										{/*
										 * The white pill is its own sliding element; the trigger
										 * under it stays transparent. Its amber bar marks the
										 * open tab.
										 */}
										<span
											aria-hidden="true"
											className="absolute bottom-1 left-1 top-1 w-[calc((100%-8px)/4)] rounded-[11px] bg-product-card shadow-[0_1px_2px_rgb(var(--product-foreground-rgb)/0.08),0_4px_10px_-2px_rgb(var(--product-foreground-rgb)/0.08)] after:absolute after:bottom-[-1px] after:left-1/2 after:h-[3px] after:w-[26px] after:-translate-x-1/2 after:rounded-t-[3px] after:bg-product-primary"
										/>
										{TABS.map(({ icon: Icon, label }) => (
											<span
												className={cn(
													"relative z-10 flex h-10 min-w-0 items-center justify-center gap-[7px] rounded-[11px] px-1.5 text-[13.5px] font-semibold",
													label === "Colors"
														? "text-product-foreground"
														: "text-product-muted",
												)}
												key={label}
											>
												<Icon
													aria-hidden="true"
													className={cn(
														"h-4 w-4 flex-none",
														label === "Colors" && "text-product-primary-ink",
													)}
												/>
												{label}
											</span>
										))}
									</div>

									<div className="px-3.5 pb-3 pt-[22px]">
										<div className="mb-3">
											<p className="font-product-heading text-base font-extrabold leading-tight tracking-[-0.015em] text-product-foreground">
												Color palette
											</p>
											<p className="mt-0.5 text-[13.5px] leading-snug text-product-muted">
												Customize your QR code colors.
											</p>
										</div>

										<div className="relative">
											<SpotMarker className="-right-2 -top-2 left-auto" n={4} />
											{/*
											 * No preset is pressed on a fresh design: the default
											 * corner dots are ink, which matches none of the five.
											 */}
											<div className="mb-4 grid grid-cols-5 gap-2">
												{COLOR_PRESETS.map((preset) => (
													<span
														className="flex min-w-0 flex-col items-center gap-[7px] rounded-[14px] border-[1.5px] border-product-border bg-product-card px-1 pb-[9px] pt-2 text-center text-xs font-semibold leading-tight text-product-foreground-accent"
														key={preset.name}
													>
														<span className="block aspect-square w-full max-w-[52px]">
															<PresetGlyph colors={preset.colors} />
														</span>
														<span>{preset.name}</span>
													</span>
												))}
											</div>

											<div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-product-border [&>*+*]:border-t [&>*:nth-child(2)]:border-t-0 [&>*:nth-child(odd)]:border-r [&>*]:border-product-border">
												{COLOR_ROWS.map((row) => (
													<div
														className="flex min-w-0 items-center gap-3 bg-product-card px-3 py-2.5"
														key={row.name}
													>
														{/* Background is white on white: only its ring shows. */}
														<span
															className="h-9 w-9 shrink-0 rounded-[11px] shadow-[inset_0_0_0_1px_rgb(var(--product-foreground-rgb)/0.14),0_1px_2px_rgb(var(--product-foreground-rgb)/0.08)]"
															style={{ background: row.value }}
														/>
														<span className="flex min-w-0 flex-1 flex-col gap-0.5">
															<b className="text-sm font-semibold leading-tight text-product-foreground">
																{row.name}
															</b>
															<small className="truncate text-xs text-product-muted">
																{row.hint}
															</small>
														</span>
														<span className="flex h-[34px] w-[86px] shrink-0 items-center rounded-[10px] border border-product-border-strong bg-product-background px-[9px] font-mono text-[13px] uppercase text-product-foreground">
															{row.value}
														</span>
													</div>
												))}
											</div>
										</div>

										<p className="mt-3 inline-flex h-[30px] items-center gap-2 rounded-full border border-product-success/[0.22] bg-product-success-soft px-3 text-[12.5px] font-semibold leading-none text-product-success">
											<i
												aria-hidden="true"
												className="h-2 w-2 rounded-full bg-current"
											/>
											Contrast 18.4:1 &middot; Good
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</PageWash>
		</Screen>
	);
}
