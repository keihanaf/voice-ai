-- AlterTable
ALTER TABLE "AudioSnapshot" ADD COLUMN     "audioData" BYTEA;

-- AlterTable
ALTER TABLE "Experiment" ADD COLUMN     "chromosome" TEXT,
ADD COLUMN     "originalAudio" BYTEA;
