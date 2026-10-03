// Derives the control-unit signals and ALU operand/result view for the
// instruction currently in the pipeline, straight from the parsed program +
// live registers. Shared by the Home "Architecture Overview" diagram and the
// Instruction Execution page so both read the same real state, nothing hard-coded.
export function deriveDatapath(cpu) {
  const instr = cpu.fetchedIndex != null ? cpu.program[cpu.fetchedIndex] : null;
  const control = { RegWrite: 0, ALUSrc: 0, MemRead: 0, MemWrite: 0 };
  let aluOp = "-", aText = "--", bText = "--", destReg = null, computedOutput = "--";
  const valueOf = operand => operand.type === "reg" ? cpu.registers[operand.name] & 0xff : operand.value & 0xff;

  if (instr && cpu.phase !== "fetch" && cpu.phase !== "idle") {
    const { op, args } = instr;

    if (op === "LOAD") {
      control.RegWrite = 1; control.MemRead = 1; control.ALUSrc = 1;
      aluOp = "PASS_ADDR"; bText = `${args[1].value} (Addr)`; destReg = args[0].name;
      computedOutput = cpu.memory[args[1].value] ?? 0;
    } else if (op === "STORE") {
      control.MemWrite = 1; control.ALUSrc = 1;
      aluOp = "PASS_ADDR"; bText = `${args[1].value} (Addr)`; aText = args[0].name;
      computedOutput = cpu.registers[args[0].name] & 0xff;
    } else if (op === "MOV") {
      control.RegWrite = 1;
      const src = args[1];
      control.ALUSrc = src.type === "imm" ? 1 : 0;
      aluOp = "PASS_B";
      bText = src.type === "imm" ? `${src.value} (Imm)` : src.name;
      destReg = args[0].name;
      computedOutput = valueOf(src);
    } else if (op === "NOT") {
      control.RegWrite = 1; aluOp = "NOT";
      const rs = args[1] || args[0];
      aText = rs.type === "reg" ? rs.name : rs.value;
      destReg = args[0].name;
      computedOutput = aluCompute("NOT", valueOf(rs), 0).result;
    } else if (op === "NOP" || op === "HALT") {
      aluOp = op;
    } else {
      control.RegWrite = 1; aluOp = op;
      const [rd, ...rest] = args;
      destReg = rd.name;
      if (rest.length === 1) {
        aText = rd.name;
        bText = rest[0].type === "reg" ? rest[0].name : `${rest[0].value} (Imm)`;
        control.ALUSrc = rest[0].type !== "reg" ? 1 : 0;
        computedOutput = aluCompute(op, cpu.registers[rd.name], valueOf(rest[0])).result;
      } else {
        aText = rest[0].type === "reg" ? rest[0].name : `${rest[0].value} (Imm)`;
        bText = rest[1].type === "reg" ? rest[1].name : `${rest[1].value} (Imm)`;
        control.ALUSrc = rest[1].type !== "reg" ? 1 : 0;
        computedOutput = aluCompute(op, valueOf(rest[0]), valueOf(rest[1])).result;
      }
    }
  }

  let outText = "--";
  if (cpu.phase === "execute" && destReg) {
    outText = computedOutput;
  }

  return { control, alu: { op: aluOp, a: aText, b: bText, out: outText }, destReg };
}
import { aluCompute } from "./alu.js";
