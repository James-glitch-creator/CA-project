import { useEffect, useState } from "react";
import { useSimulator } from "../context/SimulatorContext";
import { api } from "../api/client";
import { SAMPLE_PROGRAM, formatInstrAddr } from "../engine/constants";
import { describeInstruction } from "../engine/instructions";
import { deriveDatapath } from "../engine/datapath";
import StatusBanner from "../components/StatusBanner";
import ActionBar from "../components/ActionBar";
import Icon from "../components/Icons";

// Mirrors parseProgram's own line filtering (strip comments, drop blanks) so
// the highlighted source line always lines up with the parsed instruction,
// even when the program has comments or blank lines in it.
function mapInstrIndexToRawLine(programText, instrIndex) {
  const rawLines = programText.split("\n");
  let count = -1;
  for (let i = 0; i < rawLines.length; i++) {
    const stripped = rawLines[i].replace(/;.*$/, "").replace(/\/\/.*$/, "").trim();
    if (stripped.length > 0) {
      count++;
      if (count === instrIndex) return i;
    }
  }
  return -1;
}

function tokenizeLine(rawLine) {
  const trimmed = rawLine.trim();
  if (trimmed === "") return [{ text: " ", cls: "" }];
  if (trimmed.startsWith(";") || trimmed.startsWith("//")) {
    return [{ text: rawLine, cls: "tok-comment" }];
  }
  const commentMatch = rawLine.match(/([;].*|\/\/.*)$/);
  const code = commentMatch ? rawLine.slice(0, commentMatch.index) : rawLine;
  const comment = commentMatch ? commentMatch[0] : "";

  const opMatch = code.match(/^(\s*)([A-Za-z]+)(.*)$/);
  const tokens = [];
  if (opMatch) {
    tokens.push({ text: opMatch[1], cls: "" });
    tokens.push({ text: opMatch[2], cls: "tok-op" });
    tokens.push({ text: opMatch[3], cls: "tok-args" });
  } else {
    tokens.push({ text: code, cls: "" });
  }
  if (comment) tokens.push({ text: comment, cls: "tok-comment" });
  return tokens;
}

