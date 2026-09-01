import { CLOCK_HZ, CYCLE_COST, createInitialMemory, createInitialRegisters } from "./constants";
import { parseProgram, executeInstruction, executeCycles } from "./instructions";

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
    phase: "idle", // idle | fetch | decode | execute | halted
    activeOp: null,
    fetchedIndex: null,
    cycles: 0,
    instructionsExecuted: 0,
    log: [],
    status,
    running: false
  };
}

// Advances the CPU by exactly one micro-step (one phase). Pure: returns a new state object.
export function stepSimulator(state) {
  if (state.phase === "halted" || state.status.type === "error") return state;

  if (state.phase === "idle") {
    if (state.program.length === 0) {
      return { ...state, phase: "halted", status: { type: "error", message: "No valid instructions loaded." } };
    }
    return { ...state, phase: "fetch", status: { type: "info", message: "Ready to fetch first instruction." } };
  }

  if (state.phase === "fetch") {
    const pc = state.registers.PC;
    if (pc >= state.program.length) {
      return { ...state, phase: "halted", status: { type: "success", message: "Execution completed successfully." } };
    }
    const instr = state.program[pc];
    const registers = { ...state.registers, MAR: pc, IR: instr.raw, MDR: pc, PC: pc + 1 };
    return {
      ...state,
      registers,
      phase: "decode",
      activeOp: instr.op,
      fetchedIndex: pc,
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
  const { details, changed } = executeInstruction(instr, registers, memory);

  const logEntry = {
    step: state.instructionsExecuted + 1,
    pc: state.fetchedIndex,
    cycles: executeCycles(instr.op),
    instruction: instr.raw,
    details,
    changed: changed.join(", ") || "-"
  };

  const halted = instr.op === "HALT";
  const nextHasMore = registers.PC < state.program.length;

  return {
    ...state,
    registers,
    memory,
    phase: halted ? "halted" : "fetch",
    activeOp: instr.op,
    cycles: state.cycles + executeCycles(instr.op),
    instructionsExecuted: state.instructionsExecuted + 1,
    log: [...state.log, logEntry],
    running: halted ? false : state.running,
    status: halted
      ? { type: "success", message: "Execution completed successfully." }
      : nextHasMore
        ? { type: "info", message: `Execute: ${details}` }
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
