"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, CheckCircle2 } from "lucide-react";

function encodeWav(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++)
      view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function resampleBuffer(inputBuffer, inputRate, outputRate) {
  if (inputRate === outputRate) return inputBuffer.getChannelData(0);

  const input = inputBuffer.getChannelData(0);
  const ratio = outputRate / inputRate;
  const outputLength = Math.round(input.length * ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i / ratio;
    const lo = Math.floor(srcIndex);
    const hi = Math.min(lo + 1, input.length - 1);
    const frac = srcIndex - lo;
    output[i] = input[lo] * (1 - frac) + input[hi] * frac;
  }

  return output;
}

export default function AudioRecorder({ onRecordingComplete }) {
  const [recording, setRecording] = useState(false);
  const [recordedFile, setRecordedFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startRecording() {
    setError(null);
    setRecordedFile(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const arrayBuffer = await blob.arrayBuffer();
        const audioCtx = new AudioContext();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        await audioCtx.close();

        const resampled = resampleBuffer(decoded, decoded.sampleRate, 44100);
        const wavBlob = encodeWav(resampled, 44100);
        const fileName = `recording_${Date.now()}.wav`;
        const file = new File([wavBlob], fileName, { type: "audio/wav" });

        setRecordedFile(file);
        if (onRecordingComplete) onRecordingComplete(file);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setRecording(true);
      setDuration(0);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("دسترسی به میکروفون رد شد");
      } else if (err.name === "NotFoundError") {
        setError("میکروفون یافت نشد");
      } else {
        setError("خطا در دسترسی به میکروفون");
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {recording ? (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <Square size={16} fill="currentColor" />
              <span>توقف ضبط</span>
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Mic size={16} />
              <span>شروع ضبط صدا</span>
            </button>
          )}

          {recording && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-sm font-mono">
                {formatTime(duration)}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-xs">
            {error}
          </div>
        )}

        {recordedFile && !recording && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 p-2 rounded border border-green-700/50">
            <CheckCircle2 size={14} />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{recordedFile.name}</span>
              <span className="text-xs text-gray-400">
                {(recordedFile.size / 1024).toFixed(1)} KB • 44.1 kHz • WAV
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
