//@ts-nocheck
"use client";
import QRCodeStyling from "qr-code-styling";
import React, { useEffect, useRef, useState } from "react";

export default function QRCodeEditor() {
	const qrRef = useRef(null);
	const qrInstanceRef = useRef(null);

	// Core data
	const [value, setValue] = useState("https://example.com");
	const [size, setSize] = useState(420);
	const [margin, setMargin] = useState(10);
	const [errorCorrectionLevel, setErrorCorrectionLevel] = useState("Q");

	// Shape and styling
	const [dotStyle, setDotStyle] = useState("rounded"); // rounded, square, extra-rounded, dots
	const [cornerStyle, setCornerStyle] = useState("square"); // square, rounded, extra-rounded

	// Color & gradient
	const [useGradient, setUseGradient] = useState(false);
	const [fgColor, setFgColor] = useState("#0f172a");
	const [bgColor, setBgColor] = useState("#ffffff");
	const [gradFrom, setGradFrom] = useState("#111827");
	const [gradTo, setGradTo] = useState("#06b6d4");
	const [gradDirection, setGradDirection] = useState("0deg");

	// Logo
	const [logoImage, setLogoImage] = useState(null);
	const [logoSize, setLogoSize] = useState(18); // percentage
	const [logoOpacity, setLogoOpacity] = useState(1);
	const [logoMargin, setLogoMargin] = useState(8);
	const [logoHideBackground, setLogoHideBackground] = useState(true);

	// Frame & caption
	const [frameEnabled, setFrameEnabled] = useState(true);
	const [frameStyle, setFrameStyle] = useState("rounded"); // rounded, pill, thin
	const [framePadding, setFramePadding] = useState(14);
	const [caption, setCaption] = useState("Scan me");
	const [captionPosition, setCaptionPosition] = useState("bottom"); // bottom, top
	const [captionFontSize, setCaptionFontSize] = useState(16);

	// Background
	const [bgImage, setBgImage] = useState(null);
	const [bgImageOpacity, setBgImageOpacity] = useState(0.06);

	// Performance / export
	const [format, setFormat] = useState("png"); // png, svg, webp

	// Helpers
	function buildOptions() {
		const codeOptions = {
			width: size,
			height: size,
			data: value,
			margin: margin,
			image: logoImage || undefined,
			dotsOptions: {
				type:
					dotStyle === "dots"
						? "dots"
						: dotStyle === "rounded"
							? "rounded"
							: dotStyle === "extra-rounded"
								? "extra-rounded"
								: "square",
				color: useGradient ? undefined : fgColor,
			},
			cornersSquareOptions: {
				type:
					cornerStyle === "rounded"
						? "rounded"
						: cornerStyle === "extra-rounded"
							? "extra-rounded"
							: "square",
			},
			backgroundOptions: {
				color: bgImage ? undefined : bgColor,
			},
			imageOptions: {
				crossOrigin: "anonymous",
				margin: logoMargin,
				imageSize: logoSize / 100,
				hideBackgroundDots: logoHideBackground,
				opacity: logoOpacity,
			},
			qrOptions: {
				errorCorrectionLevel,
			},
		};

		if (useGradient) {
			codeOptions.dotsOptions = {
				...codeOptions.dotsOptions,
				gradient: {
					type: "linear",
					rotation: parseFloat(gradDirection) || 0,
					colorStops: [
						{ offset: 0, color: gradFrom },
						{ offset: 1, color: gradTo },
					],
				},
			};
		}

		if (bgImage) {
			codeOptions.backgroundOptions = {
				...codeOptions.backgroundOptions,
				color: bgColor,
				image: bgImage,
				opacity: bgImageOpacity,
			};
		}

		return codeOptions;
	}

	// Init QR instance
	useEffect(() => {
		if (!qrInstanceRef.current) {
			qrInstanceRef.current = new QRCodeStyling({
				...buildOptions(),
			});
			// append to container
			if (qrRef.current) {
				qrInstanceRef.current.append(qrRef.current);
			}
		}

		// Cleanup on unmount
		return () => {
			// QRCodeStyling doesn't provide destroy; remove DOM children to be safe
			if (qrRef.current) qrRef.current.innerHTML = "";
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Update whenever options change
	useEffect(() => {
		if (!qrInstanceRef.current) return;
		const opts = buildOptions();
		qrInstanceRef.current.update(opts);
	}, [
		value,
		size,
		margin,
		dotStyle,
		cornerStyle,
		fgColor,
		bgColor,
		useGradient,
		gradFrom,
		gradTo,
		gradDirection,
		logoImage,
		logoSize,
		logoOpacity,
		logoMargin,
		logoHideBackground,
		bgImage,
		bgImageOpacity,
		errorCorrectionLevel,
	]);

	// Handle logo file upload
	function handleLogoUpload(e) {
		const file = e.target.files && e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			setLogoImage(reader.result);
		};
		reader.readAsDataURL(file);
	}

	function handleBgUpload(e) {
		const file = e.target.files && e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			setBgImage(reader.result);
		};
		reader.readAsDataURL(file);
	}

	async function download() {
		if (!qrInstanceRef.current) return;
		const name = `qr-${Date.now()}`;
		// supported types: png, svg
		await qrInstanceRef.current.download({ name, extension: format });
	}

	function clearLogo() {
		setLogoImage(null);
	}

	function clearBg() {
		setBgImage(null);
	}

	// Small UI building blocks are inlined for single file demo
	return (
		<div className="p-6 md:p-10 max-w-6xl mx-auto">
			<div className="flex flex-col md:flex-row gap-6">
				{/* Left: Controls */}
				<div className="w-full md:w-1/2 bg-white/80 dark:bg-slate-900/60 rounded-2xl p-6 shadow-sm">
					<h2 className="text-2xl font-semibold mb-2">QR Code Editor</h2>
					<p className="text-sm text-slate-500 mb-4">
						Fully featured editor — live preview on the right. Built with React
						& Tailwind.
					</p>

					<div className="space-y-4">
						<label className="block">
							<div className="text-sm font-medium mb-1">Data (URL or text)</div>
							<input
								className="w-full rounded-lg border p-2"
								onChange={(e) => setValue(e.target.value)}
								value={value}
							/>
						</label>

						<div className="grid grid-cols-2 gap-3">
							<label>
								<div className="text-xs text-slate-600">Size</div>
								<input
									max={1200}
									min={120}
									onChange={(e) => setSize(parseInt(e.target.value))}
									type="range"
									value={size}
								/>
								<div className="text-sm">{size}px</div>
							</label>

							<label>
								<div className="text-xs text-slate-600">Margin</div>
								<input
									max={60}
									min={0}
									onChange={(e) => setMargin(parseInt(e.target.value))}
									type="range"
									value={margin}
								/>
								<div className="text-sm">{margin}px</div>
							</label>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<label>
								<div className="text-xs text-slate-600">Error Correction</div>
								<select
									className="w-full rounded-md p-2"
									onChange={(e) => setErrorCorrectionLevel(e.target.value)}
									value={errorCorrectionLevel}
								>
									<option value="L">L (7%)</option>
									<option value="M">M (15%)</option>
									<option value="Q">Q (25%)</option>
									<option value="H">H (30%)</option>
								</select>
							</label>

							<label>
								<div className="text-xs text-slate-600">Format</div>
								<select
									className="w-full rounded-md p-2"
									onChange={(e) => setFormat(e.target.value)}
									value={format}
								>
									<option value="png">PNG</option>
									<option value="svg">SVG</option>
									<option value="webp">WEBP</option>
								</select>
							</label>
						</div>

						<section className="pt-3 border-t">
							<h3 className="text-sm font-medium mb-2">Dot & Corner Styles</h3>
							<div className="grid grid-cols-3 gap-2">
								{[
									{ id: "square", label: "Square" },
									{ id: "rounded", label: "Rounded" },
									{ id: "extra-rounded", label: "Extra" },
									{ id: "dots", label: "Dots" },
								].map((s) => (
									<button
										className={`p-2 rounded-lg border ${dotStyle === s.id ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"}`}
										key={s.id}
										onClick={() => setDotStyle(s.id)}
									>
										<div className="text-xs">{s.label}</div>
									</button>
								))}
							</div>

							<div className="mt-3">
								<div className="text-xs text-slate-600 mb-2">Corner style</div>
								<div className="flex gap-2">
									{[
										{ id: "square", label: "Square" },
										{ id: "rounded", label: "Rounded" },
										{ id: "extra-rounded", label: "Extra" },
									].map((c) => (
										<button
											className={`px-3 py-2 rounded-md border ${cornerStyle === c.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200"}`}
											key={c.id}
											onClick={() => setCornerStyle(c.id)}
										>
											{c.label}
										</button>
									))}
								</div>
							</div>
						</section>

						<section className="pt-3 border-t">
							<h3 className="text-sm font-medium mb-2">Color & Gradient</h3>
							<div className="flex items-center gap-3">
								<label className="flex items-center gap-2">
									<input
										checked={useGradient}
										onChange={(e) => setUseGradient(e.target.checked)}
										type="checkbox"
									/>
									<span className="text-sm">Use gradient</span>
								</label>
							</div>

							<div className="grid grid-cols-2 gap-2 mt-2">
								<label>
									<div className="text-xs">Foreground</div>
									<input
										className="w-full h-10"
										onChange={(e) => setFgColor(e.target.value)}
										type="color"
										value={fgColor}
									/>
								</label>

								<label>
									<div className="text-xs">Background</div>
									<input
										className="w-full h-10"
										onChange={(e) => setBgColor(e.target.value)}
										type="color"
										value={bgColor}
									/>
								</label>
							</div>

							{useGradient && (
								<div className="mt-2 grid grid-cols-2 gap-2">
									<label>
										<div className="text-xs">Gradient From</div>
										<input
											className="w-full h-10"
											onChange={(e) => setGradFrom(e.target.value)}
											type="color"
											value={gradFrom}
										/>
									</label>
									<label>
										<div className="text-xs">Gradient To</div>
										<input
											className="w-full h-10"
											onChange={(e) => setGradTo(e.target.value)}
											type="color"
											value={gradTo}
										/>
									</label>
									<label className="col-span-2 mt-2">
										<div className="text-xs">Rotation (degrees)</div>
										<input
											className="w-full rounded-md p-2"
											max={360}
											min={0}
											onChange={(e) => setGradDirection(e.target.value)}
											type="number"
											value={gradDirection}
										/>
									</label>
								</div>
							)}
						</section>

						<section className="pt-3 border-t">
							<h3 className="text-sm font-medium mb-2">Logo / Center Image</h3>
							<div className="flex gap-2 items-center">
								<input
									accept="image/*"
									onChange={handleLogoUpload}
									type="file"
								/>
								<button className="text-sm underline" onClick={clearLogo}>
									Remove
								</button>
							</div>

							<div className="grid grid-cols-2 gap-2 mt-2">
								<label>
									<div className="text-xs">Logo size %</div>
									<input
										max={40}
										min={6}
										onChange={(e) => setLogoSize(parseInt(e.target.value))}
										type="range"
										value={logoSize}
									/>
									<div className="text-sm">{logoSize}%</div>
								</label>

								<label>
									<div className="text-xs">Logo opacity</div>
									<input
										max={1}
										min={0}
										onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
										step={0.01}
										type="range"
										value={logoOpacity}
									/>
									<div className="text-sm">
										{Math.round(logoOpacity * 100)}%
									</div>
								</label>
							</div>

							<label className="flex items-center gap-2 mt-2">
								<input
									checked={logoHideBackground}
									onChange={(e) => setLogoHideBackground(e.target.checked)}
									type="checkbox"
								/>
								<span className="text-sm">
									Hide background dots behind logo
								</span>
							</label>
						</section>

						<section className="pt-3 border-t">
							<h3 className="text-sm font-medium mb-2">Background Image</h3>
							<div className="flex gap-2 items-center">
								<input accept="image/*" onChange={handleBgUpload} type="file" />
								<button className="text-sm underline" onClick={clearBg}>
									Remove
								</button>
							</div>
							<label className="mt-2">
								<div className="text-xs">Background image opacity</div>
								<input
									max={1}
									min={0}
									onChange={(e) =>
										setBgImageOpacity(parseFloat(e.target.value))
									}
									step={0.01}
									type="range"
									value={bgImageOpacity}
								/>
								<div className="text-sm">
									{Math.round(bgImageOpacity * 100)}%
								</div>
							</label>
						</section>

						<section className="pt-3 border-t">
							<h3 className="text-sm font-medium mb-2">Frame & Caption</h3>
							<label className="flex items-center gap-2">
								<input
									checked={frameEnabled}
									onChange={(e) => setFrameEnabled(e.target.checked)}
									type="checkbox"
								/>
								<span className="text-sm">Show frame (visual wrapper)</span>
							</label>

							{frameEnabled && (
								<div className="mt-2 grid grid-cols-2 gap-2">
									<label>
										<div className="text-xs">Frame style</div>
										<select
											className="w-full rounded-md p-2"
											onChange={(e) => setFrameStyle(e.target.value)}
											value={frameStyle}
										>
											<option value="rounded">Rounded</option>
											<option value="pill">Pill</option>
											<option value="thin">Thin</option>
										</select>
									</label>

									<label>
										<div className="text-xs">Frame padding</div>
										<input
											max={40}
											min={6}
											onChange={(e) =>
												setFramePadding(parseInt(e.target.value))
											}
											type="range"
											value={framePadding}
										/>
										<div className="text-sm">{framePadding}px</div>
									</label>

									<label className="col-span-2">
										<div className="text-xs">Caption text</div>
										<input
											className="w-full rounded-md p-2"
											onChange={(e) => setCaption(e.target.value)}
											value={caption}
										/>
									</label>

									<label>
										<div className="text-xs">Caption font size</div>
										<input
											max={28}
											min={10}
											onChange={(e) =>
												setCaptionFontSize(parseInt(e.target.value))
											}
											type="range"
											value={captionFontSize}
										/>
										<div className="text-sm">{captionFontSize}px</div>
									</label>

									<label>
										<div className="text-xs">Caption position</div>
										<select
											className="w-full rounded-md p-2"
											onChange={(e) => setCaptionPosition(e.target.value)}
											value={captionPosition}
										>
											<option value="bottom">Bottom</option>
											<option value="top">Top</option>
										</select>
									</label>
								</div>
							)}
						</section>

						<div className="flex gap-2 pt-4">
							<button
								className="px-4 py-2 bg-indigo-600 text-white rounded-md"
								onClick={download}
							>
								Download
							</button>
							<button
								className="px-4 py-2 border rounded-md"
								onClick={() => navigator.clipboard?.writeText(value)}
							>
								Copy data
							</button>
							<button
								className="px-4 py-2 border rounded-md"
								onClick={() => {
									setValue("https://example.com");
									setSize(420);
									setMargin(10);
								}}
							>
								Reset
							</button>
						</div>
					</div>
				</div>

				{/* Right: Preview */}
				<div className="w-full md:w-1/2 flex flex-col items-center gap-4">
					<div className="w-full flex justify-center">
						<div
							className={`relative ${frameEnabled ? "p-2" : "p-0"}`}
							style={{ padding: frameEnabled ? framePadding : 0 }}
						>
							{/* Frame visual */}
							<div
								className={`inline-block ${frameStyle === "rounded" ? "rounded-2xl" : frameStyle === "pill" ? "rounded-full" : "rounded-md"} bg-white/50 shadow-md p-2`}
							>
								<div ref={qrRef} />
							</div>

							{/* Caption */}
							{frameEnabled && caption && (
								<div
									className={`mt-2 text-center ${captionPosition === "top" ? "-translate-y-6" : ""}`}
									style={{ fontSize: captionFontSize }}
								>
									{caption}
								</div>
							)}
						</div>
					</div>

					<div className="w-full flex justify-between items-center">
						<div className="text-sm text-slate-500">
							Live preview — interactive
						</div>
						<div className="text-xs text-slate-400">
							QR library: qr-code-styling
						</div>
					</div>

					<div className="w-full bg-slate-50 rounded-md p-3 text-xs text-slate-600">
						Tips: increase error correction when embedding logos; export SVG for
						the sharpest vector output; reduce background image opacity for
						better scanning.
					</div>
				</div>
			</div>
		</div>
	);
}
