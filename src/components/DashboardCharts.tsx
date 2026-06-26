"use client";

import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Tooltip, Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

type Monthly = { month: string; revenue: number }[];
type Conversion = { source: string; total: number; won: number; rate: number }[];

export default function DashboardCharts({ monthly, conversion }: { monthly: Monthly; conversion: Conversion }) {
  const lineData = {
    labels: monthly.map((m) => m.month),
    datasets: [{
      label: "월 매출(원)", data: monthly.map((m) => m.revenue),
      borderColor: "#185FA5", backgroundColor: "#85B7EB", tension: 0.3,
    }],
  };
  const barData = {
    labels: conversion.map((c) => c.source),
    datasets: [{
      label: "전환율(%)", data: conversion.map((c) => c.rate),
      backgroundColor: "#1D9E75",
    }],
  };
  const won = (v: number) => v.toLocaleString();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">월별 매출 추이</h2>
        <Line data={lineData} options={{
          responsive: true, plugins: { legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => `${won(Number(ctx.parsed.y))}원` } } },
          scales: { y: { ticks: { callback: (v) => won(Number(v)) } } },
        }} />
      </div>
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">유입경로별 전환율</h2>
        <Bar data={barData} options={{
          responsive: true, plugins: { legend: { display: false },
            tooltip: { callbacks: { afterLabel: (ctx) => {
              const c = conversion[ctx.dataIndex]; return `${c.won}/${c.total}건`;
            } } } },
          scales: { y: { beginAtZero: true, ticks: { callback: (v) => `${v}%` } } },
        }} />
      </div>
    </div>
  );
}
