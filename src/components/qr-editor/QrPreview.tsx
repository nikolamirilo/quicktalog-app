"use client";

import { Download, Save } from "lucide-react";
import QRCodeStyling from "qr-code-styling";
import { useEffect, useRef } from "react";
import { FrameTextBar } from "@/components/qr-editor/FrameTextBar";
import { Button } from "@/components/ui/button";
import { useQr } from "@/context/QRContext";
import { useQrActions } from "@/hooks/useQrActions";
import { colorsOf, toStylingOptions, visibleFrameText } from "@/lib/qr/design";
import type { ScanRisk } from "@/lib/qr/scan-risk";
import { moduleCount, qrVersion } from "@/lib/qr/version";
import { cn } from "@/lib/ui/cn";

/** The scan line moves by transform only: its wrapper spans the travel. */
const SCAN_KEYFRAMES =
	"@keyframes qr-editor-scan{0%{transform:translateY(0);opacity:0}12%{opacity:1}80%{opacity:1}100%{transform:translateY(100%);opacity:0}}";

const BRACKET =
	"absolute h-[22px] w-[22px] border-[3px] border-product-foreground opacity-80 lg:h-[26px] lg:w-[26px]";

export function QrPreview({
	name,
	risk,
	hasSavedDesign,
}: {
	name: string;
	risk: ScanRisk;
	hasSavedDesign: boolean;
}) {
	const { options, setQrCodeInstance, isDirty } = useQr();
	const { save, download, isSaving, downloading, everSaved } = useQrActions(
		name,
		hasSavedDesign,
	);
	const ref = useRef<HTMLDivElement>(null);
	const qrCode = useRef<QRCodeStyling | null>(null);

	const colors = colorsOf(options);
	const frameText = visibleFrameText(options);
	const level = options.qrOptions?.errorCorrectionLevel ?? "Q";
	const version = qrVersion(options.data ?? "", level, {
		typeNumber: options.qrOptions?.typeNumber,
		mode: options.qrOptions?.mode,
	});

	useEffect(() => {
		const instance = new QRCodeStyling(toStylingOptions(options));
		qrCode.current = instance;
		setQrCodeInstance(instance);
		if (ref.current) {
			ref.current.innerHTML = "";
			instance.append(ref.current);
		}
		return () => setQrCodeInstance(null);
		// Created once; later changes go through update() below.
	}, [setQrCodeInstance]);

	useEffect(() => {
		qrCode.current?.update(toStylingOptions(options));
	}, [options]);

	const saveState = isDirty
		? "Unsaved changes"
		: everSaved
			? "All changes saved"
			: "Default design, not saved yet";

	return (
		<section
			aria-labelledby="qr-preview-title"
			className="relative rounded-product-panel border border-product-border bg-product-card p-4 shadow-product-hover sm:p-5"
		>
			<style href="qr-editor-scan" precedence="default">
				{SCAN_KEYFRAMES}
			</style>
			<div className="mb-3.5 flex items-center justify-between gap-2.5">
				<h2
					className="text-[17px] font-extrabold leading-tight tracking-[-0.015em]"
					id="qr-preview-title"
				>
					Preview
				</h2>
				<span
					className={cn(
						"inline-flex h-7 items-center gap-[7px] whitespace-nowrap rounded-full border px-[11px] text-[12.5px] font-semibold leading-none",
						risk.scannable
							? "border-product-success/[0.22] bg-product-success-soft text-product-success"
							: "border-product-primary/50 bg-product-primary-soft text-product-primary-ink",
					)}
					role="status"
				>
					<i
						aria-hidden="true"
						className={cn(
							"h-2 w-2 rounded-full bg-current",
							risk.scannable
								? "shadow-[0_0_0_3px_rgb(var(--product-success-rgb)/0.16)]"
								: "shadow-[0_0_0_3px_rgb(var(--product-primary-rgb)/0.25)]",
						)}
					/>
					{risk.scannable ? "Scannable" : "May be hard to scan"}
				</span>
			</div>

			<div className="relative grid place-items-center overflow-hidden rounded-[20px] bg-[radial-gradient(60%_60%_at_50%_42%,#FFF1CF_0,rgba(255,241,207,0)_70%),linear-gradient(160deg,#FBF6EB,#F1ECE0)] px-3.5 py-5 lg:px-5 lg:py-[30px]">
				<div
					aria-hidden="true"
					className="absolute inset-0 bg-[radial-gradient(rgb(var(--product-foreground-rgb)/0.07)_1px,transparent_1.2px)] bg-[length:14px_14px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_30%,transparent_90%)]"
				/>
				<div className="relative w-full max-w-[216px] p-3 md:max-w-[236px] lg:max-w-[280px] lg:p-3.5">
					<span
						aria-hidden="true"
						className={`${BRACKET} left-0 top-0 rounded-tl-xl border-b-0 border-r-0`}
					/>
					<span
						aria-hidden="true"
						className={`${BRACKET} right-0 top-0 rounded-tr-xl border-b-0 border-l-0`}
					/>
					<span
						aria-hidden="true"
						className={`${BRACKET} bottom-0 left-0 rounded-bl-xl border-r-0 border-t-0`}
					/>
					<span
						aria-hidden="true"
						className={`${BRACKET} bottom-0 right-0 rounded-br-xl border-l-0 border-t-0`}
					/>
					<div
						className="relative flex flex-col items-center overflow-hidden rounded-2xl shadow-[0_22px_40px_-20px_rgb(var(--product-foreground-rgb)/0.45),0_2px_6px_rgb(var(--product-foreground-rgb)/0.06)]"
						style={{ background: colors.background }}
					>
						<div
							aria-label={`QR code for ${options.data}`}
							className="w-full leading-[0] [&_canvas]:h-auto [&_canvas]:w-full [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
							ref={ref}
							role="img"
						/>
						{frameText && (
							<FrameTextBar
								barColor={colors.dots}
								text={frameText}
								textColor={colors.background}
								width={options.width ?? 300}
							/>
						)}
					</div>
					<span
						aria-hidden="true"
						className="pointer-events-none absolute bottom-12 left-2 right-2 top-3.5 hidden motion-safe:block motion-safe:animate-[qr-editor-scan_3.4s_cubic-bezier(.45,0,.55,1)_infinite]"
					>
						<span className="block h-[34px] rounded border-b border-product-primary-accent/60 bg-[linear-gradient(180deg,rgb(var(--product-primary-rgb)/0),rgb(var(--product-primary-rgb)/0.2)_80%,rgb(var(--product-primary-rgb)/0.7)_100%)]" />
					</span>
				</div>
			</div>

			<p className="mb-3.5 mt-3 text-center text-[12.5px] font-medium leading-normal text-product-muted tabular-nums">
				{version
					? `Version ${version} · ${moduleCount(version)}×${moduleCount(version)} modules · error correction ${level}`
					: `Error correction ${level}`}
				{risk.tip && (
					<>
						<br />
						<b className="font-semibold text-product-primary-ink">{risk.tip}</b>
					</>
				)}
			</p>

			<div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
				<Button
					className="min-w-0 px-4"
					disabled={downloading !== null}
					onClick={() => download("png")}
				>
					<Download aria-hidden="true" />
					Download PNG
				</Button>
				<Button
					aria-label="Download SVG"
					className="px-4"
					disabled={downloading !== null}
					onClick={() => download("svg")}
					variant="outline"
				>
					SVG
				</Button>
				<Button
					aria-label="Download JPEG"
					className="px-4"
					disabled={downloading !== null}
					onClick={() => download("jpeg")}
					variant="outline"
				>
					JPEG
				</Button>
			</div>

			<button
				aria-busy={isSaving}
				className="relative mt-2 flex h-[46px] w-full items-center gap-[9px] rounded-full border-[1.5px] border-product-secondary/20 bg-product-card px-4 text-[15px] font-semibold leading-none text-product-secondary transition-colors hover:border-product-secondary/35 hover:bg-product-secondary-soft disabled:cursor-not-allowed disabled:opacity-60"
				disabled={isSaving}
				onClick={save}
				type="button"
			>
				<Save aria-hidden="true" className="h-[17px] w-[17px]" />
				<span>{isSaving ? "Saving…" : "Save design"}</span>
				<i
					aria-hidden="true"
					className={cn(
						"h-2 w-2 rounded-full bg-product-primary-accent shadow-[0_0_0_3px_rgb(var(--product-primary-rgb)/0.25)] transition-[opacity,transform] duration-200",
						isDirty ? "scale-100 opacity-100" : "scale-[0.3] opacity-0",
					)}
				/>
				<small
					aria-live="polite"
					className={cn(
						"ml-auto text-[12.5px] font-medium leading-none text-product-muted",
						isDirty && "text-product-primary-ink",
					)}
				>
					{saveState}
				</small>
			</button>
		</section>
	);
}
