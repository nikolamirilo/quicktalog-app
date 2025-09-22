"use client"
import dynamic from "next/dynamic"
import { useState } from "react"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

import type { DonutChartProps } from "@/types/components"

export default function DonutChart({
  data = [],
  labels = [],
  title,
  description,
  icon,
}: DonutChartProps) {
  const [chartColors, setChartColors] = useState(["#010e58", "#e2e8f0"])

  const chartConfig = {
    type: "donut" as const,
    height: "100%",
    width: "100%",
    series: data.length > 0 ? data : [1],
    options: {
      chart: {
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
        dropShadow: {
          enabled: true,
          opacity: 0.08,
          blur: 3,
          left: 0,
          top: 1,
        },
      },
      title: {
        text: "",
        align: "left" as const,
      },
      dataLabels: {
        enabled: false,
      },
      colors: chartColors,
      legend: {
        show: false,
      },
      labels: labels.length > 0 ? labels : ["-"],
      states: {
        hover: {
          filter: {
            type: "none",
          },
        },
        active: {
          filter: {
            type: "none",
          },
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              total: {
                show: true,
                showAlways: true,
                label: "Used",
                fontSize: '14px',
                fontWeight: 500,
                color: '#64748b',
                formatter: function (w: any) {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => {
                    return a + b
                  }, 0)
                  const used = w.globals.series[0]
                  const percentage = total > 0 ? Math.round((used / total) * 100) : 0
                  return `${percentage}%`
                },
              },
            },
          },
        },
      },
      stroke: {
        width: 0.3,
        colors: ['#000000'],
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 180,
            },
            plotOptions: {
              pie: {
                donut: {
                  size: '65%',
                },
              },
            },
          },
        },
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 160,
            },
            plotOptions: {
              pie: {
                donut: {
                  size: '60%',
                },
              },
            },
          },
        },
      ],
    },
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Chart {...chartConfig} />
    </div>
  )
}
