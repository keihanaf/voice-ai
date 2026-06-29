import { GeneticAlgorithm } from "./ga";
import { ParticleSwarmOptimization } from "./pso";
import { DifferentialEvolution } from "./de";

export { GeneticAlgorithm } from "./ga";
export { ParticleSwarmOptimization } from "./pso";
export { DifferentialEvolution } from "./de";
export {
  fitness,
  generateRandomChromosome,
  generatePopulation,
  getBest,
  getAvgFitness,
} from "./base";
export {
  computeFitness,
  computeDetailedFitness,
  euclideanDistance,
  manhattanDistance,
  mse,
  rmse,
  mae,
  cosineSimilarity,
  cosineDistance,
  correlation,
} from "../utils/fitness";

export function createAlgorithm(algorithmName, targetChromosome, options = {}) {
  switch (algorithmName) {
    case "GA":
      return new GeneticAlgorithm(targetChromosome, options);
    case "PSO":
      return new ParticleSwarmOptimization(targetChromosome, options);
    case "DE":
      return new DifferentialEvolution(targetChromosome, options);
    default:
      throw new Error(`Unknown algorithm: ${algorithmName}`);
  }
}
