# Voice AI

Audio signal reconstruction using metaheuristic evolutionary algorithms. Upload or record a `.wav` file, then watch Genetic Algorithm, Particle Swarm Optimization, or Differential Evolution converge toward the original waveform in real time.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19, React Compiler) |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 16 (via Docker) |
| ORM | Prisma 7 |
| Audio | Web Audio API, wav-decoder, Meyda |
| Charts | Recharts |
| Icons | Lucide React |
| Package Manager | pnpm |

## Features

- **Three evolutionary algorithms** — GA (tournament selection + BLX-α crossover), PSO (inertia-weighted), DE (rand/1/bin)
- **Real-time dashboard** — live generation counter, best/average fitness, elapsed time
- **Convergence chart** — interactive Recharts plot of fitness over generations
- **Audio comparison player** — listen to original vs. best reconstruction at each snapshot
- **Microphone recording** — record audio directly in the browser
- **Full experiment report** — dedicated page with detailed fitness metrics (Euclidean, cosine, correlation, MSE, MAE)
- **Persistent storage** — all experiments, generation logs, and audio snapshots saved to PostgreSQL

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/       # POST — upload .wav, create experiment
│   │   ├── evolve/       # POST — run evolution loop
│   │   └── experiment/   # GET  — fetch experiment data
│   ├── report/           # Full experiment report page
│   ├── layout.js         # Root layout (Vazirmatn font, RTL)
│   └── page.js           # Main dashboard
├── components/
│   ├── EvolutionDashboard.jsx   # Main UI controller
│   ├── ConvergenceChart.jsx     # Fitness chart
│   ├── AudioPlayer.jsx          # Snapshot audio player
│   ├── AudioRecorder.jsx        # Microphone recorder
│   ├── AudioUploader.jsx        # File upload component
│   └── CustomSelect.jsx         # Styled select dropdown
├── lib/
│   ├── audio/
│   │   ├── processor.js    # WAV parsing, resampling, feature extraction
│   │   └── synthesizer.js  # Chromosome → audio reconstruction
│   ├── evolution/
│   │   ├── base.js         # Shared utilities (population, fitness, selection)
│   │   ├── ga.js           # Genetic Algorithm
│   │   ├── pso.js          # Particle Swarm Optimization
│   │   ├── de.js           # Differential Evolution
│   │   └── index.js        # Algorithm factory
│   ├── utils/
│   │   └── fitness.js      # Distance metrics (Euclidean, cosine, correlation, etc.)
│   └── prisma.js           # Prisma client singleton
└── prisma/
    └── schema.prisma       # Database schema
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [pnpm](https://pnpm.io/) ≥ 8
- [Docker](https://www.docker.com/) (for PostgreSQL)

### 1. Clone & Install

```bash
git clone <repo-url>
cd voice-ai
pnpm install
```

### 2. Start the Database

```bash
docker compose up -d
```

This starts PostgreSQL 16 on port `5434` with the credentials defined in `docker-compose.yml`.

### 3. Configure Environment

Create a `.env` file:

```env
DATABASE_URL="postgresql://voice_user:voice_pass@localhost:5434/voice_ai"
```

### 4. Run Migrations

```bash
pnpm prisma migrate deploy
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm prisma migrate deploy` | Apply database migrations |
| `pnpm prisma studio` | Open Prisma Studio (database GUI) |

## How It Works

1. **Upload/Record** — User provides a `.wav` audio file or records via microphone
2. **Feature Extraction** — Audio is resampled to 44.1 kHz and downsampled to a 512-gene chromosome representing the waveform
3. **Evolution** — The selected algorithm evolves a population of chromosomes, using cosine similarity as the primary fitness function
4. **Logging** — Each generation's best and average fitness are stored in the database
5. **Snapshots** — Periodically, the best chromosome is synthesized back to audio for comparison
6. **Convergence** — The dashboard plots fitness over time, showing how the algorithm approaches the target signal

## Database Schema

```
Experiment        → id, name, algorithm, mutationRate, crossoverRate, populationSize, status, bestFitness, ...
  ├── GenerationLog   → generation, bestFitness, avgFitness, elapsedMs
  └── AudioSnapshot   → generation, filePath, isOriginal
```

## License

MIT
