import {
	Download,
	ImageIcon,
	Lock,
	Palette,
	Shapes,
	SlidersHorizontal,
} from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { Btn } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

const presets = [
	["#16140F", "#C77F00"],
	["#2A1F14", "#8B6914"],
	["#010E58", "#C77F00"],
	["#354834", "#5C7453"],
	["#000000", "#000000"],
];

const finder: [number, number][] = [
	[0, 0],
	[14, 0],
	[0, 14],
];

const modules: [number, number][] = [
	[8, 0],
	[10, 0],
	[8, 2],
	[9, 3],
	[11, 1],
	[12, 3],
	[8, 5],
	[10, 5],
	[0, 8],
	[2, 8],
	[4, 9],
	[6, 8],
	[1, 10],
	[3, 11],
	[5, 10],
	[7, 12],
	[8, 8],
	[10, 9],
	[9, 11],
	[11, 8],
	[12, 10],
	[13, 12],
	[8, 13],
	[10, 12],
	[14, 8],
	[16, 9],
	[18, 8],
	[20, 10],
	[15, 11],
	[17, 12],
	[19, 11],
	[8, 15],
	[10, 16],
	[12, 15],
	[9, 17],
	[11, 18],
	[13, 17],
	[8, 19],
	[10, 20],
	[14, 14],
	[16, 15],
	[18, 14],
	[15, 17],
	[17, 18],
	[19, 16],
	[20, 19],
	[14, 20],
	[4, 4],
	[2, 3],
];

const swatches: [string, string, string][] = [
	["QR Dots", "The data pattern", "#16140F"],
	["Background", "Behind the code", "#FFFFFF"],
	["Corner Frames", "Outer ring of the 3 markers", "#16140F"],
	["Corner Dots", "Centre of the 3 markers", "#C77F00"],
];

/** The QR editor: the preview on the left, four tabs of controls on the right. */
export function QrEditorScreen() {
	return (
		<Screen
			caption="The QR editor. It is on every plan, and the code always points at your catalogue."
			height={480}
			legend={[
				"The live preview of your code",
				"Your address, which cannot be changed",
				"The four tabs of controls",
				"Five ready colour combinations",
				"Whether the code has enough contrast to scan",
				"Download it as a PNG, SVG or JPEG",
			]}
			title="quicktalog.app/admin/brightside-cafe-menu/qr-editor"
			width={1000}
		>
			<div className="absolute inset-0 grid grid-cols-[380px_minmax(0,1fr)] gap-5 bg-product-background p-6">
				<div className="rounded-[18px] border border-product-border bg-product-card p-4">
					<div className="relative grid place-items-center rounded-[14px] bg-product-background-hero p-5">
						<SpotMarker n={1} />
						<span className="grid h-[180px] w-[180px] place-items-center rounded-[10px] bg-white">
							<svg
								aria-hidden="true"
								height="150"
								viewBox="0 0 21 21"
								width="150"
							>
								<title>QR code</title>
								{finder.map(([fx, fy]) => (
									<g key={`${fx}-${fy}`}>
										<rect
											fill="#16140F"
											height="7"
											rx="1.4"
											width="7"
											x={fx}
											y={fy}
										/>
										<rect
											fill="#FFFFFF"
											height="5"
											rx="1"
											width="5"
											x={fx + 1}
											y={fy + 1}
										/>
										<rect
											fill="#C77F00"
											height="3"
											rx="0.7"
											width="3"
											x={fx + 2}
											y={fy + 2}
										/>
									</g>
								))}
								{modules.map(([mx, my]) => (
									<rect
										fill="#16140F"
										height="1"
										key={`${mx}-${my}`}
										rx="0.25"
										width="1"
										x={mx}
										y={my}
									/>
								))}
							</svg>
						</span>
					</div>

					<div className="relative mt-3 flex items-start gap-2 rounded-[12px] border border-product-border bg-product-background-hero px-3 py-2.5">
						<SpotMarker n={2} />
						<Lock className="mt-[2px] h-3.5 w-3.5 flex-none text-product-muted" />
						<span className="text-[11px] leading-[1.45] text-product-foreground-accent">
							This QR code links to your catalog. The URL cannot be changed.
						</span>
					</div>

					<div className="relative mt-3 flex gap-2">
						<SpotMarker n={6} />
						<Btn className="flex-1">
							<Download />
							Download PNG
						</Btn>
						<Btn variant="outline">SVG</Btn>
						<Btn variant="outline">JPEG</Btn>
					</div>
				</div>

				<div className="rounded-[18px] border border-product-border bg-product-card p-4">
					<div className="relative grid grid-cols-4 gap-1.5">
						<SpotMarker n={3} />
						{[
							{ icon: Palette, label: "Colors" },
							{ icon: Shapes, label: "Style" },
							{ icon: ImageIcon, label: "Logo" },
							{ icon: SlidersHorizontal, label: "Settings" },
						].map(({ icon: Icon, label }) => (
							<span
								className={cn(
									"grid place-items-center gap-1 rounded-[10px] border py-2 text-[11px] font-semibold",
									label === "Colors"
										? "border-product-primary bg-product-primary-soft text-product-foreground"
										: "border-transparent text-product-foreground-accent",
								)}
								key={label}
							>
								<Icon className="h-4 w-4" />
								{label}
							</span>
						))}
					</div>

					<p className="mt-4 text-[14px] font-bold text-product-foreground">
						Color palette
					</p>
					<p className="text-[11.5px] text-product-muted">
						Customize your QR code colors.
					</p>

					<div className="mt-3">
						<p className="mb-1.5 text-[11.5px] font-semibold text-product-foreground">
							Color presets
						</p>
						<div className="relative grid grid-cols-5 gap-1.5">
							<SpotMarker n={4} />
							{presets.map(([dark, accent], index) => (
								<span
									className={cn(
										"flex h-9 items-center justify-center gap-1 rounded-[9px] border",
										index === 0
											? "border-product-primary ring-2 ring-product-primary/35"
											: "border-product-border",
									)}
									key={dark + accent}
								>
									<span
										className="h-3.5 w-3.5 rounded-full"
										style={{ background: dark }}
									/>
									<span
										className="h-3.5 w-3.5 rounded-full"
										style={{ background: accent }}
									/>
								</span>
							))}
						</div>
					</div>

					<div className="mt-3 grid grid-cols-2 gap-2">
						{swatches.map(([name, hint, colour]) => (
							<div
								className="flex items-center gap-2 rounded-[10px] border border-product-border p-2"
								key={name}
							>
								<span
									className="h-8 w-8 flex-none rounded-[7px] border border-product-border"
									style={{ background: colour }}
								/>
								<span className="min-w-0 flex-1">
									<span className="block text-[11.5px] font-semibold text-product-foreground">
										{name}
									</span>
									<span className="block text-[10px] text-product-muted">
										{hint}
									</span>
								</span>
								<span className="rounded-[6px] border border-product-border px-1.5 py-1 text-[10px] font-mono text-product-foreground-accent">
									{colour}
								</span>
							</div>
						))}
					</div>

					<div className="relative mt-3">
						<SpotMarker n={5} />
						<span className="inline-flex h-[30px] items-center rounded-full bg-product-success-soft px-3 text-[11.5px] font-semibold text-product-success">
							Contrast 15.4:1 &middot; Good
						</span>
					</div>
				</div>
			</div>
		</Screen>
	);
}
