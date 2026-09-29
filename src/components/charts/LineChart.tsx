"use client";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

/**
 * A product token as a colour ApexCharts can parse ("rgb(r, g, b)"). The chart
 * renders only in the browser (`ssr: false`), where `.product` sets the tokens.
 */
function tokenColor(name: string): string {
	if (typeof document === "undefined") return "";
	const channels = getComputedStyle(document.body)
		.getPropertyValue(`--product-${name}-rgb`)
		.trim()
		.split(/\s+/);
	return channels.length === 3 ? `rgb(${channels.join(", ")})` : "";
}

export type LineChartPoint = {
	/** Short axis label, e.g. "Sep 20". */
	label: string;
	/** Longer label for the tooltip, e.g. "Sat, Sep 20". */
	title: string;
	value: number;
	/** Optional second number shown in the tooltip only. */
	detail?: string;
};

interface LineChartProps {
	data: LineChartPoint[];
	/** Series name, used in the tooltip and by screen readers. */
	name?: string;
	/** Unit after the value in the tooltip, e.g. "views". */
	unit?: string;
}

const escapeHtml = (value: string) =>
	value.replace(
		/[&<>"']/g,
		(c) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				c
			] as string,
	);

/** Amber area chart with an ink tooltip. Pair it with a table for keyboard users. */
export function LineChart({
	data = [],
	name = "Page views",
	unit = "views",
}: LineChartProps) {
	const points = data.length > 0 ? data : [{ label: "-", title: "", value: 0 }];
	const last = points[points.length - 1];
	const line = tokenColor("chart");
	const axis = tokenColor("muted");
	const grid = tokenColor("border");
	const card = tokenColor("card");

	const options: ApexOptions = {
		chart: {
			type: "area",
			toolbar: { show: false },
			zoom: { enabled: false },
			fontFamily: "inherit",
			parentHeightOffset: 0,
			animations: { enabled: false },
		},
		colors: [line],
		dataLabels: { enabled: false },
		stroke: { curve: "smooth", width: 2, lineCap: "round" },
		fill: {
			type: "gradient",
			gradient: {
				shade: "light",
				type: "vertical",
				shadeIntensity: 0,
				gradientToColors: [tokenColor("primary")],
				opacityFrom: 0.32,
				opacityTo: 0,
				stops: [0, 100],
			},
		},
		markers: {
			size: 0,
			strokeWidth: 2,
			strokeColors: card,
			hover: { size: 5 },
		},
		grid: {
			borderColor: grid,
			strokeDashArray: 0,
			xaxis: { lines: { show: false } },
			yaxis: { lines: { show: true } },
			padding: { top: 4, right: 12, left: 4 },
		},
		xaxis: {
			categories: points.map((p) => p.label),
			tickAmount: Math.min(6, points.length),
			axisBorder: { show: false },
			axisTicks: { show: false },
			crosshairs: {
				stroke: { color: axis, width: 1, dashArray: 3 },
			},
			tooltip: { enabled: false },
			labels: {
				rotate: 0,
				hideOverlappingLabels: true,
				style: { colors: axis, fontSize: "11.5px", fontWeight: 500 },
			},
		},
		yaxis: {
			min: 0,
			tickAmount: 4,
			forceNiceScale: true,
			labels: {
				style: { colors: axis, fontSize: "11.5px", fontWeight: 500 },
				formatter: (v: number) => Math.round(v).toLocaleString("en-US"),
			},
		},
		legend: { show: false },
		annotations: {
			points:
				data.length > 0
					? [
							{
								x: last.label,
								y: last.value,
								marker: {
									size: 4,
									fillColor: line,
									strokeColor: card,
									strokeWidth: 2,
								},
								label: {
									text: `Today · ${last.value.toLocaleString("en-US")}`,
									borderWidth: 0,
									offsetY: -4,
									style: {
										background: tokenColor("foreground"),
										color: card,
										fontSize: "11px",
										fontWeight: 600,
										padding: { left: 6, right: 6, top: 3, bottom: 3 },
									},
								},
							},
						]
					: [],
		},
		tooltip: {
			custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
				const p = points[dataPointIndex];
				if (!p) return "";
				return `<div style="padding:8px 10px;border-radius:12px;background:var(--product-foreground);color:var(--product-card);font-family:inherit;font-weight:500;font-size:12.5px;line-height:1.4;white-space:nowrap;box-shadow:0 10px 24px -8px rgb(var(--product-foreground-rgb) / 0.5)"><b style="display:block;font-size:14px">${p.value.toLocaleString("en-US")} ${escapeHtml(unit)}</b>${escapeHtml(p.title)}${p.detail ? ` · ${escapeHtml(p.detail)}` : ""}</div>`;
			},
		},
		responsive: [{ breakpoint: 900, options: { chart: { height: 280 } } }],
	};

	return (
		<div className="w-full [&_.apexcharts-tooltip]:!border-0 [&_.apexcharts-tooltip]:!bg-transparent [&_.apexcharts-tooltip]:!shadow-none">
			<Chart
				height={330}
				options={options}
				series={[{ name, data: points.map((p) => p.value) }]}
				type="area"
			/>
		</div>
	);
}
