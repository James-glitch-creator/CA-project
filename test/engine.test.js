import test from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_PROGRAM, INSTR_BASE_ADDR } from "../src/engine/constants.js";
import { aluCompute } from "../src/engine/alu.js";
import { parseProgram, encodeInstruction } from "../src/engine/instructions.js";
import { createMachineState, stepMachine } from "../src/engine/machine.js";

function run(program = SAMPLE_PROGRAM, limit = 100) {
  let machine = createMachineState(program);
  for (let step = 0; step < limit && machine.cpu.phase !== "halted"; step++) {
    machine = stepMachine(machine);
  }
  return machine;
}

test("sample program adds 10 + 20 and stores 30", () => {
  const { cpu, cache } = run();
  assert.equal(cpu.status.type, "success");
  assert.equal(cpu.registers.R3, 30);
  assert.equal(cpu.memory[102], 30);
  assert.equal(cache.cpuAccesses, 3);
});

test("PC is word addressed and fetch transfers the instruction through MDR to IR", () => {
  let machine = createMachineState("NOP\nHALT");
  machine = stepMachine(machine); // fetch
  assert.equal(machine.cpu.registers.PC, INSTR_BASE_ADDR + 4);
  assert.equal(machine.cpu.registers.MAR, INSTR_BASE_ADDR);
  const nopWord = encodeInstruction(parseProgram("NOP")[0]);
  assert.equal(machine.cpu.registers.MDR, nopWord);
  assert.equal(machine.cpu.registers.IR, nopWord);
});

test("LOAD updates MAR/MDR and repeated access hits the CPU cache", () => {
  let machine = createMachineState("LOAD R1, 100\nLOAD R2, 100\nHALT");
  for (let step = 0; step < 6; step++) machine = stepMachine(machine);
  const { cpu, cache } = machine;
  assert.equal(cpu.registers.R1, 10);
  assert.equal(cpu.registers.R2, 10);
  assert.equal(cpu.registers.MAR, 100);
  assert.equal(cpu.registers.MDR, 10);
  assert.equal(cache.cpuMisses, 1);
  assert.equal(cache.cpuHits, 1);
});

test("write-through/write-allocate keeps cache and memory coherent", () => {
  const { cpu, cache } = run("MOV R1, #77\nSTORE R1, 100\nLOAD R2, 100\nHALT");
  assert.equal(cpu.memory[100], 77);
  assert.equal(cpu.registers.R2, 77);
  assert.equal(cache.cpuMisses, 1);
  assert.equal(cache.cpuHits, 1);
});

test("ALU exposes 8-bit zero, carry, signed overflow, and negative flags", () => {
  assert.deepEqual(aluCompute("ADD", 255, 1).flags, {
    zero: true, carry: true, overflow: false, negative: false
  });
  assert.equal(aluCompute("ADD", 127, 1).flags.overflow, true);
  assert.equal(aluCompute("SUB", 0, 1).flags.negative, true);
});

test("parser rejects malformed or architecturally invalid operands", () => {
  for (const source of ["LOAD R1, R2", "MOV R1", "MOV R1, 100", "NOT R1, R2, R3", "LOAD R1, 256", "HALT R1"]) {
    assert.throws(() => parseProgram(source), Error, source);
  }
});

test("misses cost more cycles than hits", () => {
  const missOnly = run("LOAD R1, 100\nHALT");
  const missAndHit = run("LOAD R1, 100\nLOAD R2, 100\nHALT");
  const firstLoadCycles = missOnly.cpu.log[0].cycles;
  const secondLoadCycles = missAndHit.cpu.log[1].cycles;
  assert.ok(firstLoadCycles > secondLoadCycles);
});
