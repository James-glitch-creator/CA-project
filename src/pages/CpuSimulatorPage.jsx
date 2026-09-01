import { useSimulator } from "../context/SimulatorContext";
import { toHex, formatInstrAddr } from "../engine/constants";
import { deriveDatapath } from "../engine/datapath";
import ActionBar from "../components/ActionBar";
import Icon from "../components/Icons";

export default function CpuSimulatorPage() {
  const { cpu, cache, step, run, pause, reset, clockSpeedMs, setClockSpeed } = useSimulator();
  const { registers, phase, program, fetchedIndex } = cpu;
  const { alu } = deriveDatapath(cpu);

  const startIdx = Math.max(0, (fetchedIndex ?? 0) - 1);
  const around = program.slice(startIdx, startIdx + 4);

  const l1 = cache.lastResult;

  return (
    <section className="cpu-console">
      <div className="panel cpu-cell cpu-pc">
        <p className="console-label small">Program Counter (PC)</p>
        <p className="alu-value">{formatInstrAddr(registers.PC)}</p>
      </div>

      <div className="panel cpu-cell cpu-control">
        <p className="console-label small">Control Unit</p>
        <p className="cpu-state-label">STATE:</p>
        <span className={`phase-pill ${phase}`}>{phase.toUpperCase()}</span>
      </div>

      <div className="panel cpu-cell cpu-l1cache">
        <div className="panel-title">
          <p className="console-label small">L1 Cache</p>
          <span className={`cache-hit-indicator ${l1 ? (l1.outcome === "Hit" ? "hit" : "miss") : ""}`}>
            <i /> {l1 ? l1.outcome.toUpperCase() : "—"}
          </span>
        </div>
        <table className="arch-mem-table">
          <thead><tr><th>Tag</th><th>Data</th></tr></thead>
          <tbody>
            {l1 ? (
              <tr>
                <td className="mono-cell">0x{l1.tag.toString(16).toUpperCase()}</td>
                <td className="mono-cell">{l1.outcome === "Hit" ? "cached" : "loaded"}</td>
              </tr>
            ) : (
              <tr><td colSpan={2} className="empty-cell">Access via Cache Simulator</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="panel cpu-cell cpu-ir">
        <p className="console-label small">Instruction Reg (IR)</p>
        <p className="mono-line">{typeof registers.IR === "string" ? registers.IR : "-"}</p>
      </div>

      <div className="panel cpu-cell cpu-alu">
        <p className="console-label small">Arithmetic Logic Unit</p>
        <div className="cpu-alu-readout">
          <span>A: <b className="mono-cell">{alu.a}</b></span>
          <span>B: <b className="mono-cell">{alu.b}</b></span>
          <span>RES: <b className="mono-cell">{alu.out}</b></span>
        </div>
        <p className="cpu-alu-op-tag">OP: {alu.op}</p>
      </div>

      <div className="panel cpu-cell cpu-mainmem">
        <p className="console-label small">Main Memory</p>
        <table className="arch-mem-table">
          <tbody>
            {program.length === 0 && <tr><td className="empty-cell">No program loaded</td></tr>}
            {around.map((instr, i) => {
              const idx = startIdx + i;
              return (
                <tr key={idx} className={idx === fetchedIndex ? "arch-current-line" : ""}>
                  <td className="mono-cell">{formatInstrAddr(idx)}</td>
                  <td className="mono-cell">{instr.raw}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="panel cpu-cell cpu-mar">
        <p className="console-label small">Mem Address Reg (MAR)</p>
        <p className="alu-value">{formatInstrAddr(registers.MAR)}</p>
      </div>

      <div className="panel cpu-cell cpu-mdr">
        <p className="console-label small">Mem Data Reg (MDR)</p>
        <p className="mono-line">{typeof registers.MDR === "number" ? formatInstrAddr(registers.MDR) : registers.MDR}</p>
      </div>

      <div className="panel cpu-cell cpu-regfile">
        <p className="console-label small">Register File</p>
        <div className="regfile-grid">
          {["R0", "R1", "R2", "R3"].map(name => (
            <span key={name} className="mono-cell">{name} <b>{toHex(registers[name], 4)}</b></span>
          ))}
        </div>
      </div>

      <ActionBar>
        <button onClick={reset}><Icon name="reset" /> Reset</button>
        <button onClick={step} disabled={phase === "halted"}><Icon name="step" /> Step</button>
        <button className="primary" onClick={cpu.running ? pause : run} disabled={phase === "halted"}>
          <Icon name={cpu.running ? "pause" : "play"} /> {cpu.running ? "Pause" : "Auto Run"}
        </button>
        <span className="clock-speed-control">
          <span>Clock Speed:</span>
          <input
            type="range" min={150} max={1500} step={50}
            value={1650 - clockSpeedMs}
            onChange={e => setClockSpeed(1650 - Number(e.target.value))}
          />
        </span>
      </ActionBar>
    </section>
  );
}
