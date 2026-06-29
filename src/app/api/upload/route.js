import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseWav,
  extractFeatures,
  featuresToChromosome,
} from "@/lib/audio/processor";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio");
    const experimentName = formData.get("name") || "Untitled Experiment";
    const algorithm = formData.get("algorithm") || "GA";

    if (!file) {
      return NextResponse.json(
        { error: "فایل صوتی ارسال نشده" },
        { status: 400 },
      );
    }

    if (!file.name.endsWith(".wav")) {
      return NextResponse.json(
        { error: "فقط فرمت wav پذیرفته می‌شود" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const parsed = await parseWav(buffer);
    const samples = parsed.channelData[0];
    const features = extractFeatures(samples, parsed.sampleRate);
    const chromosome = featuresToChromosome(features);

    const experiment = await prisma.experiment.create({
      data: {
        name: experimentName,
        algorithm,
        mutationRate: 0.1,
        crossoverRate: 0.7,
        populationSize: 100,
        targetFile: file.name,
        status: "ready",
        originalAudio: buffer,
        chromosome: JSON.stringify(chromosome),
      },
    });

    await prisma.audioSnapshot.create({
      data: {
        generation: 0,
        filePath: `original_${experiment.id}.wav`,
        isOriginal: true,
        experimentId: experiment.id,
        audioData: buffer,
      },
    });

    console.log(
      `✅ Uploaded: ${file.name}, chromosome size: ${chromosome.length}`,
    );

    return NextResponse.json({
      success: true,
      experiment: {
        id: experiment.id,
        name: experiment.name,
        algorithm: experiment.algorithm,
      },
      audio: {
        fileName: file.name,
        duration: parsed.duration,
        sampleRate: parsed.sampleRate,
        totalSamples: features.totalSamples,
      },
      features: {
        chromosomeSize: chromosome.length,
        rms: features.rms,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "خطا در پردازش فایل صوتی" },
      { status: 500 },
    );
  }
}
