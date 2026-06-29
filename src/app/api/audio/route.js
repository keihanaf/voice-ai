import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const snapshotId = parseInt(searchParams.get("snapshotId"));

    if (!snapshotId) {
      return new Response("Missing snapshotId parameter", { status: 400 });
    }

    const snapshot = await prisma.audioSnapshot.findUnique({
      where: { id: snapshotId },
      select: { audioData: true, filePath: true },
    });

    if (!snapshot || !snapshot.audioData) {
      return new Response("Audio not found", { status: 404 });
    }

    return new Response(snapshot.audioData, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": `attachment; filename="${snapshot.filePath}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Audio serve error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
