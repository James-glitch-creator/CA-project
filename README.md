# Computer Architecture Simulator (ARCH-LAB)

A full-stack educational tool for visualizing CPU internals: fetch-decode-
execute cycle, ALU, registers, main memory, cache simulator and performance
analysis.

- **Frontend:** React 18 + Vite (client-side simulator engine — the CPU/ALU/
  cache logic runs entirely in the browser for instant, offline stepping;
  single fixed dark theme, no theme switcher)
- **Backend:** Node.js + Express REST API — open, no accounts/login
- **Database:** MySQL — a shared public library of saved assembly programs,
  cache-config presets and Performance Analysis reports

```
├─ src/            React frontend (this folder's package.json)
│  ├─ engine/       pure-JS CPU/ALU/cache simulator (no backend needed to run it)
│  ├─ pages/        one component per sidebar page, matching the mockups
│  ├─ context/      SimulatorContext (engine state)
│  └─ api/client.js fetch wrapper for the backend
└─ server/          Express + MySQL API (server/package.json)
   ├─ routes/        programs, runs, cache-configs
   └─ schema.sql     MySQL schema
```

## Run it

### 1. Database

```bash
mysql -u root -p < server/schema.sql
```

### 2. Backend

```bash
cd server
cp .env.example .env      # set DB_* credentials
npm install
npm run seed                # optional: adds one sample saved program
npm run dev                  # http://localhost:4000
```

### 3. Frontend

```bash
cp .env.example .env        # VITE_API_URL, defaults to http://localhost:4000/api
npm install
npm run dev                  # http://localhost:5173
```

The app works fully **without** the backend running — every simulator page
(CPU, ALU, Registers, Memory, Cache, Instruction Execution, Performance
Analysis) is driven by the in-browser engine. The backend only adds
persistence: saving/loading assembly programs on the Instruction Execution
page and exporting/saving reports on the Performance Analysis page. There is
no login — every visitor shares the same public library.

## Pages

- **Home** — architecture overview: control unit, register file, ALU, main
  memory, current pipeline stage
- **CPU Simulator** — fetch/decode/execute datapath with PC/IR/MAR/MDR, L1
  cache status, main memory
- **ALU Simulator** — pick an opcode, inspect operands/result and status
  flags (Z/C/V) with a bit-level trace
- **Registers** — register bank (R0–R3, PC, IR, MAR, MDR) with a detailed
  state trace
- **Memory** — full memory inspector (hex/dec/binary) with a memory map and
  address navigation
- **Cache Simulator** — direct-mapped / associative cache with hit/miss
  stats and the cache array
- **Instruction Execution** — assembly editor, step/run/reset, execution
  history, and save/load programs from MySQL
- **Performance Analysis** — cycles, CPI, MIPS, cache ratios, charts, and
  save/list reports from MySQL
- **About** — project description

## API

See [server/README.md](server/README.md) for the full route list and schema.
