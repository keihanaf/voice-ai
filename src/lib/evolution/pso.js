import {
  generateRandomChromosome,
  fitness,
  randomInRange,
  clamp,
} from "./base";

export class ParticleSwarmOptimization {
  constructor(targetChromosome, options = {}) {
    this.target = targetChromosome;
    this.geneCount = targetChromosome.length;
    this.swarmSize = options.populationSize || 100;
    this.inertia = options.inertia || 0.7;
    this.cognitiveCoeff = options.cognitiveCoeff || 1.5;
    this.socialCoeff = options.socialCoeff || 1.5;
    this.maxVelocity = options.maxVelocity || 10;
    this.geneMin = options.geneMin ?? -50;
    this.geneMax = options.geneMax ?? 50;

    this.particles = [];
    this.globalBest = null;
    this.globalBestFitness = -Infinity;
    this.generation = 0;
  }

  initialize() {
    this.particles = [];
    this.globalBest = null;
    this.globalBestFitness = -Infinity;
    this.generation = 0;

    for (let i = 0; i < this.swarmSize; i++) {
      const position = generateRandomChromosome(this.geneCount, this.geneMin, this.geneMax);
      const velocity = [];
      for (let j = 0; j < this.geneCount; j++) {
        velocity.push(randomInRange(-this.maxVelocity, this.maxVelocity));
      }

      const fit = fitness(position, this.target);

      this.particles.push({
        position,
        velocity,
        personalBest: position.slice(),
        personalBestFitness: fit,
      });

      if (fit > this.globalBestFitness) {
        this.globalBestFitness = fit;
        this.globalBest = position.slice();
      }
    }

    return this.getStats();
  }

  evolve() {
    for (const particle of this.particles) {
      for (let j = 0; j < this.geneCount; j++) {
        const r1 = Math.random();
        const r2 = Math.random();

        const cognitive = this.cognitiveCoeff * r1 * (particle.personalBest[j] - particle.position[j]);
        const social = this.socialCoeff * r2 * (this.globalBest[j] - particle.position[j]);

        particle.velocity[j] = this.inertia * particle.velocity[j] + cognitive + social;
        particle.velocity[j] = clamp(particle.velocity[j], -this.maxVelocity, this.maxVelocity);

        particle.position[j] += particle.velocity[j];
        particle.position[j] = clamp(particle.position[j], this.geneMin, this.geneMax);
      }

      const fit = fitness(particle.position, this.target);

      if (fit > particle.personalBestFitness) {
        particle.personalBestFitness = fit;
        particle.personalBest = particle.position.slice();
      }

      if (fit > this.globalBestFitness) {
        this.globalBestFitness = fit;
        this.globalBest = particle.position.slice();
      }
    }

    this.generation++;
    return this.getStats();
  }

  getStats() {
    let totalFitness = 0;
    for (const p of this.particles) {
      totalFitness += fitness(p.position, this.target);
    }

    return {
      generation: this.generation,
      bestChromosome: this.globalBest.slice(),
      bestFitness: this.globalBestFitness,
      avgFitness: totalFitness / this.particles.length,
      bestEverChromosome: this.globalBest.slice(),
      bestEverFitness: this.globalBestFitness,
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
