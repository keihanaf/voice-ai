-- CreateTable
CREATE TABLE "Experiment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "mutationRate" DOUBLE PRECISION NOT NULL,
    "crossoverRate" DOUBLE PRECISION NOT NULL,
    "populationSize" INTEGER NOT NULL,
    "targetFile" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "bestFitness" DOUBLE PRECISION,
    "totalGenerations" INTEGER,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationLog" (
    "id" SERIAL NOT NULL,
    "generation" INTEGER NOT NULL,
    "bestFitness" DOUBLE PRECISION NOT NULL,
    "avgFitness" DOUBLE PRECISION NOT NULL,
    "elapsedMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "experimentId" INTEGER NOT NULL,

    CONSTRAINT "GenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioSnapshot" (
    "id" SERIAL NOT NULL,
    "generation" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "isOriginal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "experimentId" INTEGER NOT NULL,

    CONSTRAINT "AudioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenerationLog_experimentId_idx" ON "GenerationLog"("experimentId");

-- CreateIndex
CREATE INDEX "AudioSnapshot_experimentId_idx" ON "AudioSnapshot"("experimentId");

-- AddForeignKey
ALTER TABLE "GenerationLog" ADD CONSTRAINT "GenerationLog_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioSnapshot" ADD CONSTRAINT "AudioSnapshot_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
