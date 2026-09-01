const ALU_OPS = new Set(["ADD", "SUB", "AND", "OR", "XOR", "MOV", "NOT"]);

// Maps the current CPU phase (+ opcode being executed) to the diagram components
// that should be visually highlighted, so the picture reflects real execution state.
export function getActiveComponents(phase, op) {
  if (phase === "fetch") {
    return new Set(["PC", "MAR", "ADDRESS_BUS", "MEMORY", "DATA_BUS", "MDR", "IR"]);
  }
  if (phase === "decode") {
    return new Set(["IR", "CONTROL_UNIT"]);
  }
  if (phase === "execute") {
    if (op === "LOAD") {
      return new Set(["CONTROL_UNIT", "MAR", "ADDRESS_BUS", "MEMORY", "DATA_BUS", "MDR", "REGISTERS"]);
    }
    if (op === "STORE") {
      return new Set(["CONTROL_UNIT", "REGISTERS", "MDR", "DATA_BUS", "MEMORY", "MAR", "ADDRESS_BUS"]);
    }
    if (ALU_OPS.has(op)) {
      return new Set(["CONTROL_UNIT", "ALU", "REGISTERS"]);
    }
    return new Set(["CONTROL_UNIT"]);
  }
  return new Set();
}
