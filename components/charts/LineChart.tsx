"use client";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface LineChartProps {
	data: { date: string; count: number }[];
}

export default function LineChart({ data = [] }: LineChartProps) {
	// Prepare chart data from props
	const categories = data.map((d) => d.date);
	const seriesData = data.map((d) => d.count);

	const chartConfig = {
		series: [
			{
				name: "Page Views",
				data: seriesData.length > 0 ? seriesData : [0],
			},
		],
		options: {
			chart: {
				type: "line" as const,
				toolbar: {
					show: false,
				},
			},
			dataLabels: {
				enabled: false,
			},
			colors: ["#020617"],
			stroke: {
				lineCap: "round" as const,
				curve: "smooth" as const,
			},
			markers: {
				size: 0,
			},
			xaxis: {
				axisTicks: {
					show: false,
				},
				axisBorder: {
					show: false,
				},
				labels: {
					style: {
						colors: "#616161",
						fontSize: "12px",
						fontFamily: "inherit",
						fontWeight: 400,
					},
				},
				categories: categories.length > 0 ? categories : ["-"],
			},
			yaxis: {
				labels: {
					style: {
						colors: "#616161",
						fontSize: "12px",
						fontFamily: "inherit",
						fontWeight: 400,
					},
				},
			},
			grid: {
				show: true,
				borderColor: "#dddddd",
				strokeDashArray: 5,
				xaxis: {
					lines: {
						show: true,
					},
				},
				padding: {
					top: 5,
					right: 20,
				},
			},
			fill: {
				opacity: 0.8,
			},
			tooltip: {
				theme: "dark",
			},
		},
	};

	return (
		<div className="w-full">
			<Chart {...chartConfig} height={350} />
		</div>
	);
}
