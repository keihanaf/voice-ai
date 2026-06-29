import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const experimentId = parseInt(searchParams.get("id"));

    if (!experimentId) {
      return NextResponse.json({ error: "شناسه آزمایش الزامی است" }, { status: 400 });
    }

    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        generationLogs: {
          orderBy: { generation: "asc" },
        },
        audioSnapshots: {
          orderBy: { generation: "asc" },
        },
      },
    });

    if (!experiment) {
      return NextResponse.json({ error: "آزمایش یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({
      experiment: {
        id: experiment.id,
        name: experiment.name,
        algorithm: experiment.algorithm,
        mutationRate: experiment.mutationRate,
        crossoverRate: experiment.crossoverRate,
        populationSize: experiment.populationSize,
        status: experiment.status,
        bestFitness: experiment.bestFitness,
        totalGenerations: experiment.totalGenerations,
        startedAt: experiment.startedAt,
        finishedAt: experiment.finishedAt,
        createdAt: experiment.createdAt,
      },
      logs: experiment.generationLogs.map((log) => ({
        generation: log.generation,
        bestFitness: log.bestFitness,
        avgFitness: log.avgFitness,
        elapsedMs: log.elapsedMs,
      })),
      snapshots: experiment.audioSnapshots.map((snap) => ({
        generation: snap.generation,
        filePath: snap.filePath,
        isOriginal: snap.isOriginal,
      })),
    });
  } catch (error) {
    console.error("Fetch experiment error:", error);
    return NextResponse.json({ error: "خطا در دریافت اطلاعات" }, { status: 500 });
  }
}
