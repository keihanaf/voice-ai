"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Music,
  Volume1,
} from "lucide-react";

export default function AudioPlayer({ snapshots }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const audioRef = useRef(null);
  const prevSnapshotsLengthRef = useRef(0);

  const original = snapshots?.find((s) => s.isOriginal);
  const generated = snapshots?.filter((s) => !s.isOriginal) || [];
  const allItems = original ? [original, ...generated] : generated;
  const current = allItems[currentIndex];

  const currentPath = current?.filePath;

  // پخش خودکار وقتی نسل جدید اضافه می‌شود
  useEffect(() => {
    if (
      autoPlay &&
      snapshots &&
      snapshots.length > prevSnapshotsLengthRef.current
    ) {
      const newSnapshots = snapshots.filter((s) => !s.isOriginal);
      if (newSnapshots.length > 0) {
        // به آخرین نسل برو
        const lastGeneratedIndex = allItems.findIndex(
          (item) =>
            item.generation ===
            newSnapshots[newSnapshots.length - 1].generation,
        );
        if (lastGeneratedIndex !== -1 && lastGeneratedIndex !== currentIndex) {
          setCurrentIndex(lastGeneratedIndex);
        }
      }
    }
    prevSnapshotsLengthRef.current = snapshots?.length || 0;
  }, [snapshots, autoPlay, allItems, currentIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentPath) {
      audio.pause();
      audio.load();
      if (autoPlay) {
        audio.play().catch(() => setPlaying(false));
        setPlaying(true);
      }
    }
  }, [currentPath, autoPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) audio.pause();
    };
  }, []);

  function togglePlay() {
    if (!audioRef.current || !current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  }

  function prev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setPlaying(false);
    }
  }

  function next() {
    if (currentIndex < allItems.length - 1) {
      setCurrentIndex((i) => i + 1);
      setPlaying(false);
    }
  }

  if (allItems.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
          <Music size={14} /> پخش‌کننده صدا
        </h3>
        <p className="text-gray-500 text-sm">هنوز فایل صوتی وجود ندارد</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Music size={14} /> پخش‌کننده صدا
        </h3>
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
            autoPlay
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
          }`}
          title={autoPlay ? "پخش خودکار فعال" : "پخش خودکار غیرفعال"}
        >
          <Volume1 size={12} />
          <span>{autoPlay ? "پخش خودکار" : "دستی"}</span>
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <Volume2 size={16} className="text-blue-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {current?.isOriginal
              ? "صدای اصلی (هدف)"
              : `نسل ${current?.generation?.toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-400">
            {currentIndex + 1} از {allItems.length}
          </p>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={current?.filePath}
        onEnded={() => setPlaying(false)}
        preload="auto"
      />

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={prev}
          disabled={currentIndex <= 0}
          className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <SkipForward size={18} />
        </button>

        <button
          onClick={togglePlay}
          className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button
          onClick={next}
          disabled={currentIndex >= allItems.length - 1}
          className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <SkipBack size={18} />
        </button>
      </div>

      <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {allItems.map((snap, i) => (
          <button
            key={`audio-${snap.generation}-${i}-${snap.filePath}`}
            onClick={() => {
              setCurrentIndex(i);
              setPlaying(false);
            }}
            className={`
              px-2 py-1 rounded text-xs whitespace-nowrap transition-colors
              ${
                i === currentIndex
                  ? "bg-blue-600 text-white"
                  : snap.isOriginal
                    ? "bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }
            `}
          >
            {snap.isOriginal ? "هدف" : snap.generation.toLocaleString()}
          </button>
        ))}
      </div>
    </div>
  );
}