export default function InstructionExecutionPage() {
  const { cpu, step, stepBack, run, pause, reset, loadProgram, canStepBack } = useSimulator();
  const { program, phase, status, running, log, registers, fetchedIndex } = cpu;
  const [draft, setDraft] = useState(cpu.programText);
  const [editing, setEditing] = useState(false);

  const [programName, setProgramName] = useState("My Program");
  const [savedPrograms, setSavedPrograms] = useState([]);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [libraryError, setLibraryError] = useState(null);

  function load() {
    loadProgram(draft);
  }

  function loadSample() {
    setDraft(SAMPLE_PROGRAM);
    loadProgram(SAMPLE_PROGRAM);
  }

  async function refreshLibrary() {
    try {
      setLibraryError(null);
      const { programs } = await api.listPrograms();
      setSavedPrograms(programs);
    } catch (err) {
      setLibraryError(err.message);
    }
  }

  useEffect(() => {
    refreshLibrary();
  }, []);

  async function saveProgram() {
    setLibraryBusy(true);
    setLibraryError(null);
    try {
      await api.createProgram({ name: programName || "Untitled program", source: draft });
      await refreshLibrary();
    } catch (err) {
      setLibraryError(err.message);
    } finally {
      setLibraryBusy(false);
    }
  }

  async function loadSaved(p) {
    setDraft(p.source);
    setProgramName(p.name);
    loadProgram(p.source);
    setEditing(false);
  }

  async function deleteSaved(id) {
    setLibraryBusy(true);
    try {
      await api.deleteProgram(id);
      await refreshLibrary();
    } catch (err) {
      setLibraryError(err.message);
    } finally {
      setLibraryBusy(false);
    }
  }

  const currentInstr = fetchedIndex != null ? program[fetchedIndex] : null;
  const currentRawLine = currentInstr ? mapInstrIndexToRawLine(cpu.programText, fetchedIndex) : -1;
  const { control, alu, destReg } = deriveDatapath(cpu);
  const isMemOp = currentInstr && (currentInstr.op === "LOAD" || currentInstr.op === "STORE");

  return (
    <section className="instr-exec-page">
      <div className="panel source-panel">
        <div className="panel-title">
          <p className="console-label">Assembly Source</p>
          <div className="button-row compact">
            <span className="muted-cell">main.s</span>
            <button className="link-btn" onClick={() => setEditing(e => !e)}>{editing ? "Done" : "Edit"}</button>
          </div>
        </div>

        {!editing ? (
          <div className="source-view">
            {cpu.programText.split("\n").map((line, i) => (
              <div key={i} className={`source-line ${i === currentRawLine ? "current" : ""}`}>
                <span className="source-line-no">{i + 1}</span>
                <span className="source-line-code">
                  {tokenizeLine(line).map((tok, j) => (
                    <span key={j} className={tok.cls}>{tok.text}</span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <textarea
              className="program-editor"
              rows={10}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              spellCheck={false}
            />
            <div className="button-row">
              <button className="primary" onClick={load}>Load Program</button>
              <button onClick={loadSample}>Load Sample</button>
            </div>
            <p className="muted-cell small-note">
              Supported: LOAD Rd,addr · STORE Rd,addr · ADD/SUB/AND/OR/XOR Rd,Rs[,Rs2] · MOV Rd,Rs|#imm · NOT Rd[,Rs] · NOP · HALT
            </p>

            <div className="library-block">
              <h4>Saved Programs (MySQL — shared, no login)</h4>
              <div className="button-row compact">
                <input
                  className="text-input"
                  value={programName}
                  onChange={e => setProgramName(e.target.value)}
                  placeholder="Program name"
                />
                <button className="primary" onClick={saveProgram} disabled={libraryBusy}>
                  <Icon name="reset" /> Save Program
                </button>
              </div>
              {libraryError && <p className="status-banner error">{libraryError}</p>}
              <ul className="library-list">
                {savedPrograms.length === 0 && (
                  <li className="muted-cell small-note">No saved programs yet.</li>
                )}
                {savedPrograms.map(p => (
                  <li key={p.id} className="library-item">
                    <button className="link-btn" onClick={() => loadSaved(p)}>{p.name}</button>
                    <button className="icon-btn" onClick={() => deleteSaved(p.id)} title="Delete">✕</button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="instr-exec-right">
        <div className="panel">
          <div className="panel-title">
            <p className="console-label">Current Instruction ({phase.toUpperCase()} Phase)</p>
            <span className="pc-readout">PC<br /><b>{formatInstrAddr(registers.PC)}</b></span>
          </div>
          <h2 className="mono-cell current-instr-title">{currentInstr?.raw ?? "-"}</h2>
          <p className="muted-cell">{currentInstr ? describeInstruction(currentInstr) : status.message}</p>
        </div>

        <div className="instr-mini-grid">
          <div className="panel console-panel">
            <p className="console-label small">Control Unit</p>
            <p className="mono-line">IR: {typeof registers.IR === "string" ? registers.IR : "-"}</p>
            <div className="arch-signals mini-signals">
              <span>MemRead: <b className={control.MemRead ? "on" : ""}>{control.MemRead}</b></span>
              <span>RegWrite: <b className={control.RegWrite ? "on" : ""}>{control.RegWrite}</b></span>
              <span>ALUSrc: <b className={control.ALUSrc ? "on" : ""}>{control.ALUSrc}</b></span>
              <span>MemWrite: <b className={control.MemWrite ? "on" : ""}>{control.MemWrite}</b></span>
            </div>
          </div>

          <div className="panel console-panel">
            <p className="console-label small">Datapath</p>
            <div className="datapath-flow">
              <div className="dp-box">
                <p>{isMemOp ? "ADDR" : alu.a !== "--" ? "A" : destReg ?? "Rd"}</p>
                <b>{isMemOp ? currentInstr.args[1].value : alu.a !== "--" ? alu.a : "-"}</b>
              </div>
              <span className="arrow">→</span>
              <div className="dp-box highlight">
                <p>{isMemOp ? "MAR" : destReg ?? "Out"}</p>
                <b>{isMemOp ? currentInstr.args[1].value : alu.out}</b>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <p className="console-label">Execution History</p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>PC</th><th>Instruction</th><th>Cycles</th><th>State Changes</th></tr>
              </thead>
              <tbody>
                {log.length === 0 && (
                  <tr><td colSpan={4} className="empty-cell">No instructions executed yet.</td></tr>
                )}
                {[...log].reverse().map(entry => (
                  <tr key={entry.step} className="executed">
                    <td className="mono-cell">{formatInstrAddr(entry.pc)}</td>
                    <td className="mono-cell">{entry.instruction}</td>
                    <td>{entry.cycles}</td>
                    <td className="mono-cell">{entry.changed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <StatusBanner status={status} />
        </div>
      </div>

      <ActionBar>
        <button onClick={reset}><Icon name="reset" /> Reset</button>
        <button onClick={stepBack} disabled={!canStepBack}><Icon name="step" /> Step Back</button>
        <button onClick={step} disabled={phase === "halted"}><Icon name="step" /> Step Forward</button>
        <button className="primary" onClick={running ? pause : run} disabled={phase === "halted"}>
          <Icon name={running ? "pause" : "play"} /> {running ? "Pause" : "Auto Run"}
        </button>
      </ActionBar>
    </section>
  );
}
