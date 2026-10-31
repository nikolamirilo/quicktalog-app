import {
	Code,
	Copy,
	Download,
	ExternalLink,
	LayoutDashboard,
	PartyPopper,
	Pencil,
	X,
} from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { Btn } from "@/components/manual/screens/kit";

/**
 * A just-published catalogue has no saved QR design, so the dialog always
 * draws the default one: near-black rounded modules, heavily rounded corner
 * frames and round corner dots on white, with the quiet zone the 16px margin
 * leaves. A 52-character link lands on a 37 by 37 module grid.
 */
const GRID = 37;

/** The three corner frames, by their top-left module. */
const EYES: [number, number][] = [
	[0, 0],
	[GRID - 7, 0],
	[0, GRID - 7],
];

function isEyeZone(x: number, y: number) {
	const left = x < 8;
	const right = x >= GRID - 8;
	const top = y < 8;
	const bottom = y >= GRID - 8;
	return (left && top) || (right && top) || (left && bottom);
}

/** The single alignment square a code this size carries. */
function isAlignmentZone(x: number, y: number) {
	return x >= 28 && x <= 32 && y >= 28 && y <= 32;
}

function isTimingLine(x: number, y: number) {
	const across = y === 6 && x > 7 && x < GRID - 8;
	const down = x === 6 && y > 7 && y < GRID - 8;
	return across || down;
}

/** Fixed speckle, so the drawn code is the same on every render. */
function speckle(x: number, y: number) {
	const noise = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
	return noise - Math.floor(noise);
}

function buildModules() {
	const modules: [number, number][] = [];
	for (let y = 0; y < GRID; y += 1) {
		for (let x = 0; x < GRID; x += 1) {
			if (isEyeZone(x, y) || isAlignmentZone(x, y)) continue;
			if (isTimingLine(x, y)) {
				if ((x + y) % 2 === 0) modules.push([x, y]);
				continue;
			}
			if (speckle(x, y) > 0.5) modules.push([x, y]);
		}
	}
	return modules;
}

const MODULES = buildModules();

/** The code itself, square and flush to all four edges of its white card. */
function QrArt() {
	return (
		<svg
			aria-hidden="true"
			className="block h-auto w-full"
			viewBox="-2.2 -2.2 41.4 41.4"
		>
			<title>QR code</title>
			<rect fill="#FFFFFF" height="41.4" width="41.4" x="-2.2" y="-2.2" />
			{MODULES.map(([x, y]) => (
				<rect
					fill="#16140F"
					height="1"
					key={`m-${x}-${y}`}
					rx="0.3"
					width="1"
					x={x}
					y={y}
				/>
			))}
			<rect fill="#16140F" height="5" rx="1.2" width="5" x="28" y="28" />
			<rect fill="#FFFFFF" height="3" rx="0.7" width="3" x="29" y="29" />
			<rect fill="#16140F" height="1" rx="0.3" width="1" x="30" y="30" />
			{EYES.map(([x, y]) => (
				<g key={`eye-${x}-${y}`}>
					<rect fill="#16140F" height="7" rx="2.2" width="7" x={x} y={y} />
					<rect
						fill="#FFFFFF"
						height="5"
						rx="1.5"
						width="5"
						x={x + 1}
						y={y + 1}
					/>
					<circle cx={x + 3.5} cy={y + 3.5} fill="#16140F" r="1.5" />
				</g>
			))}
		</svg>
	);
}

/**
 * The Congratulations dialog, shown the first time a catalogue is published.
 * 720px wide, two columns: the QR panel is last in the code but sits first on
 * screen, so it is drawn on the left.
 */
