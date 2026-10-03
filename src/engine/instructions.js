import { aluCompute } from "./alu.js";

const OPS_2_OR_3 = ["ADD", "SUB", "AND", "OR", "XOR"];
const KNOWN_OPS = ["LOAD", "STORE", "MOV", "NOT", "NOP", "HALT", ...OPS_2_OR_3];
const OPCODES = { NOP: 0x00, LOAD: 0x10, STORE: 0x11, MOV: 0x20, ADD: 0x30, SUB: 0x31, AND: 0x32, OR: 0x33, XOR: 0x34, NOT: 0x35, HALT: 0xff };

function parseOperand(token) {
  const t = token.trim();
  if (/^R[0-3]$/i.test(t)) return { type: "reg", name: t.toUpperCase() };
  if (/^#-?\d+$/.test(t)) return { type: "imm", value: parseInt(t.slice(1), 10) };
  if (/^0x[0-9a-f]+$/i.test(t)) return { type: "addr", value: parseInt(t, 16) };
  if (/^-?\d+$/.test(t)) return { type: "addr", value: parseInt(t, 10) };
  throw new Error(`Invalid operand "${token}"`);
}

function isValueOperand(operand) {
  return operand && (operand.type === "reg" || operand.type === "imm");
}

function validDataAddress(operand) {
  return operand?.type === "addr" && operand.value >= 0 && operand.value < 256;
}

// Parses free-form assembly text into a list of { raw, line, op, args } instructions.
// Throws a descriptive Error naming the offending line on invalid syntax.
export function parseProgram(text) {
  const lines = text
    .split("\n")
    .map(l => l.replace(/;.*$/, "").replace(/\/\/.*$/, "").trim())
    .map((l, idx) => ({ l, idx }))
    .filter(({ l }) => l.length > 0);

  return lines.map(({ l, idx }) => {
    const match = l.match(/^([A-Za-z]+)\s*(.*)$/);
    if (!match) throw new Error(`Line ${idx + 1}: could not parse "${l}"`);

    const op = match[1].toUpperCase();
    if (!KNOWN_OPS.includes(op)) {
      throw new Error(`Line ${idx + 1}: unknown instruction "${op}"`);
    }

    const argsStr = match[2].trim();
    if (argsStr.endsWith(",")) throw new Error(`Line ${idx + 1}: trailing comma`);
    const rawArgs = argsStr.length ? argsStr.split(",").map(a => a.trim()) : [];
    if (rawArgs.some(arg => arg.length === 0)) throw new Error(`Line ${idx + 1}: missing operand`);
    const args = rawArgs;

    let operands;
    try {
      operands = args.map(parseOperand);
    } catch (e) {
      throw new Error(`Line ${idx + 1}: ${e.message}`);
    }

    if (op === "HALT" || op === "NOP") {
      if (operands.length !== 0) throw new Error(`Line ${idx + 1}: ${op} takes no operands`);
    } else if (op === "LOAD" || op === "STORE") {
      if (operands.length !== 2 || operands[0].type !== "reg" || !validDataAddress(operands[1])) {
        throw new Error(`Line ${idx + 1}: ${op} needs "Rd, address"`);
      }
    } else if (op === "MOV") {
      if (operands.length !== 2 || operands[0].type !== "reg" || !isValueOperand(operands[1])) {
        throw new Error(`Line ${idx + 1}: MOV needs "Rd, Rs" or "Rd, #imm"`);
      }
    } else if (op === "NOT") {
      if ((operands.length !== 1 && operands.length !== 2) ||
          operands[0].type !== "reg" || (operands[1] && operands[1].type !== "reg")) {
        throw new Error(`Line ${idx + 1}: NOT needs "Rd" or "Rd, Rs"`);
      }
    } else if (OPS_2_OR_3.includes(op)) {
      if ((operands.length !== 2 && operands.length !== 3) || operands[0].type !== "reg" ||
          operands.slice(1).some(operand => !isValueOperand(operand))) {
        throw new Error(`Line ${idx + 1}: ${op} needs register or #immediate sources`);
      }
    }

    operands.filter(operand => operand.type === "imm").forEach(operand => {
      if (operand.value < -128 || operand.value > 255) {
        throw new Error(`Line ${idx + 1}: immediate must be between -128 and 255`);
      }
    });

    return { raw: l, line: idx + 1, op, args: operands };
  });
}

function readValue(operand, registers) {
  if (operand.type === "reg") return registers[operand.name] & 0xff;
  return operand.value & 0xff;
}

// Executes one decoded instruction against registers/memory (mutating clones passed in).
// Returns a human-readable detail string and the list of changed register/memory names.
export function executeInstruction(instr, registers, memory, options = {}) {
  const { op, args } = instr;
  const changed = [];
  let details = "";
  let flags = null;
  let alu = null;
  let memoryAccess = null;

  switch (op) {
    case "LOAD": {
      const [rd, addr] = args;
      const value = options.memoryValue ?? memory[addr.value] ?? 0;
      registers.MAR = addr.value;
      registers.MDR = value & 0xff;
      registers[rd.name] = value & 0xff;
      changed.push("MAR", "MDR", rd.name);
      memoryAccess = { type: "read", address: addr.value, value: value & 0xff };
      details = `${rd.name} ← M[${addr.value}] (${value})`;
      break;
    }
    case "STORE": {
      const [rd, addr] = args;
      const value = registers[rd.name] & 0xff;
      registers.MAR = addr.value;
      registers.MDR = value;
      memory[addr.value] = value;
      changed.push("MAR", "MDR", `M[${addr.value}]`);
      memoryAccess = { type: "write", address: addr.value, value };
      details = `M[${addr.value}] ← ${rd.name} (${value})`;
      break;
    }
    case "MOV": {
      const [rd, src] = args;
      const value = readValue(src, registers);
      registers[rd.name] = value;
      changed.push(rd.name);
      details = `${rd.name} ← ${value}`;
      break;
    }
    case "NOT": {
      const [rd, rs] = args;
      const source = rs ? readValue(rs, registers) : registers[rd.name];
      alu = aluCompute("NOT", source, 0);
      const result = alu.result;
      registers[rd.name] = result;
      flags = alu.flags;
      changed.push(rd.name);
      details = `${rd.name} ← NOT ${source} (${result})`;
      break;
    }
    case "NOP": {
      details = "No operation";
      break;
    }
    case "HALT": {
      details = "Program End";
      break;
    }
    default: {
      // ADD / SUB / AND / OR / XOR, 2- or 3-operand form
      const [rd, ...rest] = args;
      let a, b;
      if (rest.length === 1) {
        a = registers[rd.name] & 0xff;
        b = readValue(rest[0], registers);
      } else {
        a = readValue(rest[0], registers);
        b = readValue(rest[1], registers);
      }
      alu = aluCompute(op, a, b);
      const result = alu.result;
      registers[rd.name] = result;
      flags = alu.flags;
      changed.push(rd.name);
      details = `${rd.name} ← ${a} ${op} ${b} = ${result}`;
      break;
    }
  }

  return { details, changed, flags, alu, memoryAccess };
}

// Compact 32-bit teaching encoding: opcode | operand 1 | operand 2 | operand 3.
// Registers use 0..3 and immediates/addresses use their low eight bits.
export function encodeInstruction(instruction) {
  const bytes = instruction.args.slice(0, 3).map(operand =>
    operand.type === "reg" ? Number(operand.name.slice(1)) : operand.value & 0xff
  );
  while (bytes.length < 3) bytes.push(0);
  return (((OPCODES[instruction.op] << 24) | (bytes[0] << 16) | (bytes[1] << 8) | bytes[2]) >>> 0);
}

const OP_WORDS = { ADD: "plus", SUB: "minus", AND: "AND", OR: "OR", XOR: "XOR" };

function operandText(operand) {
  if (operand.type === "reg") return operand.name;
  if (operand.type === "imm") return `#${operand.value}`;
  return `address ${operand.value}`;
}

// One human-readable sentence for whatever instruction is currently in the
// pipeline — used by the Instruction Execution page's "current instruction" panel.
export function describeInstruction(instr) {
  if (!instr) return "";
  const { op, args } = instr;

  switch (op) {
    case "LOAD": {
      const [rd, addr] = args;
      return `Load ${rd.name} from memory address ${addr.value}.`;
    }
    case "STORE": {
      const [rd, addr] = args;
      return `Store ${rd.name} into memory address ${addr.value}.`;
    }
    case "MOV": {
      const [rd, src] = args;
      return `Move ${operandText(src)} into ${rd.name}.`;
    }
    case "NOT": {
      const [rd, rs] = args;
      return `Store the bitwise complement of ${rs ? operandText(rs) : rd.name} into ${rd.name}.`;
    }
    case "NOP":
      return "No operation performed this cycle.";
    case "HALT":
      return "Halt execution — program end.";
    default: {
      const [rd, ...rest] = args;
      if (rest.length === 1) {
        return `Compute ${rd.name} = ${rd.name} ${OP_WORDS[op] ?? op} ${operandText(rest[0])}, store in ${rd.name}.`;
      }
      return `Compute ${rd.name} = ${operandText(rest[0])} ${OP_WORDS[op] ?? op} ${operandText(rest[1])}.`;
    }
  }
}
