"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function ConvergenceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
        <p className="text-gray-500 text-sm">هنوز داده‌ای ثبت نشده</p>
      </div>
    );
  }

  const chartData = data.map((log) => ({
    generation: log.generation,
    "بهترین پردازش": Number(log.bestFitness.toFixed(4)),
    "میانگین پردازش": Number(log.avgFitness.toFixed(4)),
  }));

  // Calculate dynamic Y-axis domain
  const allFitness = chartData.flatMap((d) => [
    d["بهترین پردازش"],
    d["میانگین پردازش"],
  ]);
  const minFitness = Math.min(...allFitness);
  const maxFitness = Math.max(...allFitness);
  const padding = (maxFitness - minFitness) * 0.1 || 0.1;
  const yMin = Math.max(0, minFitness - padding);
  const yMax = Math.min(1, maxFitness + padding);

  return (
    <div className="w-full bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">نمودار همگرایی</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="generation"
            stroke="#9CA3AF"
            fontSize={11}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={11}
            domain={[yMin, yMax]}
            tickFormatter={(v) => v.toFixed(3)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #4B5563",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#9CA3AF" }}
            labelFormatter={(v) => `نسل ${v.toLocaleString()}`}
            formatter={(value) => value.toFixed(4)}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="بهترین پردازش"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
          <Line
            type="monotone"
            dataKey="میانگین پردازش"
            stroke="#10B981"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 4"
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