export function PublishSuccessScreen() {
	return (
		<Screen
			caption="The Congratulations dialog, which opens the first time you publish. The QR code panel is on the left, and the link, the embed file and the buttons are on the right."
			height={500}
			legend={[
				"The QR code for your new catalogue, drawn in the default ink-on-white design.",
				"Save the code as a PNG, or open the QR editor to restyle it.",
				"Confirmation that the catalogue is published and publicly live.",
				"The public web address, ready to copy and share.",
				"Download a ready-made HTML file to embed the catalogue in your own site.",
				"Go back to the dashboard, or open the live catalogue in a new tab.",
			]}
			width={760}
		>
			<div className="absolute inset-0 bg-product-background">
				<div className="absolute left-5 top-[35px] w-[720px] rounded-product-panel border border-product-border bg-product-card p-7 text-product-foreground shadow-product-hover">
					<span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-product-foreground-accent">
						<X className="h-4 w-4" />
					</span>

					<div className="flex gap-6">
						<div className="flex w-[262px] flex-none flex-col items-stretch gap-3.5 rounded-product-card border border-product-primary/35 bg-product-primary-soft p-5">
							<div className="relative">
								<SpotMarker n={1} />
								<span className="block overflow-hidden rounded-2xl border border-product-border bg-product-card shadow-product">
									<QrArt />
								</span>
							</div>
							<div className="relative flex flex-col gap-2.5">
								<SpotMarker n={2} />
								<Btn className="h-11 px-5 text-[15px]" variant="outline">
									<Download />
									Download PNG
								</Btn>
								<Btn className="h-11 px-5 text-[15px]" variant="outline">
									<Pencil />
									Customize
								</Btn>
							</div>
						</div>

						<div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
							<div className="relative flex items-start gap-3 pr-8 text-left">
								<SpotMarker n={3} />
								<span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] bg-product-success-soft text-product-success">
									<PartyPopper className="h-[22px] w-[22px]" />
								</span>
								<div className="min-w-0">
									<p className="font-product-heading text-[23px] font-bold leading-tight tracking-[-0.02em] text-product-foreground">
										Congratulations!
									</p>
									<p className="mt-1 text-[14.5px] leading-relaxed text-product-foreground-accent">
										Your Catalogue is now live and ready to share with your
										customers.
									</p>
								</div>
							</div>

							<div className="flex flex-col gap-1">
								<p className="text-[13.5px] font-semibold leading-none text-product-foreground">
									Direct link
								</p>
								<div className="relative flex gap-2">
									<SpotMarker n={4} />
									<span className="flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-[14px] border-[1.5px] border-product-border-strong bg-product-card px-4 text-sm text-product-foreground">
										<span className="whitespace-nowrap">
											https://www.quicktalog.app/catalogues/brightside-cafe-menu
										</span>
									</span>
									<Btn className="h-11 flex-none px-4 text-[15px]">
										<Copy />
										Copy
									</Btn>
								</div>
							</div>

							<div className="relative flex items-center gap-3 rounded-product-card border border-product-border bg-product-background p-3.5">
								<SpotMarker n={5} />
								<span className="grid h-9 w-9 flex-none place-items-center rounded-[11px] border border-product-primary/35 bg-product-primary-soft text-product-primary-ink">
									<Code className="h-[17px] w-[17px]" />
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold leading-tight text-product-foreground">
										Embed on your website
									</p>
									<p className="text-xs leading-relaxed text-product-foreground-accent">
										A ready-made HTML file, full-screen.
									</p>
								</div>
								<Btn
									className="h-11 flex-none px-3.5 text-sm"
									variant="outline"
								>
									<Download />
									HTML file
								</Btn>
							</div>

							<div className="border-t border-product-border pt-3.5">
								<div className="relative ml-auto flex w-fit justify-end gap-2">
									<SpotMarker n={6} />
									<Btn className="h-11 px-[22px] text-[15px]" variant="outline">
										<LayoutDashboard />
										Dashboard
									</Btn>
									<Btn className="h-11 px-[22px] text-[15px]">
										<ExternalLink />
										View Catalogue
									</Btn>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Screen>
	);
}
