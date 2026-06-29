import { computeFitness } from "../utils/fitness";

export function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomGaussian(mean = 0, stddev = 1) {
  let u1 = Math.random();
  let u2 = Math.random();
  while (u1 === 0) u1 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

export function generateRandomChromosome(geneCount, min = -50, max = 50) {
  const genes = [];
  for (let i = 0; i < geneCount; i++) {
    genes.push(randomInRange(min, max));
  }
  return genes;
}

export function generatePopulation(popSize, geneCount, min = -50, max = 50) {
  const population = [];
  for (let i = 0; i < popSize; i++) {
    population.push(generateRandomChromosome(geneCount, min, max));
  }
  return population;
}

export function fitness(chromosome, target) {
  return computeFitness(chromosome, target, "fast");
}

export function sortPopulation(population, target) {
  const scored = population.map((chromosome) => ({
    chromosome,
    fitness: fitness(chromosome, target),
  }));
  scored.sort((a, b) => b.fitness - a.fitness);
  return scored;
}

export function getBest(population, target) {
  let bestChromosome = population[0];
  let bestFitness = fitness(population[0], target);

  for (let i = 1; i < population.length; i++) {
    const f = fitness(population[i], target);
    if (f > bestFitness) {
      bestFitness = f;
      bestChromosome = population[i];
    }
  }

  return { chromosome: bestChromosome, fitness: bestFitness };
}

export function getAvgFitness(population, target) {
  let total = 0;
  for (const chromosome of population) {
    total += fitness(chromosome, target);
  }
  return total / population.length;
}
