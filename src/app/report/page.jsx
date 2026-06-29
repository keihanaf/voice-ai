"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  FileDown,
  FileText,
  Clock,
  Settings,
  BarChart3,
  Music,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";

function ReportContent() {
  const searchParams = useSearchParams();
  const experimentId = searchParams.get("id");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadReport() {
    if (!experimentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/experiment?id=${experimentId}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        return;
      }
      setData(json);
    } catch {
      setError("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!data?.logs?.length) return;

    const headers = [
      "Generation",
      "Best Fitness",
      "Average Fitness",
      "Elapsed (ms)",
    ];
    const rows = data.logs.map((log) => [
      log.generation,
      log.bestFitness.toFixed(6),
      log.avgFitness.toFixed(6),
      log.elapsedMs || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `experiment_${experimentId}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!experimentId) {
    return (
      <div
        className="min-h-screen bg-black flex items-center justify-center"
        dir="rtl"
      >
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-700 text-center max-w-md">
          <FileText size={48} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">گزارش آزمایش</h2>
          <p className="text-gray-400 text-sm mb-4">
            شناسه آزمایش در URL مشخص نشده
          </p>
          <p className="text-gray-500 text-xs">
            مثال:{" "}
            <code className="bg-gray-800 px-2 py-1 rounded">/report?id=1</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={22} className="text-blue-400" />
            <div>
              <h1 className="text-lg font-bold text-white">
                گزارش آزمایش #{experimentId}
              </h1>
              <p className="text-xs text-gray-500">
                جزئیات کامل اجرای الگوریتم
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowRight size={14} />
            بازگشت به داشبورد
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {!data && !loading && (
          <div className="text-center py-12">
            <button
              onClick={loadReport}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              بارگذاری گزارش
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2
              size={32}
              className="text-blue-400 mx-auto animate-spin mb-3"
            />
            <p className="text-gray-400">در حال بارگذاری...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm flex items-center gap-2">
            <XCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {data && <ExperimentReport data={data} onExportCSV={exportCSV} />}
      </main>
    </div>
  );
}

function ExperimentReport({ data, onExportCSV }) {
  const { experiment, logs, snapshots } = data;

  const duration =
    experiment.startedAt && experiment.finishedAt
      ? (
          (new Date(experiment.finishedAt) - new Date(experiment.startedAt)) /
          1000
        ).toFixed(1)
      : null;

  const chartData = logs.map((log) => ({
    generation: log.generation,
    بهترین: Number(log.bestFitness.toFixed(4)),
    میانگین: Number(log.avgFitness.toFixed(4)),
  }));

  return (
    <div className="space-y-6">
      {/* خلاصه */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BarChart3 size={18} className="text-blue-400" />}
          label="تعداد نسل‌ها"
          value={logs.length.toLocaleString()}
        />
        <StatCard
          icon={<CheckCircle2 size={18} className="text-green-400" />}
          label="بهترین برازش"
          value={experiment.bestFitness?.toFixed(4) || "—"}
        />
        <StatCard
          icon={<Clock size={18} className="text-yellow-400" />}
          label="زمان اجرا"
          value={duration ? `${duration}s` : "—"}
        />
        <StatCard
          icon={<Music size={18} className="text-purple-400" />}
          label="فایل‌های صوتی"
          value={snapshots.length.toString()}
        />
      </div>

      {/* پارامترها */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <Settings size={14} /> پارامترهای آزمایش
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <InfoRow label="نام" value={experiment.name} />
          <InfoRow label="الگوریتم" value={experiment.algorithm} />
          <InfoRow
            label="وضعیت"
            value={
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  experiment.status === "completed"
                    ? "bg-green-900/50 text-green-400"
                    : experiment.status === "running"
                      ? "bg-blue-900/50 text-blue-400"
                      : "bg-gray-700 text-gray-400"
                }`}
              >
                {experiment.status === "completed"
                  ? "تکمیل‌شده"
                  : experiment.status === "running"
                    ? "در حال اجرا"
                    : experiment.status === "ready"
                      ? "آماده"
                      : experiment.status}
              </span>
            }
          />
          <InfoRow
            label="اندازه جمعیت"
            value={experiment.populationSize?.toLocaleString()}
          />
          <InfoRow
            label="نرخ جهش"
            value={experiment.mutationRate?.toFixed(2)}
          />
          <InfoRow
            label="نرخ تقاطع"
            value={experiment.crossoverRate?.toFixed(2)}
          />
        </div>
      </div>

      {/* نمودار */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">
            نمودار همگرایی نهایی
          </h3>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
          >
            <FileDown size={14} />
            خروجی CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <defs>
              <linearGradient id="bestGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="generation"
              stroke="#9CA3AF"
              fontSize={11}
              tickFormatter={(v) => v.toLocaleString()}
            />
            <YAxis stroke="#9CA3AF" fontSize={11} domain={[0, 1]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #4B5563",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#9CA3AF" }}
              labelFormatter={(v) => `نسل ${v.toLocaleString()}`}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
            <Area
              type="monotone"
              dataKey="بهترین"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#bestGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="میانگین"
              stroke="#10B981"
              strokeWidth={1.5}
              fill="url(#avgGrad)"
              dot={false}
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* جدول فایل‌های صوتی */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <Music size={14} /> فایل‌های صوتی تولیدشده
        </h3>
        {snapshots.length === 0 ? (
          <p className="text-gray-500 text-sm">هنوز فایلی تولید نشده</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-700">
                  <th className="text-right py-2 px-3">ردیف</th>
                  <th className="text-right py-2 px-3">نسل</th>
                  <th className="text-right py-2 px-3">نوع</th>
                  <th className="text-center py-2 px-3">دانلود</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((snap, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-800 hover:bg-gray-800/50"
                  >
                    <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                    <td className="py-2 px-3 text-white font-medium">
                      {snap.generation === 0
                        ? "اصلی"
                        : snap.generation.toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      {snap.isOriginal ? (
                        <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-400 rounded text-xs">
                          فایل هدف
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded text-xs">
                          تولیدی
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <a
                        href={snap.filePath}
                        download
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-xs"
                      >
                        <FileDown size={12} />
                        دانلود
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* جدول لاگ‌ها */}
      {logs.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            لاگ نسل‌ها (نمونه)
          </h3>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="text-gray-500 text-xs border-b border-gray-700">
                  <th className="text-right py-2 px-3">نسل</th>
                  <th className="text-right py-2 px-3">بهترین برازش</th>
                  <th className="text-right py-2 px-3">میانگین برازش</th>
                  <th className="text-right py-2 px-3">زمان (ms)</th>
                </tr>
              </thead>
              <tbody>
                {sampleLogs(logs).map((log, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="py-1.5 px-3 text-gray-300">
                      {log.generation.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-3 text-blue-400 font-mono">
                      {log.bestFitness.toFixed(6)}
                    </td>
                    <td className="py-1.5 px-3 text-green-400 font-mono">
                      {log.avgFitness.toFixed(6)}
                    </td>
                    <td className="py-1.5 px-3 text-gray-500">
                      {log.elapsedMs?.toLocaleString() || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span className="text-gray-500 text-xs">{label}</span>
      <p className="text-white mt-0.5">{value || "—"}</p>
    </div>
  );
}

function sampleLogs(logs) {
  if (logs.length <= 20) return logs;
  const step = Math.floor(logs.length / 20);
  const sampled = [];
  for (let i = 0; i < logs.length; i += step) {
    sampled.push(logs[i]);
  }
  if (sampled[sampled.length - 1] !== logs[logs.length - 1]) {
    sampled.push(logs[logs.length - 1]);
  }
  return sampled;
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 size={32} className="text-blue-400 animate-spin" />
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
