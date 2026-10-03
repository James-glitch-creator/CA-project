// Real bitwise/arithmetic ALU — every result is computed from the given operands, nothing static.
export const ALU_OPS = ["ADD", "SUB", "AND", "OR", "XOR", "NOT"];

export function aluCompute(op, a, b) {
  const x = Number(a) & 0xff;
  const y = Number(b) & 0xff;
  let raw;

  switch (op) {
    case "ADD": raw = x + y; break;
    case "SUB": raw = x - y; break;
    case "AND": raw = x & y; break;
    case "OR": raw = x | y; break;
    case "XOR": raw = x ^ y; break;
    case "NOT": raw = ~x; break;
    default: raw = 0;
  }

  const result = raw & 0xff;
  const signed = value => (value & 0x80 ? value - 0x100 : value);
  const carry = op === "ADD" ? raw > 0xff : op === "SUB" ? x < y : false;
  const signedRaw = op === "ADD" ? signed(x) + signed(y) : op === "SUB" ? signed(x) - signed(y) : 0;
  const overflow = (op === "ADD" || op === "SUB") && (signedRaw > 127 || signedRaw < -128);

  return {
    raw,
    result,
    decimal: result,
    binary: result.toString(2).padStart(8, "0"),
    hex: result.toString(16).toUpperCase().padStart(2, "0"),
    overflow,
    flags: { zero: result === 0, carry, overflow, negative: Boolean(result & 0x80) }
  };
}
