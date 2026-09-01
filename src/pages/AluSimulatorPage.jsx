import { useMemo, useState } from "react";
import { ALU_OPS, aluCompute } from "../engine/alu";
import Icon from "../components/Icons";
import ActionBar from "../components/ActionBar";

const OPCODES = { ADD: "0000", SUB: "0001", AND: "0010", OR: "0011", XOR: "0100", NOT: "0101" };
const SYMBOLS = { ADD: "+", SUB: "-", AND: "&", OR: "|", XOR: "^", NOT: "~" };

function computeFlags(op, a, b, result) {
  const zero = result.decimal === 0;
  let carry = false;
  if (op === "ADD") carry = result.raw > 255;
  else if (op === "SUB") carry = a < b;

  const signed = n => (n > 127 ? n - 256 : n);
  let overflow = false;
  if (op === "ADD") {
    const sum = signed(a) + signed(b);
    overflow = sum > 127 || sum < -128;
  } else if (op === "SUB") {
    const diff = signed(a) - signed(b);
    overflow = diff > 127 || diff < -128;
  }
  return { zero, carry, overflow };
}

function BitRow({ bits, revealed, tone }) {
  return (
    <span className="bit-row">
      {bits.split("").map((bit, i) => (
        <span key={i} className={`bit ${i < revealed ? tone : "pending"}`}>{bit}</span>
      ))}
    </span>
  );
}

export default function AluSimulatorPage() {
  const [a, setA] = useState(42);
  const [b, setB] = useState(15);
  const [op, setOp] = useState("ADD");
  const [reveal, setReveal] = useState(8);
  const [history, setHistory] = useState([]);

  const isUnary = op === "NOT";
  const aClamped = Math.min(255, Math.max(0, Number(a) || 0));
  const bClamped = isUnary ? 0 : Math.min(255, Math.max(0, Number(b) || 0));

  const result = useMemo(() => aluCompute(op, aClamped, bClamped), [op, aClamped, bClamped]);
  const flags = useMemo(() => computeFlags(op, aClamped, bClamped, result), [op, aClamped, bClamped, result]);
  const aBin = (aClamped & 0xff).toString(2).padStart(8, "0");
  const bBin = (bClamped & 0xff).toString(2).padStart(8, "0");

  function execute() {
    setReveal(8);
    setHistory(h => [{ a: aClamped, b: isUnary ? "-" : bClamped, op, ...result }, ...h].slice(0, 6));
  }

  function step() {
    setReveal(r => (r >= 8 ? 0 : r + 1));
  }

  function reset() {
    setA(0);
    setB(0);
    setOp("ADD");
    setReveal(8);
    setHistory([]);
  }

  return (
    <section className="alu-console">
      <div className="alu-console-main">
        <div className="panel console-panel">
          <p className="console-label">ALU_DATAPATH_VIEW</p>

          <div className="alu-operands">
            <div className="alu-operand-box">
              <p className="console-label small">OPERAND_A</p>
              <input
                className="alu-value-input"
                type="number" min={0} max={255}
                value={a} onChange={e => setA(e.target.value)}
              />
              <p className="alu-sub">0x{aClamped.toString(16).toUpperCase().padStart(2, "0")}</p>
              <p className="alu-sub mono-cell">{aBin}</p>
            </div>

            {!isUnary && (
              <div className="alu-operand-box">
                <p className="console-label small">OPERAND_B</p>
                <input
                  className="alu-value-input"
                  type="number" min={0} max={255}
                  value={b} onChange={e => setB(e.target.value)}
                />
                <p className="alu-sub">0x{bClamped.toString(16).toUpperCase().padStart(2, "0")}</p>
                <p className="alu-sub mono-cell">{bBin}</p>
              </div>
            )}
          </div>

          <div className="alu-flow">
            <div className="alu-converge" />
            <div className="alu-trapezoid">{op}</div>
          </div>

          <div className={`alu-operand-box result ${flags.overflow ? "warn" : ""}`}>
            <p className="console-label small">RESULT</p>
            <p className="alu-value">{result.decimal}</p>
            <p className="alu-sub">0x{result.hex}</p>
            <p className="alu-sub mono-cell">{result.binary}</p>
            {flags.overflow && <p className="warn-text small-note">⚠ Overflow beyond 8 bits (raw = {result.raw})</p>}
          </div>
        </div>

        <div className="panel console-panel">
          <p className="console-label">BITWISE_EXECUTION</p>
          <div className="bit-trace">
            {!isUnary ? (
              <>
                <div className="bit-line"><span className="bit-op"> </span><BitRow bits={aBin} revealed={reveal} tone="teal" /><span className="bit-dec">({aClamped})</span></div>
                <div className="bit-line"><span className="bit-op">{SYMBOLS[op]}</span><BitRow bits={bBin} revealed={reveal} tone="orange" /><span className="bit-dec">({bClamped})</span></div>
                <div className="bit-divider" />
                <div className="bit-line"><span className="bit-op"> </span><BitRow bits={result.binary} revealed={reveal} tone="result" /><span className="bit-dec">({result.decimal})</span></div>
              </>
            ) : (
              <>
                <div className="bit-line"><span className="bit-op">~</span><BitRow bits={aBin} revealed={reveal} tone="teal" /><span className="bit-dec">({aClamped})</span></div>
                <div className="bit-divider" />
                <div className="bit-line"><span className="bit-op"> </span><BitRow bits={result.binary} revealed={reveal} tone="result" /><span className="bit-dec">({result.decimal})</span></div>
              </>
            )}
          </div>
        </div>

        <div className="panel table-panel">
          <h3>Recent Operations</h3>
          <div className="table-scroll">
            <table>
              <thead><tr><th>A</th><th>Op</th><th>B</th><th>Result</th><th>Binary</th></tr></thead>
              <tbody>
                {history.length === 0 && (
                  <tr><td colSpan={5} className="empty-cell">No operations yet — press Execute.</td></tr>
                )}
                {history.map((h, i) => (
                  <tr key={i}>
                    <td>{h.a}</td><td>{h.op}</td><td>{h.b}</td><td>{h.decimal}</td><td>{h.binary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="alu-console-side">
        <div className="panel console-panel">
          <p className="console-label">STATUS_FLAGS</p>
          <div className="flag-row"><span>Zero (Z)</span><span className={`flag-box ${flags.zero ? "on" : ""}`}>{flags.zero ? 1 : 0}</span></div>
          <div className="flag-row"><span>Carry (C)</span><span className={`flag-box ${flags.carry ? "on" : ""}`}>{flags.carry ? 1 : 0}</span></div>
          <div className="flag-row"><span>Overflow (V)</span><span className={`flag-box ${flags.overflow ? "on" : ""}`}>{flags.overflow ? 1 : 0}</span></div>
        </div>

        <div className="panel console-panel">
          <p className="console-label">ALU_OP_CODE</p>
          <select className="alu-opcode-select" value={op} onChange={e => setOp(e.target.value)}>
            {ALU_OPS.map(o => <option key={o} value={o}>{OPCODES[o]} ({o})</option>)}
          </select>
        </div>
      </div>

      <ActionBar>
        <button onClick={reset}><Icon name="reset" /> Reset</button>
        <button onClick={step}><Icon name="step" /> Step</button>
        <button className="primary" onClick={execute}><Icon name="play" /> Execute</button>
      </ActionBar>
    </section>
  );
}
