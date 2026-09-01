import { useSimulator } from "../context/SimulatorContext";
import { toHex, formatInstrAddr } from "../engine/constants";
import ArchitectureOverview from "../components/ArchitectureOverview";
import ActionBar from "../components/ActionBar";
import Icon from "../components/Icons";

const PHASES = ["fetch", "decode", "execute"];

export default function Home() {
  const { cpu, stats, step, stepBack, run, pause, reset, canStepBack } = useSimulator();
  const { registers, program, phase, fetchedIndex, status, running } = cpu;

  const currentInstruction = fetchedIndex != null ? program[fetchedIndex]?.raw : null;
  const isValid = status.type !== "error";
  const stepLetter = { fetch: "F", decode: "D", execute: "E" };

  return (
    <>
      <section className="home-top-cards">
        <div className="panel top-card">
          <p className="console-label">Current Instruction</p>
          <div className="top-card-row">
            <h2 className="mono-cell">{currentInstruction ?? "-"}</h2>
            <div className="stat-icon"><Icon name="instructions" size={18} /></div>
          </div>
          <span className={`phase-pill ${isValid ? "execute" : "error"}`}>
            {isValid ? "✓ Valid" : "✕ Error"}
          </span>
          {fetchedIndex != null && (
            <p className="muted-cell small-note">{formatInstrAddr(fetchedIndex)}</p>
          )}
        </div>

        <div className="panel top-card">
          <p className="console-label">Pipeline Stage</p>
          <div className="pipeline-stepper">
            {PHASES.map((p, i) => (
              <div key={p} className="pipeline-step-wrap">
                <div className={`pipeline-circle ${phase === p ? "active" : ""}`}>{stepLetter[p]}</div>
                {i < PHASES.length - 1 && <div className="pipeline-dash" />}
              </div>
            ))}
          </div>
          <p className="pipeline-name">{phase === "idle" || phase === "halted" ? phase.toUpperCase() : phase.toUpperCase()}</p>
        </div>

        <div className="panel top-card">
          <p className="console-label">Clock Cycle</p>
          <div className="top-card-row">
            <h2>{stats.cycles.toLocaleString()}</h2>
            <div className="stat-icon"><Icon name="performance" size={18} /></div>
          </div>
          <div className="top-card-footer">
            <span>PC <b className="mono-cell">{toHex(registers.PC, 4)}</b></span>
            <span>CPI <b>{stats.cpi.toFixed(1)}</b></span>
          </div>
        </div>
      </section>

      <section className="panel arch-overview-panel">
        <p className="console-label">Architecture Overview</p>
        <ArchitectureOverview cpu={cpu} />
      </section>

      <ActionBar>
        <button onClick={reset}><Icon name="reset" /> Reset</button>
        <button onClick={stepBack} disabled={!canStepBack}><Icon name="step" /> Step Back</button>
        <button className="primary" onClick={running ? pause : run} disabled={phase === "halted"}>
          <Icon name={running ? "pause" : "play"} /> {running ? "Pause" : "Auto Run"}
        </button>
        <button onClick={step} disabled={phase === "halted"}><Icon name="step" /> Step Fwd</button>
      </ActionBar>
    </>
  );
}
