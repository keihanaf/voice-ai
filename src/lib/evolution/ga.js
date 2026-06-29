import {
  generatePopulation,
  fitness,
  sortPopulation,
  getBest,
  getAvgFitness,
  randomGaussian,
  clamp,
} from "./base";

export class GeneticAlgorithm {
  constructor(targetChromosome, options = {}) {
    this.target = targetChromosome;
    this.geneCount = targetChromosome.length;
    this.popSize = options.populationSize || 80; // کاهش برای سرعت
    this.mutationRate = options.mutationRate || 0.12;
    this.crossoverRate = options.crossoverRate || 0.9;
    this.elitismCount = Math.max(2, Math.floor(this.popSize * 0.05)); // 5%
    this.tournamentSize = Math.max(3, Math.floor(this.popSize * 0.05));
    this.mutationStrength = options.mutationStrength || 1.2; // کاهش برای سرعت
    this.geneMin = options.geneMin ?? -50;
    this.geneMax = options.geneMax ?? 50;

    this.population = [];
    this.generation = 0;
    this.bestEver = null;
    this.bestEverFitness = -Infinity;
  }

  initialize() {
    this.population = generatePopulation(
      this.popSize,
      this.geneCount,
      this.geneMin,
      this.geneMax,
    );
    this.generation = 0;
    this.bestEver = null;
    this.bestEverFitness = -Infinity;
    return this.getStats();
  }

  tournamentSelect() {
    let best = null;
    let bestFit = -Infinity;

    for (let i = 0; i < this.tournamentSize; i++) {
      const idx = Math.floor(Math.random() * this.population.length);
      const f = fitness(this.population[idx], this.target);
      if (f > bestFit) {
        bestFit = f;
        best = this.population[idx];
      }
    }

    return best;
  }

  crossover(parent1, parent2) {
    if (Math.random() > this.crossoverRate) {
      return [parent1.slice(), parent2.slice()];
    }

    const child1 = [];
    const child2 = [];
    const alpha = Math.random();

    for (let i = 0; i < this.geneCount; i++) {
      child1.push(alpha * parent1[i] + (1 - alpha) * parent2[i]);
      child2.push((1 - alpha) * parent1[i] + alpha * parent2[i]);
    }

    return [child1, child2];
  }

  mutate(chromosome) {
    const mutated = [];
    for (let i = 0; i < this.geneCount; i++) {
      let gene = chromosome[i];
      if (Math.random() < this.mutationRate) {
        gene += randomGaussian(0, this.mutationStrength);
        gene = clamp(gene, this.geneMin, this.geneMax);
      }
      mutated.push(gene);
    }
    return mutated;
  }

  evolve() {
    const sorted = sortPopulation(this.population, this.target);
    const newPopulation = [];

    for (let i = 0; i < this.elitismCount; i++) {
      newPopulation.push(sorted[i].chromosome.slice());
    }

    while (newPopulation.length < this.popSize) {
      const parent1 = this.tournamentSelect();
      const parent2 = this.tournamentSelect();
      const [child1, child2] = this.crossover(parent1, parent2);

      newPopulation.push(this.mutate(child1));
      if (newPopulation.length < this.popSize) {
        newPopulation.push(this.mutate(child2));
      }
    }

    this.population = newPopulation;
    this.generation++;

    const stats = this.getStats();
    if (stats.bestFitness > this.bestEverFitness) {
      this.bestEverFitness = stats.bestFitness;
      this.bestEver = stats.bestChromosome.slice();
    }

    return stats;
  }

  getStats() {
    const best = getBest(this.population, this.target);
    const avg = getAvgFitness(this.population, this.target);

    return {
      generation: this.generation,
      bestChromosome: best.chromosome,
      bestFitness: best.fitness,
      avgFitness: avg,
      bestEverChromosome: this.bestEver || best.chromosome,
      bestEverFitness: Math.max(this.bestEverFitness, best.fitness),
    };
  }

  run(maxGenerations, onGeneration) {
    this.initialize();

    for (let gen = 0; gen < maxGenerations; gen++) {
      const stats = this.evolve();
      if (onGeneration) onGeneration(stats, gen);
      if (stats.bestFitness >= 0.99) break;
    }

    return this.getStats();
  }
}
