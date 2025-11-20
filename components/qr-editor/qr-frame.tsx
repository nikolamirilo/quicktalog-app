"use client";

import React from "react";

interface QrFrameProps {
	frameStyle?: string;
	frameText?: string;
	frameColor?: string;
	children: React.ReactNode;
}

export default function QrFrame({
	frameStyle = "none",
	frameText = "",
	frameColor = "#000000",
	children,
}: QrFrameProps) {
	if (!frameStyle || frameStyle === "none") {
		return <>{children}</>;
	}

	const renderFrame = () => {
		switch (frameStyle) {
			case "coffee":
				return (
					<div
						className="relative inline-block"
						style={{ width: "400px", height: "450px" }}
					>
						{/* Coffee Mug Frame */}
						<svg
							className="absolute inset-0 w-full h-full"
							viewBox="0 0 400 450"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							{/* Mug body */}
							<path
								d="M80 100 L80 350 Q80 380 110 380 L290 380 Q320 380 320 350 L320 100 Z"
								fill={frameColor}
								stroke={frameColor}
								strokeWidth="8"
							/>
							{/* Inner white area for QR */}
							<rect
								x="100"
								y="120"
								width="200"
								height="240"
								fill="white"
								rx="10"
							/>
							{/* Handle */}
							<path
								d="M320 180 Q360 180 360 220 Q360 260 320 260"
								fill="none"
								stroke={frameColor}
								strokeWidth="12"
								strokeLinecap="round"
							/>
							{/* Steam */}
							<path
								d="M140 80 Q145 60 140 40"
								stroke={frameColor}
								strokeWidth="4"
								strokeLinecap="round"
								opacity="0.6"
							/>
							<path
								d="M200 70 Q205 50 200 30"
								stroke={frameColor}
								strokeWidth="4"
								strokeLinecap="round"
								opacity="0.6"
							/>
							<path
								d="M260 80 Q265 60 260 40"
								stroke={frameColor}
								strokeWidth="4"
								strokeLinecap="round"
								opacity="0.6"
							/>
						</svg>
						{/* QR Code positioned inside the white area */}
						<div
							className="absolute"
							style={{
								top: "120px",
								left: "100px",
								width: "200px",
								height: "240px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<div
								style={{ transform: "scale(0.6)", transformOrigin: "center" }}
							>
								{children}
							</div>
						</div>
						{frameText && (
							<div
								className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white font-bold text-sm px-4 py-1 rounded"
								style={{ backgroundColor: frameColor }}
							>
								{frameText}
							</div>
						)}
					</div>
				);

			case "billboard":
				return (
					<div
						className="relative inline-block"
						style={{ width: "450px", height: "400px" }}
					>
						{/* Billboard Frame */}
						<svg
							className="absolute inset-0 w-full h-full"
							viewBox="0 0 450 400"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							{/* Support poles */}
							<rect x="100" y="280" width="12" height="100" fill={frameColor} />
							<rect x="338" y="280" width="12" height="100" fill={frameColor} />
							{/* Billboard board */}
							<rect
								x="60"
								y="60"
								width="330"
								height="230"
								fill={frameColor}
								rx="8"
							/>
							<rect
								x="75"
								y="75"
								width="300"
								height="200"
								fill="white"
								rx="4"
							/>
							{/* Support bars */}
							<rect x="90" y="270" width="270" height="8" fill={frameColor} />
						</svg>
						{/* QR Code positioned inside the white area */}
						<div
							className="absolute"
							style={{
								top: "75px",
								left: "75px",
								width: "300px",
								height: "200px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<div
								style={{ transform: "scale(0.65)", transformOrigin: "center" }}
							>
								{children}
							</div>
						</div>
						{frameText && (
							<div
								className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white font-bold text-lg px-6 py-2 rounded-lg shadow-lg"
								style={{ backgroundColor: frameColor }}
							>
								{frameText}
							</div>
						)}
					</div>
				);

			case "menu":
				return (
					<div
						className="relative inline-block"
						style={{ width: "380px", height: "480px" }}
					>
						{/* Restaurant Menu Frame */}
						<svg
							className="absolute inset-0 w-full h-full"
							viewBox="0 0 380 480"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							{/* Menu board */}
							<rect
								x="40"
								y="40"
								width="300"
								height="400"
								fill={frameColor}
								rx="12"
							/>
							<rect
								x="55"
								y="100"
								width="270"
								height="300"
								fill="white"
								rx="8"
							/>
							{/* Decorative header */}
							<rect x="55" y="55" width="270" height="35" fill="white" rx="6" />
							{/* Utensils decoration */}
							<line
								x1="80"
								y1="72"
								x2="80"
								y2="78"
								stroke={frameColor}
								strokeWidth="3"
								strokeLinecap="round"
							/>
							<line
								x1="77"
								y1="70"
								x2="77"
								y2="75"
								stroke={frameColor}
								strokeWidth="2"
								strokeLinecap="round"
							/>
							<line
								x1="83"
								y1="70"
								x2="83"
								y2="75"
								stroke={frameColor}
								strokeWidth="2"
								strokeLinecap="round"
							/>
							<circle
								cx="300"
								cy="72"
								r="4"
								fill="none"
								stroke={frameColor}
								strokeWidth="2"
							/>
							<line
								x1="300"
								y1="76"
								x2="300"
								y2="82"
								stroke={frameColor}
								strokeWidth="3"
								strokeLinecap="round"
							/>
						</svg>
						{/* QR Code positioned inside the white area */}
						<div
							className="absolute"
							style={{
								top: "100px",
								left: "55px",
								width: "270px",
								height: "300px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<div
								style={{ transform: "scale(0.85)", transformOrigin: "center" }}
							>
								{children}
							</div>
						</div>
						{frameText && (
							<div
								className="absolute top-16 left-1/2 transform -translate-x-1/2 font-bold text-base px-4"
								style={{ color: frameColor }}
							>
								{frameText}
							</div>
						)}
					</div>
				);

			case "phone":
				return (
					<div
						className="relative inline-block"
						style={{ width: "340px", height: "520px" }}
					>
						{/* Smartphone Frame */}
						<svg
							className="absolute inset-0 w-full h-full"
							viewBox="0 0 340 520"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							{/* Phone body */}
							<rect
								x="70"
								y="40"
								width="200"
								height="440"
								fill={frameColor}
								rx="25"
							/>
							<rect
								x="80"
								y="80"
								width="180"
								height="360"
								fill="white"
								rx="8"
							/>
							{/* Speaker */}
							<rect
								x="140"
								y="55"
								width="60"
								height="6"
								fill="white"
								rx="3"
								opacity="0.7"
							/>
							{/* Camera */}
							<circle cx="250" cy="58" r="5" fill="white" opacity="0.7" />
							{/* Home button */}
							<circle
								cx="170"
								cy="460"
								r="12"
								fill="white"
								opacity="0.3"
								stroke="white"
								strokeWidth="2"
							/>
						</svg>
						{/* QR Code positioned inside the screen */}
						<div
							className="absolute"
							style={{
								top: "80px",
								left: "80px",
								width: "180px",
								height: "360px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<div
								style={{ transform: "scale(0.55)", transformOrigin: "center" }}
							>
								{children}
							</div>
						</div>
						{frameText && (
							<div
								className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-white font-bold text-xs px-3 py-1 rounded"
								style={{ backgroundColor: frameColor, opacity: 0.9 }}
							>
								{frameText}
							</div>
						)}
					</div>
				);

			case "badge":
				return (
					<div
						className="relative inline-block"
						style={{ width: "360px", height: "480px" }}
					>
						{/* ID Badge Frame */}
						<svg
							className="absolute inset-0 w-full h-full"
							viewBox="0 0 360 480"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							{/* Lanyard */}
							<path
								d="M180 20 L180 60"
								stroke={frameColor}
								strokeWidth="4"
								strokeDasharray="8 4"
							/>
							<circle cx="180" cy="15" r="8" fill={frameColor} />
							{/* Badge body */}
							<rect
								x="60"
								y="60"
								width="240"
								height="360"
								fill={frameColor}
								rx="15"
							/>
							<rect
								x="75"
								y="140"
								width="210"
								height="260"
								fill="white"
								rx="10"
							/>
							{/* Header area */}
							<rect x="75" y="75" width="210" height="55" fill="white" rx="8" />
							{/* Clip hole */}
							<circle cx="180" cy="50" r="6" fill="white" />
						</svg>
						{/* QR Code positioned inside the white area */}
						<div
							className="absolute"
							style={{
								top: "140px",
								left: "75px",
								width: "210px",
								height: "260px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<div
								style={{ transform: "scale(0.65)", transformOrigin: "center" }}
							>
								{children}
							</div>
						</div>
						{frameText && (
							<div
								className="absolute top-24 left-1/2 transform -translate-x-1/2 font-bold text-base px-4"
								style={{ color: frameColor }}
							>
								{frameText}
							</div>
						)}
					</div>
				);

			case "ticket":
				return (
					<div
						className="relative inline-block"
						style={{ width: "500px", height: "320px" }}
					>
						{/* Event Ticket Frame */}
						<svg
							className="absolute inset-0 w-full h-full"
							viewBox="0 0 500 320"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							{/* Ticket body with perforated edge */}
							<path
								d="M60 80 L340 80 L340 100 Q350 100 350 110 Q350 120 340 120 L340 140 Q350 140 350 150 Q350 160 340 160 L340 180 Q350 180 350 190 Q350 200 340 200 L340 220 Q350 220 350 230 Q350 240 340 240 L340 260 L60 260 Z"
								fill={frameColor}
							/>
							<rect
								x="75"
								y="95"
								width="250"
								height="150"
								fill="white"
								rx="8"
							/>
							{/* Perforation dots */}
							{[100, 120, 140, 160, 180, 200, 220, 240].map((y) => (
								<circle
									key={y}
									cx="345"
									cy={y}
									r="3"
									fill="white"
									opacity="0.5"
								/>
							))}
							{/* Barcode decoration */}
							{[80, 90, 100, 110, 120, 130, 140].map((x) => (
								<rect
									key={x}
									x={x}
									y="105"
									width="3"
									height="20"
									fill={frameColor}
									opacity="0.3"
								/>
							))}
						</svg>
						{/* QR Code positioned inside the white area */}
						<div
							className="absolute"
							style={{
								top: "95px",
								left: "75px",
								width: "250px",
								height: "150px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<div
								style={{ transform: "scale(0.5)", transformOrigin: "center" }}
							>
								{children}
							</div>
						</div>
						{frameText && (
							<div
								className="absolute top-4 left-32 font-bold text-lg px-4"
								style={{ color: frameColor }}
							>
								{frameText}
							</div>
						)}
					</div>
				);

			default:
				return <>{children}</>;
		}
	};

	return <div className="inline-block">{renderFrame()}</div>;
}
