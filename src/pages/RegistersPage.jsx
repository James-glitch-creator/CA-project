import { useMemo } from "react";
import { useSimulator } from "../context/SimulatorContext";
import { toHex } from "../engine/constants";
import { deriveDatapath } from "../engine/datapath";
import ActionBar from "../components/ActionBar";
import Icon from "../components/Icons";

const META = {
  R0: { type: "GPR", alias: "Accumulator" },
  R1: { type: "GPR", alias: "Temp / Counter" },
  R2: { type: "GPR", alias: "Index" },
  R3: { type: "GPR", alias: "Base Pointer" },
  PC: { type: "CTRL", alias: "Program Counter" },
  IR: { type: "CTRL", alias: "Instruction Reg" },
  MAR: { type: "MEM", alias: "Memory Address" },
  MDR: { type: "MEM", alias: "Memory Data" }
};

function toBin16(value) {
  return (value & 0xffff).toString(2).padStart(16, "0");
}

export default function RegistersPage() {
  const { cpu, step, stepBack, run, pause, canStepBack } = useSimulator();
  const { registers, log, phase, running } = cpu;
  const { control } = deriveDatapath(cpu);

  const lastModified = useMemo(() => {
    const map = { R0: 0, R1: 0, R2: 0, R3: 0, PC: 0, IR: 0, MAR: 0, MDR: 0 };
    log.forEach(entry => {
      if (entry.changed !== "-") {
        entry.changed.split(",").map(s => s.trim()).forEach(name => {
          if (map[name] !== undefined) map[name] = entry.step;
        });
      }
      map.PC = entry.step; map.IR = entry.step; map.MAR = entry.step; map.MDR = entry.step;
    });
    return map;
  }, [log]);

  const now = log.length;
  const updatedReg = ["R0", "R1", "R2", "R3"].find(r => lastModified[r] === now && now > 0);
  const busLabel = control.MemWrite ? "→ WRITE" : control.MemRead ? "→ READ" : "IDLE";

  return (
    <section className="regbank-page">
      <div className="page-header-row">
        <div>
          <h1 className="about-title">Register Bank</h1>
          <p className="muted-cell">Real-time status of internal processor registers during execution cycle.</p>
        </div>
      </div>

      <div className="regbank-grid">
        {["R0", "R1", "R2", "R3"].map(name => (
          <div key={name} className="panel reg-card">
            <div className="reg-card-top">
              <span className="reg-kind">{META[name].type}</span>
              {name === updatedReg && <span className="reg-updated">Updated</span>}
            </div>
            <div className="reg-card-title">
              <h3>{name}</h3>
              <span className="muted-cell">{META[name].alias}</span>
            </div>
            <p className="reg-field"><span>Hex</span><b className="mono-cell">0x{toHex(registers[name], 4)}</b></p>
            <p className="reg-field"><span>Dec</span><b>{registers[name]}</b></p>
            <p className="reg-field"><span>Bin</span><b className="mono-cell small">{toBin16(registers[name])}</b></p>
          </div>
        ))}

        <div className="panel reg-card">
          <span className="reg-kind">CTRL</span>
          <div className="reg-card-title"><h3>PC</h3><span className="muted-cell">Program Counter</span></div>
          <p className="reg-field"><span>Hex</span><b className="mono-cell">0x{registers.PC.toString(16).toUpperCase().padStart(4, "0")}</b></p>
          <p className="reg-field"><span>Dec</span><b>{registers.PC}</b></p>
        </div>

        <div className="panel reg-card">
          <span className="reg-kind">CTRL</span>
          <div className="reg-card-title"><h3>IR</h3><span className="muted-cell">Instruction Reg</span></div>
          <p className="reg-field"><span>Hex</span><b className="mono-cell">{typeof registers.IR === "number" ? "0x" + registers.IR.toString(16).toUpperCase().padStart(4, "0") : "-"}</b></p>
          <p className="reg-field"><span>Opc</span><b className="mono-cell">{typeof registers.IR === "string" ? registers.IR : "-"}</b></p>
        </div>

        <div className="panel reg-card">
          <span className="reg-kind">MEM</span>
          <div className="reg-card-title"><h3>MAR</h3><span className="muted-cell">Memory Address</span></div>
          <p className="reg-field"><span>Hex</span><b className="mono-cell">0x{registers.MAR.toString(16).toUpperCase().padStart(4, "0")}</b></p>
          <p className="reg-field"><span>Bus</span><b className="bus-tag">{busLabel}</b></p>
        </div>

        <div className="panel reg-card">
          <span className="reg-kind">MEM</span>
          <div className="reg-card-title"><h3>MDR</h3><span className="muted-cell">Memory Data</span></div>
          <p className="reg-field"><span>Hex</span><b className="mono-cell">{typeof registers.MDR === "number" ? "0x" + registers.MDR.toString(16).toUpperCase().padStart(4, "0") : "-"}</b></p>
          <p className="reg-field"><span>Status</span><b className="bus-tag">{busLabel === "IDLE" ? "IDLE" : busLabel.replace("→ ", "")}</b></p>
        </div>
      </div>

      <div className="panel">
        <p className="console-label">Detailed State Trace</p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Register</th><th>Type</th><th>Hex Value</th><th>Dec Value</th><th>Binary Value</th><th>Last Modified</th></tr>
            </thead>
            <tbody>
              {Object.entries(registers).map(([name, value]) => {
                const isText = typeof value === "string";
                const cyc = lastModified[name] ?? 0;
                return (
                  <tr key={name}>
                    <td className="mono-cell">{name}</td>
                    <td>{META[name]?.type ?? "-"}</td>
                    <td className="mono-cell">{isText ? "-" : "0x" + value.toString(16).toUpperCase().padStart(4, "0")}</td>
                    <td className={isText ? "mono-cell" : ""}>{value}</td>
                    <td className="mono-cell muted-cell">{isText ? "-" : toBin16(value)}</td>
                    <td className={cyc === now && now > 0 ? "trace-now" : "muted-cell"}>
                      Cycle {cyc}{cyc === now && now > 0 ? " (Now)" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ActionBar>
        <button onClick={stepBack} disabled={!canStepBack}><Icon name="step" /> Step Back</button>
        <button className="primary" onClick={running ? pause : run} disabled={phase === "halted"}>
          <Icon name={running ? "pause" : "play"} /> {running ? "Pause" : "Auto Step"}
        </button>
        <button onClick={step} disabled={phase === "halted"}><Icon name="step" /> Step Fwd</button>
      </ActionBar>
    </section>
  );
}
