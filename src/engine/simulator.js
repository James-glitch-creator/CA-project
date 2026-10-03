import {
  CLOCK_HZ, CYCLE_COST, INSTR_BYTES, createInitialMemory, createInitialRegisters, instructionIndex
} from "./constants.js";
import { parseProgram, executeInstruction, encodeInstruction } from "./instructions.js";

export function createSimulatorState(programText) {
  let program = [];
  let status = { type: "info", message: "Load a program and press Step or Run to begin." };
  try {
    program = parseProgram(programText);
  } catch (e) {
    status = { type: "error", message: e.message };
  }

  return {
    programText,
    program,
    registers: createInitialRegisters(),
    memory: createInitialMemory(),
    phase: "fetch", // fetch | decode | execute | halted
    activeOp: null,
    fetchedIndex: null,
    hasFetched: false,
    mdrKind: null,
    flags: { zero: false, carry: false, overflow: false, negative: false },
    lastAlu: null,
    lastMemoryAccess: null,
    cycles: 0,
    instructionsExecuted: 0,
    log: [],
    status,
    running: false
  };
}

// Advances the CPU by exactly one micro-step (one phase). Pure: returns a new state object.
export function stepSimulator(state, options = {}) {
  if (state.phase === "halted" || state.status.type === "error") return state;

  if (state.phase === "idle") {
    if (state.program.length === 0) {
      return { ...state, phase: "halted", status: { type: "error", message: "No valid instructions loaded." } };
    }
    return { ...state, phase: "fetch", status: { type: "info", message: "Ready to fetch first instruction." } };
  }

  if (state.phase === "fetch") {
    const pc = state.registers.PC;
    const index = instructionIndex(pc);
    if (index === state.program.length) {
      return { ...state, phase: "halted", running: false, status: { type: "success", message: "Execution completed successfully." } };
    }
    if (index < 0 || index > state.program.length) {
      return { ...state, phase: "halted", running: false, status: { type: "error", message: `Invalid PC address 0x${pc.toString(16).toUpperCase()}.` } };
    }
    const instr = state.program[index];
    const instructionWord = encodeInstruction(instr);
    const registers = { ...state.registers, MAR: pc, IR: instructionWord, MDR: instructionWord, PC: pc + INSTR_BYTES };
    return {
      ...state,
      registers,
      phase: "decode",
      activeOp: instr.op,
      fetchedIndex: index,
      hasFetched: true,
      mdrKind: "instruction",
      lastMemoryAccess: null,
      cycles: state.cycles + CYCLE_COST.FETCH,
      status: { type: "info", message: `Fetch: PC=${pc} → IR = "${instr.raw}"` }
    };
  }

  if (state.phase === "decode") {
    const instr = state.program[state.fetchedIndex];
    return {
      ...state,
      phase: "execute",
      cycles: state.cycles + CYCLE_COST.DECODE,
      status: { type: "info", message: `Decode: opcode = ${instr.op}` }
    };
  }

  // execute
  const instr = state.program[state.fetchedIndex];
  const registers = { ...state.registers };
  const memory = [...state.memory];
  const result = executeInstruction(instr, registers, memory, { memoryValue: options.memoryValue });
  const { details, changed } = result;
  const executeCost = instr.op === "LOAD" || instr.op === "STORE"
    ? options.cacheOutcome === "Hit" ? CYCLE_COST.EXECUTE_MEM_HIT : CYCLE_COST.EXECUTE_MEM_MISS
    : CYCLE_COST.EXECUTE_ALU;

  const logEntry = {
    step: state.instructionsExecuted + 1,
    pc: state.fetchedIndex,
    cycles: CYCLE_COST.FETCH + CYCLE_COST.DECODE + executeCost,
    instruction: instr.raw,
    details,
    changed: changed.join(", ") || "-"
  };

  const halted = instr.op === "HALT";
  return {
    ...state,
    registers,
    memory,
    flags: result.flags ?? state.flags,
    lastAlu: result.alu,
    lastMemoryAccess: result.memoryAccess ? { ...result.memoryAccess, outcome: options.cacheOutcome ?? null } : null,
    mdrKind: result.memoryAccess ? "data" : state.mdrKind,
    phase: halted ? "halted" : "fetch",
    activeOp: halted ? instr.op : null,
    fetchedIndex: halted ? state.fetchedIndex : null,
    cycles: state.cycles + executeCost,
    instructionsExecuted: state.instructionsExecuted + 1,
    log: [...state.log, logEntry],
    running: halted ? false : state.running,
    status: halted
      ? { type: "success", message: "Execution completed successfully." }
      : { type: "info", message: `Execute: ${details}` }
  };
}

export function computeStats(state) {
  const { cycles, instructionsExecuted } = state;
  const cpi = instructionsExecuted > 0 ? cycles / instructionsExecuted : 0;
  const executionTimeSeconds = cycles / CLOCK_HZ;
  const mips = executionTimeSeconds > 0 ? (instructionsExecuted / executionTimeSeconds) / 1_000_000 : 0;
  return { cycles, instructionsExecuted, cpi, executionTimeSeconds, mips, clockHz: CLOCK_HZ };
}

export const CPU_PHASES = ["fetch", "decode", "execute"];
