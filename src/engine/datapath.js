// Derives the control-unit signals and ALU operand/result view for the
// instruction currently in the pipeline, straight from the parsed program +
// live registers. Shared by the Home "Architecture Overview" diagram and the
// CPU Simulator page so both read the same real state, nothing hard-coded.
export function deriveDatapath(cpu) {
  const instr = cpu.fetchedIndex != null ? cpu.program[cpu.fetchedIndex] : null;
  const control = { RegWrite: 0, ALUSrc: 0, MemRead: 0, MemWrite: 0 };
  let aluOp = "-", aText = "--", bText = "--", destReg = null;

  if (instr && cpu.phase !== "fetch" && cpu.phase !== "idle") {
    const { op, args } = instr;

    if (op === "LOAD") {
      control.RegWrite = 1; control.MemRead = 1; control.ALUSrc = 1;
      aluOp = "PASS_ADDR"; bText = `${args[1].value} (Addr)`; destReg = args[0].name;
    } else if (op === "STORE") {
      control.MemWrite = 1; control.ALUSrc = 1;
      aluOp = "PASS_ADDR"; bText = `${args[1].value} (Addr)`; aText = args[0].name;
    } else if (op === "MOV") {
      control.RegWrite = 1;
      const src = args[1];
      control.ALUSrc = src.type === "imm" ? 1 : 0;
      aluOp = "PASS_B";
      bText = src.type === "imm" ? `${src.value} (Imm)` : src.name;
      destReg = args[0].name;
    } else if (op === "NOT") {
      control.RegWrite = 1; aluOp = "NOT";
      const rs = args[1] || args[0];
      aText = rs.type === "reg" ? rs.name : rs.value;
      destReg = args[0].name;
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
      } else {
        aText = rest[0].type === "reg" ? rest[0].name : `${rest[0].value} (Imm)`;
        bText = rest[1].type === "reg" ? rest[1].name : `${rest[1].value} (Imm)`;
        control.ALUSrc = rest[1].type !== "reg" ? 1 : 0;
      }
    }
  }

  let outText = "--";
  if (cpu.phase === "execute" && destReg) {
    outText = cpu.registers[destReg];
  }

  return { control, alu: { op: aluOp, a: aText, b: bText, out: outText }, destReg };
}
