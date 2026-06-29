import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { createAlgorithm } from "@/lib/evolution";
import { saveSynthesizedAudio } from "@/lib/audio/synthesizer";

const SNAPSHOT_INTERVAL = 2000;
const LOG_INTERVAL = 50; // افزایش از 10 به 50 برای کاهش نوشتن DB

export async function POST(request) {
  try {
    const body = await request.json();
    const { experimentId, maxGenerations = 10000 } = body;

    if (!experimentId) {
      return NextResponse.json(
        { error: "شناسه آزمایش الزامی است" },
        { status: 400 },
      );
    }

    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
    });

    if (!experiment) {
      return NextResponse.json({ error: "آزمایش یافت نشد" }, { status: 404 });
    }

    // بارگیری features و chromosome از فایل
    const featuresPath = path.join(
      process.cwd(),
      "public",
      experiment.targetFile + ".features.json",
    );

    let features;
    try {
      const raw = await readFile(featuresPath, "utf-8");
      features = JSON.parse(raw);
      console.log("📂 Loaded features:", {
        hasChromosome: !!features.chromosome,
        chromosomeSize: features.chromosome?.length,
        hasMfcc: !!features.mfcc,
        hasFftSpectrum: !!features.fftSpectrum,
      });
    } catch (err) {
      console.error("❌ Failed to load features:", err);
      return NextResponse.json(
        { error: "فایل ویژگی‌ها یافت نشد" },
        { status: 404 },
      );
    }

    if (!features.chromosome || !Array.isArray(features.chromosome)) {
      console.error("❌ Invalid chromosome in features file");
      return NextResponse.json(
        { error: "کروموزوم هدف نامعتبر است" },
        { status: 400 },
      );
    }

    const targetChromosome = features.chromosome;

    console.log(`🧬 Target chromosome stats:`, {
      length: targetChromosome.length,
      min: Math.min(...targetChromosome).toFixed(2),
      max: Math.max(...targetChromosome).toFixed(2),
      avg: (
        targetChromosome.reduce((a, b) => a + b, 0) / targetChromosome.length
      ).toFixed(2),
    });

    await prisma.experiment.update({
      where: { id: experimentId },
      data: { status: "running", startedAt: new Date() },
    });

    const algorithm = createAlgorithm(experiment.algorithm, targetChromosome, {
      populationSize: experiment.populationSize,
      mutationRate: experiment.mutationRate,
      crossoverRate: experiment.crossoverRate,
    });

    const initStats = algorithm.initialize();
    console.log(`🚀 Algorithm initialized:`, {
      algorithm: experiment.algorithm,
      population: experiment.populationSize,
      initialBestFitness: initStats.bestFitness.toFixed(6),
      initialAvgFitness: initStats.avgFitness.toFixed(6),
    });

    const startTime = Date.now();
    let logBatch = [];

    for (let gen = 1; gen <= maxGenerations; gen++) {
      const stats = algorithm.evolve();

      if (gen % LOG_INTERVAL === 0 || gen === 1) {
        logBatch.push({
          generation: stats.generation,
          bestFitness: stats.bestFitness,
          avgFitness: stats.avgFitness,
          elapsedMs: Date.now() - startTime,
          experimentId,
        });

        if (gen % 200 === 0) {
          console.log(
            `📊 Gen ${gen}: best=${stats.bestFitness.toFixed(6)}, avg=${stats.avgFitness.toFixed(6)}`,
          );
        }
      }

      // Flush logs every 100 generations
      if (logBatch.length >= 100) {
        await prisma.generationLog.createMany({ data: logBatch });
        logBatch = [];
      }

      // Save audio snapshot every SNAPSHOT_INTERVAL
      if (stats.generation % SNAPSHOT_INTERVAL === 0) {
        if (logBatch.length > 0) {
          await prisma.generationLog.createMany({ data: logBatch });
          logBatch = [];
        }

        const audioPath = await saveSynthesizedAudio(
          stats.bestEverChromosome,
          stats.generation,
          experimentId,
        );

        await prisma.audioSnapshot.create({
          data: {
            generation: stats.generation,
            filePath: audioPath,
            isOriginal: false,
            experimentId,
          },
        });

        console.log(`🎵 Saved audio snapshot at gen ${stats.generation}`);
      }

      // Stop only if convergence is nearly perfect
      if (stats.bestFitness >= 0.999) {
        console.log(
          `🎯 Reached target fitness ${stats.bestFitness.toFixed(6)} at gen ${gen}`,
        );
        break;
      }
    }

    // Flush remaining logs
    if (logBatch.length > 0) {
      await prisma.generationLog.createMany({ data: logBatch });
    }

    const finalStats = algorithm.getStats();

    await prisma.experiment.update({
      where: { id: experimentId },
      data: {
        status: "completed",
        bestFitness: finalStats.bestEverFitness,
        totalGenerations: finalStats.generation,
        finishedAt: new Date(),
      },
    });

    console.log(`✅ Evolution complete:`, {
      generations: finalStats.generation,
      bestFitness: finalStats.bestEverFitness.toFixed(6),
      duration: ((Date.now() - startTime) / 1000).toFixed(1) + "s",
    });

    return NextResponse.json({
      success: true,
      experimentId,
      generations: finalStats.generation,
      bestFitness: finalStats.bestEverFitness,
      elapsedMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error("❌ Evolution error:", error);
    return NextResponse.json(
      { error: "خطا در اجرای الگوریتم" },
      { status: 500 },
    );
  }
}
