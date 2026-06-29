export function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function manhattanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
}

export function mse(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum / a.length;
}

export function rmse(a, b) {
  return Math.sqrt(mse(a, b));
}

export function mae(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum / a.length;
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function cosineDistance(a, b) {
  return 1 - cosineSimilarity(a, b);
}

export function correlation(a, b) {
  const n = a.length;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
  }
  const meanA = sumA / n;
  const meanB = sumB / n;

  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const dA = a[i] - meanA;
    const dB = b[i] - meanB;
    num += dA * dB;
    denA += dA * dA;
    denB += dB * dB;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

export function computeFitness(chromosome, target, method = "fast") {
  // برای waveform از metric سریع‌تر استفاده می‌کنیم
  if (method === "fast") {
    // فقط cosine similarity - سریع‌ترین گزینه
    return Math.max(0, cosineSimilarity(chromosome, target));
  }

  // ترکیب چند معیار برای fitness بهتر (کندتر)
  if (method === "hybrid") {
    const cosSim = cosineSimilarity(chromosome, target);
    const corr = correlation(chromosome, target);
    const eucDist = euclideanDistance(chromosome, target);
    const maxDist = Math.sqrt(chromosome.length) * 100;
    const normEucSim = 1 - eucDist / maxDist;

    const fitness =
      0.5 * cosSim + 0.3 * ((corr + 1) / 2) + 0.2 * Math.max(0, normEucSim);

    return Math.max(0, Math.min(1, fitness));
  }

  // Fallback to single method
  let dist;
  switch (method) {
    case "mse":
      dist = mse(chromosome, target);
      break;
    case "rmse":
      dist = rmse(chromosome, target);
      break;
    case "mae":
      dist = mae(chromosome, target);
      break;
    case "cosine":
      dist = cosineDistance(chromosome, target);
      break;
    case "manhattan":
      dist = manhattanDistance(chromosome, target);
      break;
    case "euclidean":
    default:
      dist = euclideanDistance(chromosome, target);
      break;
  }

  return 1 / (1 + dist);
}

export function computeDetailedFitness(chromosome, target) {
  const dist = euclideanDistance(chromosome, target);
  return {
    euclidean: { distance: dist, fitness: 1 / (1 + dist) },
    mse: {
      distance: mse(chromosome, target),
      fitness: 1 / (1 + mse(chromosome, target)),
    },
    cosine: {
      similarity: cosineSimilarity(chromosome, target),
      fitness: cosineSimilarity(chromosome, target),
    },
    correlation: {
      value: correlation(chromosome, target),
      fitness: (correlation(chromosome, target) + 1) / 2,
    },
    mae: {
      distance: mae(chromosome, target),
      fitness: 1 / (1 + mae(chromosome, target)),
    },
  };
}
