import {
  generatePopulation,
  fitness,
  getBest,
  getAvgFitness,
  clamp,
} from "./base";

export class DifferentialEvolution {
  constructor(targetChromosome, options = {}) {
    this.target = targetChromosome;
    this.geneCount = targetChromosome.length;
    this.popSize = options.populationSize || 100;
    this.mutationFactor = options.mutationFactor || 0.8;
    this.crossoverRate = options.crossoverRate || 0.7;
    this.strategy = options.strategy || "rand/1/bin";
    this.geneMin = options.geneMin ?? -50;
    this.geneMax = options.geneMax ?? 50;

    this.population = [];
    this.fitnessValues = [];
    this.generation = 0;
    this.bestEver = null;
    this.bestEverFitness = -Infinity;
  }

  initialize() {
    this.population = generatePopulation(
      this.popSize,
      this.geneCount,
      this.geneMin,
      this.geneMax
    );
    this.fitnessValues = this.population.map((c) => fitness(c, this.target));
    this.generation = 0;
    this.bestEver = null;
    this.bestEverFitness = -Infinity;

    for (let i = 0; i < this.popSize; i++) {
      if (this.fitnessValues[i] > this.bestEverFitness) {
        this.bestEverFitness = this.fitnessValues[i];
        this.bestEver = this.population[i].slice();
      }
    }

    return this.getStats();
  }

  pickDistinctIndices(exclude, count) {
    const indices = [];
    while (indices.length < count) {
      const idx = Math.floor(Math.random() * this.popSize);
      if (idx !== exclude && !indices.includes(idx)) {
        indices.push(idx);
      }
    }
    return indices;
  }

  mutateDE(targetIdx) {
    const [a, b, c] = this.pickDistinctIndices(targetIdx, 3);
    const trial = [];

    for (let j = 0; j < this.geneCount; j++) {
      let gene = this.population[a][j] + this.mutationFactor * (this.population[b][j] - this.population[c][j]);
      gene = clamp(gene, this.geneMin, this.geneMax);
      trial.push(gene);
    }

    return trial;
  }

  crossoverDE(target, trial) {
    const child = [];
    const jRand = Math.floor(Math.random() * this.geneCount);

    for (let j = 0; j < this.geneCount; j++) {
      if (Math.random() < this.crossoverRate || j === jRand) {
        child.push(trial[j]);
      } else {
        child.push(target[j]);
      }
    }

    return child;
  }

  evolve() {
    for (let i = 0; i < this.popSize; i++) {
      const trial = this.mutateDE(i);
      const child = this.crossoverDE(this.population[i], trial);
      const childFitness = fitness(child, this.target);

      if (childFitness >= this.fitnessValues[i]) {
        this.population[i] = child;
        this.fitnessValues[i] = childFitness;

        if (childFitness > this.bestEverFitness) {
          this.bestEverFitness = childFitness;
          this.bestEver = child.slice();
        }
      }
    }

    this.generation++;
    return this.getStats();
  }

  getStats() {
    const best = getBest(this.population, this.target);

    return {
      generation: this.generation,
      bestChromosome: best.chromosome.slice(),
      bestFitness: best.fitness,
      avgFitness: getAvgFitness(this.population, this.target),
      bestEverChromosome: this.bestEver.slice(),
      bestEverFitness: this.bestEverFitness,
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
