const SAMPLE_RATE = 44100;

function interpolateWaveform(chromosome, targetSamples) {
  const output = new Float64Array(targetSamples);
  const ratio = chromosome.length / targetSamples;

  for (let i = 0; i < targetSamples; i++) {
    const srcIdx = i * ratio;
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, chromosome.length - 1);
    const frac = srcIdx - lo;

    const valLo = chromosome[lo] / 50;
    const valHi = chromosome[hi] / 50;

    output[i] = valLo * (1 - frac) + valHi * frac;
  }

  return output;
}

function smoothWaveform(samples) {
  const output = new Float64Array(samples.length);
  const windowSize = 3;
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

export async function synthesizeFromMFCC(
  chromosome,
  referenceFftSpectrum,
  duration = 3,
) {
  const totalSamples = Math.round(SAMPLE_RATE * duration);

  console.log(
    `🎙️ Direct waveform synthesis: chromosome=${chromosome.length} → ${totalSamples} samples`,
  );

  let output = interpolateWaveform(chromosome, totalSamples);
  output = smoothWaveform(output);

  let maxAmp = 0;
  for (let i = 0; i < output.length; i++) {
    const abs = Math.abs(output[i]);
    if (abs > maxAmp) maxAmp = abs;
  }

  if (maxAmp > 0) {
    for (let i = 0; i < output.length; i++) {
      output[i] = (output[i] / maxAmp) * 0.7;
    }
  }

  const fadeLength = Math.min(2205, output.length / 10);
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

export async function synthesizeToWav(chromosome, duration = 3) {
  const samples = await synthesizeFromMFCC(chromosome, null, duration);
  const wavBuffer = encodeWav(samples, SAMPLE_RATE);

  console.log(`💾 Synthesized WAV: ${(wavBuffer.length / 1024).toFixed(1)}KB`);
  return wavBuffer;
}
