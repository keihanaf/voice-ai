import { writeFile, mkdir } from "fs/promises";
import path from "path";

const SAMPLE_RATE = 44100;

// Interpolate waveform to target duration
function interpolateWaveform(chromosome, targetSamples) {
  const output = new Float64Array(targetSamples);
  const ratio = chromosome.length / targetSamples;

  for (let i = 0; i < targetSamples; i++) {
    const srcIdx = i * ratio;
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, chromosome.length - 1);
    const frac = srcIdx - lo;

    // Denormalize from [-50, 50] to [-1, 1]
    const valLo = chromosome[lo] / 50;
    const valHi = chromosome[hi] / 50;

    output[i] = valLo * (1 - frac) + valHi * frac;
  }

  return output;
}

// Apply light smoothing to reduce artifacts
function smoothWaveform(samples) {
  const output = new Float64Array(samples.length);
  const windowSize = 3; // کاهش از 5 به 3
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < samples.length; i++) {
    let sum = 0;
    let count = 0;

    for (let j = -halfWindow; j <= halfWindow; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < samples.length) {
        sum += samples[idx];
        count++;
      }
    }

    output[i] = sum / count;
  }

  return output;
}

// Synthesis از کروموزوم (که خود waveform است!)
export async function synthesizeFromMFCC(
  chromosome,
  referenceFftSpectrum,
  duration = 3,
) {
  const totalSamples = Math.round(SAMPLE_RATE * duration);

  console.log(
    `🎙️ Direct waveform synthesis: chromosome=${chromosome.length} → ${totalSamples} samples`,
  );

  // 1. Interpolate کروموزوم به اندازه هدف
  let output = interpolateWaveform(chromosome, totalSamples);

  // 2. اعمال smoothing برای کاهش artifacts
  output = smoothWaveform(output);

  // 3. نرمال‌سازی amplitude
  let maxAmp = 0;
  for (let i = 0; i < output.length; i++) {
    const abs = Math.abs(output[i]);
    if (abs > maxAmp) maxAmp = abs;
  }

  if (maxAmp > 0) {
    for (let i = 0; i < output.length; i++) {
      output[i] = (output[i] / maxAmp) * 0.7; // Scale to 70%
    }
  }

  // 4. Fade in/out برای جلوگیری از click
  const fadeLength = Math.min(2205, output.length / 10); // ~50ms
  for (let i = 0; i < fadeLength; i++) {
    const fade = i / fadeLength;
    output[i] *= fade;
    if (output.length - 1 - i >= 0) {
      output[output.length - 1 - i] *= fade;
    }
  }

  console.log(
    `✅ Synthesis complete: ${output.length} samples, peak=${maxAmp.toFixed(6)}`,
  );

  return output;
}

function floatTo16BitPCM(float32Array) {
  const buffer = Buffer.alloc(float32Array.length * 2);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    buffer.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  return buffer;
}

function encodeWav(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  const pcm = floatTo16BitPCM(samples);
  pcm.copy(buffer, 44);

  return buffer;
}

export async function saveSynthesizedAudio(
  chromosome,
  generation,
  experimentId,
) {
  const samples = await synthesizeFromMFCC(chromosome, null, 3);
  const wavBuffer = encodeWav(samples, SAMPLE_RATE);

  const outputDir = path.join(process.cwd(), "public", "outputs");
  await mkdir(outputDir, { recursive: true });

  const fileName = `exp${experimentId}_gen${generation}.wav`;
  const filePath = path.join(outputDir, fileName);
  await writeFile(filePath, wavBuffer);

  console.log(`💾 ${fileName} (${(wavBuffer.length / 1024).toFixed(1)}KB)`);
  return `/outputs/${fileName}`;
}
