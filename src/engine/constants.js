export const REGISTER_NAMES = ["R0", "R1", "R2", "R3"];
export const MEMORY_SIZE = 256;
export const CLOCK_HZ = 1_000_000_000; // assumed 1 GHz clock for MIPS/exec-time math

export const CYCLE_COST = {
  FETCH: 1,
  DECODE: 1,
  EXECUTE_ALU: 1,
  EXECUTE_MEM: 2, // LOAD / STORE hit main memory, costs one extra cycle
  EXECUTE_CTRL: 1
};

export const SAMPLE_PROGRAM = [
  "LOAD R1, 100",
  "LOAD R2, 101",
  "ADD R1, R2",
  "STORE R3, 102",
  "HALT"
].join("\n");

export function createInitialMemory() {
  const mem = new Array(MEMORY_SIZE).fill(0);
  // small demo payload so the memory table isn't all zeros on first load
  mem[0] = 5;
  mem[1] = 10;
  mem[2] = 20;
  mem[3] = 0;
  mem[4] = 1;
  mem[100] = 10; // 0x0A
  mem[101] = 20; // 0x14
  mem[102] = 0;
  mem[103] = 0;
  return mem;
}

export function createInitialRegisters() {
  return { R0: 0, R1: 0, R2: 0, R3: 0, PC: 0, IR: 0, MAR: 0, MDR: 0 };
}

export function toHex(value, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) return String(value ?? "-");
  return (value & 0xff).toString(16).toUpperCase().padStart(digits, "0");
}

// Instructions are shown at synthetic word-aligned addresses (0x00400000-based,
// +4 per instruction) purely for display — the engine itself indexes the
// parsed program array by position, this just formats that index like a
// real text-segment address so PC/IR/MAR and the memory listing agree.
export const INSTR_BASE_ADDR = 0x00400000;

export function formatInstrAddr(index) {
  const addr = (INSTR_BASE_ADDR + (index ?? 0) * 4) >>> 0;
  return "0x" + addr.toString(16).toUpperCase().padStart(8, "0");
}
