"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Square,
  Dna,
  Bird,
  FlaskConical,
  Upload,
  FileAudio,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Music,
  Activity,
  BarChart3,
  Clock,
  Zap,
  RefreshCw,
  Mic,
  FileText,
} from "lucide-react";
import Link from "next/link";
import CustomSelect from "./CustomSelect";
import ConvergenceChart from "./ConvergenceChart";
import AudioPlayer from "./AudioPlayer";
import AudioRecorder from "./AudioRecorder";

const ALGORITHMS = [
  {
    value: "GA",
    label: "الگوریتم ژنتیک",
    description: "Genetic Algorithm",
    icon: Dna,
  },
  {
    value: "PSO",
    label: "ازدحام ذرات",
    description: "Particle Swarm Optimization",
    icon: Bird,
  },
  {
    value: "DE",
    label: "تکامل تفاضلی",
    description: "Differential Evolution",
    icon: FlaskConical,
  },
];

export default function EvolutionDashboard() {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [algorithm, setAlgorithm] = useState("GA");
  const [populationSize, setPopulationSize] = useState(80);
  const [mutationRate, setMutationRate] = useState(0.12);
  const [maxGenerations, setMaxGenerations] = useState(10000);
  const [inputMode, setInputMode] = useState("upload"); // "upload" or "record"

  const [experimentId, setExperimentId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const [logs, setLogs] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [stats, setStats] = useState({
    generation: 0,
    bestFitness: 0,
    elapsedMs: 0,
  });

  const fileInputRef = useRef(null);
  const pollRef = useRef(null);
  const abortRef = useRef(null);

  const fetchExperiment = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/experiment?id=${id}`);
      const data = await res.json();
      if (!res.ok) return;

      setLogs(data.logs);
      setSnapshots(data.snapshots);
      setStats({
        generation: data.experiment.totalGenerations || data.logs.length,
        bestFitness: data.experiment.bestFitness || 0,
        elapsedMs:
          data.logs.length > 0 ? data.logs[data.logs.length - 1].elapsedMs : 0,
      });
      setStatus(data.experiment.status);
    } catch {}
  }, []);

  function startPolling(id) {
    stopPolling();
    pollRef.current = setInterval(() => fetchExperiment(id), 2000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("name", name || file.name.replace(".wav", ""));
      formData.append("algorithm", algorithm);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setStatus("idle");
        return;
      }

      setExperimentId(data.experiment.id);
      setStatus("ready");
      return data.experiment.id;
    } catch {
      setError("خطا در آپلود فایل");
      setStatus("idle");
      return null;
    }
  }

  async function handleStart() {
    setError(null);

    let expId = experimentId;
    if (!expId) {
      expId = await handleUpload();
      if (!expId) return;
    }

    setStatus("running");
    setLogs([]); // پاک کردن لاگ‌های قبلی
    setSnapshots([]); // پاک کردن اسنپ‌شات‌های قبلی
    setStats({ generation: 0, bestFitness: 0, elapsedMs: 0 }); // ریست آمار
    startPolling(expId);

    try {
      abortRef.current = new AbortController();

      const res = await fetch("/api/evolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experimentId: expId, maxGenerations }),
        signal: abortRef.current.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setStatus("idle");
        stopPolling();
        return;
      }

      await fetchExperiment(expId);
      setStatus("completed");
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("خطا در اجرای الگوریتم");
        setStatus("idle");
      }
    } finally {
      stopPolling();
    }
  }

  function handleStop() {
    if (abortRef.current) abortRef.current.abort();
    stopPolling();
    if (experimentId) {
      fetchExperiment(experimentId);
    }
    setStatus("idle");
  }

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  function handleRecordingComplete(recordedFile) {
    setFile(recordedFile);
    setError(null);
    if (!name) {
      setName(`ضبط_صدا_${new Date().toLocaleTimeString("fa-IR")}`);
    }
  }

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Activity size={24} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-bold text-white">
              پردازش سیگنال و بهینه‌سازی تکاملی
            </h1>
            <p className="text-xs text-gray-500">
              بازسازی سیگنال صوتی با الگوریتم‌های فراابتکاری
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* پنل کنترل */}
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
              <h2 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <Zap size={14} /> تنظیمات آزمایش
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    نام آزمایش
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="بازسازی صدای علوم کامپیوتر"
                    className="w-full px-3 py-2 bg-gray-800 text-white text-sm rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none"
                  />
                </div>

                <CustomSelect
                  label="الگوریتم"
                  options={ALGORITHMS}
                  value={algorithm}
                  onChange={setAlgorithm}
                />

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    اندازه جمعیت
                  </label>
                  <input
                    type="number"
                    value={populationSize}
                    onChange={(e) => setPopulationSize(Number(e.target.value))}
                    min={50}
                    max={500}
                    step={10}
                    className="w-full px-3 py-2 bg-gray-800 text-white text-sm rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    پیشنهاد: 60-100 (بهینه شده برای سرعت)
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    نرخ جهش
                  </label>
                  <input
                    type="number"
                    value={mutationRate}
                    onChange={(e) => setMutationRate(Number(e.target.value))}
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    className="w-full px-3 py-2 bg-gray-800 text-white text-sm rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    پیشنهاد: 0.1-0.15 (متوازن)
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    حداکثر نسل‌ها
                  </label>
                  <input
                    type="number"
                    value={maxGenerations}
                    onChange={(e) => setMaxGenerations(Number(e.target.value))}
                    min={1000}
                    max={100000}
                    step={1000}
                    className="w-full px-3 py-2 bg-gray-800 text-white text-sm rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    پیشنهاد: 8,000-15,000 (سریع و کافی)
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    منبع ورودی صدا
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setInputMode("upload")}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                        inputMode === "upload"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}
                    >
                      <Upload size={14} />
                      <span>آپلود فایل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode("record")}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                        inputMode === "record"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}
                    >
                      <Mic size={14} />
                      <span>ضبط صدا</span>
                    </button>
                  </div>

                  {inputMode === "upload" ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border border-dashed border-gray-600 rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      {file ? (
                        <div className="text-white text-sm flex items-center justify-center gap-2">
                          <FileAudio size={16} className="text-blue-400" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-gray-500 text-xs">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                          <Upload size={16} />
                          <span>کلیک کنید یا فایل را بکشید</span>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".wav"
                        onChange={(e) => {
                          setFile(e.target.files[0]);
                          setError(null);
                        }}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <AudioRecorder
                      onRecordingComplete={handleRecordingComplete}
                    />
                  )}
                </div>
              </div>

              {/* هشدار علمی */}
              <div className="mt-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle
                    size={14}
                    className="text-yellow-400 shrink-0 mt-0.5"
                  />
                  <div className="text-xs text-yellow-200/90 leading-relaxed">
                    <p className="font-medium mb-1">💡 محدودیت علمی:</p>
                    <p>
                      بازسازی دقیق صدا از طیف فرکانسی بدون اطلاعات فاز (phase)
                      غیرممکن است. این پروژه آموزشی نشان می‌دهد الگوریتم‌های
                      تکاملی چگونه کار می‌کنند، نه بازسازی کامل صدا.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* دکمه‌ها */}
            <div className="flex gap-2">
              {status === "running" ? (
                <button
                  onClick={handleStop}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Square size={16} />
                  <span>توقف</span>
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={!file && !experimentId}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {status === "uploading" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>آپلود...</span>
                    </>
                  ) : status === "completed" ? (
                    <>
                      <RefreshCw size={16} />
                      <span>اجرای مجدد</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      <span>شروع اجرا</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {experimentId && (
              <Link
                href={`/report?id=${experimentId}`}
                target="_blank"
                className="w-full px-4 py-2.5 bg-gray-800 text-gray-300 text-sm rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <FileText size={14} />
                <span>مشاهده گزارش کامل</span>
              </Link>
            )}

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* آمار */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
              <h2 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <BarChart3 size={14} /> آمار زنده
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">نسل</p>
                  <p className="text-lg font-bold text-white">
                    {logs.length.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">بهترین پردازش</p>
                  <p className="text-lg font-bold text-blue-400">
                    {lastLog ? lastLog.bestFitness.toFixed(4) : "—"}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">میانگین</p>
                  <p className="text-lg font-bold text-green-400">
                    {lastLog ? lastLog.avgFitness.toFixed(4) : "—"}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">زمان</p>
                  <p className="text-lg font-bold text-gray-300 flex items-center justify-center gap-1">
                    <Clock size={14} />
                    {lastLog
                      ? (lastLog.elapsedMs / 1000).toFixed(1) + "s"
                      : "—"}
                  </p>
                </div>
              </div>
              {status === "completed" && (
                <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 size={14} />
                  <span>تکمیل شده</span>
                </div>
              )}
            </div>
          </div>

          {/* نمودار و پخش‌کننده */}
          <div className="lg:col-span-2 space-y-4">
            <ConvergenceChart data={logs} />
            <AudioPlayer snapshots={snapshots} />

            {/* جدول لاگ‌ها */}
            {logs.length > 0 && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  آخرین لاگ‌ها
                </h3>
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-800">
                      <tr className="text-gray-500 text-xs">
                        <th className="text-right py-1 px-2">نسل</th>
                        <th className="text-right py-1 px-2">بهترین</th>
                        <th className="text-right py-1 px-2">میانگین</th>
                        <th className="text-right py-1 px-2">زمان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs
                        .slice(-50)
                        .reverse()
                        .map((log, i) => (
                          <tr key={i} className="border-t border-gray-700/50">
                            <td className="py-1 px-2 text-gray-300">
                              {log.generation.toLocaleString()}
                            </td>
                            <td className="py-1 px-2 text-blue-400">
                              {log.bestFitness.toFixed(4)}
                            </td>
                            <td className="py-1 px-2 text-green-400">
                              {log.avgFitness.toFixed(4)}
                            </td>
                            <td className="py-1 px-2 text-gray-500">
                              {log.elapsedMs
                                ? (log.elapsedMs / 1000).toFixed(1) + "s"
                                : "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
