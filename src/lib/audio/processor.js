import WavDecoder from "wav-decoder";

const SAMPLE_RATE = 44100;
const CHROMOSOME_SIZE = 512; // کاهش از 2048 به 512 برای سرعت بیشتر

function resample(input, inputRate, outputRate) {
  if (inputRate === outputRate) return input;
  const ratio = outputRate / inputRate;
  const outputLength = Math.round(input.length * ratio);
  const output = new Float64Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i / ratio;
    const lo = Math.floor(srcIndex);
    const hi = Math.min(lo + 1, input.length - 1);
    const frac = srcIndex - lo;
    output[i] = input[lo] * (1 - frac) + input[hi] * frac;
  }
  return output;
}

export async function parseWav(buffer) {
  const audioData = await WavDecoder.decode(buffer);
  const rawSamples = audioData.channelData[0];
  const rawRate = audioData.sampleRate;
  const samples = resample(rawSamples, rawRate, SAMPLE_RATE);

  return {
    sampleRate: SAMPLE_RATE,
    rawSampleRate: rawRate,
    channelData: [samples],
    duration: samples.length / SAMPLE_RATE,
    totalSamples: samples.length,
  };
}

export function extractFeatures(samples, sampleRate) {
  // محاسبه RMS برای نرمال‌سازی
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  const rms = Math.sqrt(sum / samples.length);

  return {
    samples: Array.from(samples), // ذخیره کامل waveform
    rms,
    sampleRate,
    totalSamples: samples.length,
    duration: samples.length / sampleRate,
  };
}

export function featuresToChromosome(features) {
  const samples = features.samples;
  const chromosome = [];

  // Downsample waveform به اندازه کروموزوم
  const step = samples.length / CHROMOSOME_SIZE;

  for (let i = 0; i < CHROMOSOME_SIZE; i++) {
    // میانگین‌گیری برای anti-aliasing
    const startIdx = Math.floor(i * step);
    const endIdx = Math.floor((i + 1) * step);

    let sum = 0;
    let count = 0;
    for (let j = startIdx; j < endIdx && j < samples.length; j++) {
      sum += samples[j];
      count++;
    }

    const avgSample = count > 0 ? sum / count : 0;

    // نرمال‌سازی به [-50, 50]
    const normalizedSample = avgSample * 50;
    chromosome.push(Math.max(-50, Math.min(50, normalizedSample)));
  }

  console.log(
    `🧬 Chromosome (Raw Waveform): size=${chromosome.length}, range=[${Math.min(...chromosome).toFixed(2)}, ${Math.max(...chromosome).toFixed(2)}]`,
  );

  return chromosome;
}

export function chromosomeToFeatures(chromosome, referenceFeatures) {
  return {
    samples: chromosome.map((v) => v / 50), // Denormalize
    rms: referenceFeatures.rms,
    sampleRate: referenceFeatures.sampleRate,
    totalSamples: chromosome.length,
    duration: chromosome.length / referenceFeatures.sampleRate,
  };
}
