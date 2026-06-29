"use client";

import { useState, useRef } from "react";
import { Dna, Bird, FlaskConical, Upload, FileAudio, Loader2, AlertCircle, CheckCircle2, Music } from "lucide-react";
import CustomSelect from "./CustomSelect";

const ALGORITHMS = [
  {
    value: "GA",
    label: "الگوریتم ژنتیک",
    description: "Genetic Algorithm — مناسب فضاهای جستجوی پیچیده",
    icon: Dna,
  },
  {
    value: "PSO",
    label: "ازدحام ذرات",
    description: "Particle Swarm Optimization — همگرایی سریع",
    icon: Bird,
  },
  {
    value: "DE",
    label: "تکامل تفاضلی",
    description: "Differential Evolution — مقاوم در برابر بهینه محلی",
    icon: FlaskConical,
  },
];

export default function AudioUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [algorithm, setAlgorithm] = useState("GA");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected && selected.name.endsWith(".wav")) {
      setFile(selected);
      setError(null);
    } else {
      setFile(null);
      setError("فقط فرمت wav پذیرفته می‌شود");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

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
        return;
      }

      setResult(data);
      if (onUploadSuccess) onUploadSuccess(data);
    } catch (err) {
      setError("خطا در ارسال فایل");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Music size={22} className="text-blue-400" />
        <h2 className="text-xl font-bold text-white text-center">
          آپلود فایل صوتی هدف
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">نام آزمایش</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: بازسازی صدای علوم کامپیوتر"
            className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all"
          />
        </div>

        <CustomSelect
          label="الگوریتم بهینه‌سازی"
          options={ALGORITHMS}
          value={algorithm}
          onChange={setAlgorithm}
        />

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">فایل WAV</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-800/50 transition-all"
          >
            {file ? (
              <div className="text-white flex flex-col items-center gap-1">
                <FileAudio size={28} className="text-blue-400" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload size={28} className="text-gray-500" />
                <p className="text-gray-500">کلیک کنید یا فایل را بکشید</p>
                <p className="text-xs text-gray-600">فقط فرمت .wav</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>در حال پردازش...</span>
            </>
          ) : (
            <>
              <Upload size={18} />
              <span>آپلود و استخراج ویژگی‌ها</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span className="font-medium">آزمایش #{result.experiment.id} ساخته شد</span>
          </div>
          <div className="space-y-1 mr-6">
            <p>مدت: {result.audio.duration.toFixed(2)} ثانیه</p>
            <p>نرخ نمونه‌برداری: {result.audio.sampleRate} Hz</p>
            <p>تعداد فریم‌ها: {result.audio.totalFrames}</p>
            <p>ضرایب MFCC: {result.features.mfccCount}</p>
          </div>
        </div>
      )}
    </div>
  );
}
