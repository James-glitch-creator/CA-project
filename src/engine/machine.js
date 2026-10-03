import { createSimulatorState, stepSimulator } from "./simulator.js";
import { cacheAccess, createCacheState } from "./cache.js";

export const DEFAULT_CACHE_CONFIG = { cacheSize: 16, blockSize: 4, mapping: "Direct" };

export function createMachineState(programText, cacheConfig = DEFAULT_CACHE_CONFIG) {
  const cpu = createSimulatorState(programText);
  return { cpu, cache: createCacheState(cacheConfig, cpu.memory) };
}

export function stepMachine(machine) {
  const { cpu } = machine;
  if (cpu.phase !== "execute") return { ...machine, cpu: stepSimulator(cpu) };

  const instruction = cpu.program[cpu.fetchedIndex];
  if (!instruction || (instruction.op !== "LOAD" && instruction.op !== "STORE")) {
    return { ...machine, cpu: stepSimulator(cpu) };
  }

  const address = instruction.args[1].value;
  const isWrite = instruction.op === "STORE";
  const value = isWrite ? cpu.registers[instruction.args[0].name] : undefined;
  const cache = cacheAccess(machine.cache, address, cpu.memory, {
    source: "cpu",
    type: isWrite ? "write" : "read",
    value
  });
  const cpuNext = stepSimulator(cpu, {
    cacheOutcome: cache.lastResult.outcome,
    memoryValue: isWrite ? undefined : cache.lastResult.value
  });

  return { cpu: cpuNext, cache };
}
