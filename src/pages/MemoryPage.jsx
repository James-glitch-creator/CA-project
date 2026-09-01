import { useMemo, useState } from "react";
import { useSimulator } from "../context/SimulatorContext";
import { toHex } from "../engine/constants";
import ActionBar from "../components/ActionBar";
import Icon from "../components/Icons";

const PAGE_SIZE = 12;

const SEGMENTS = [
  { label: "Reserved", from: 0x00, to: 0x3f, tone: "seg-reserved" },
  { label: "Program Data", from: 0x40, to: 0x7f, tone: "seg-data" },
  { label: "Heap", from: 0x80, to: 0xbf, tone: "seg-heap" },
  { label: "Stack", from: 0xc0, to: 0xff, tone: "seg-stack" }
];

function addrHex(addr) {
  return addr.toString(16).toUpperCase().padStart(2, "0");
}

export default function MemoryPage() {
  const { cpu, step, stepBack, run, pause, reset, canStepBack } = useSimulator();
  const { memory, registers, log, running, phase } = cpu;
  const [page, setPage] = useState(0);
  const [jumpAddr, setJumpAddr] = useState("");
  const pageCount = Math.ceil(memory.length / PAGE_SIZE);

  const start = page * PAGE_SIZE;
  const rows = memory.slice(start, start + PAGE_SIZE);

  const lastAccess = useMemo(() => {
    const entry = [...log].reverse().find(l => l.changed !== "-" && l.changed.startsWith("M["));
    if (!entry) return null;
    const addr = parseInt(entry.changed.match(/M\[(\d+)\]/)?.[1] ?? "-1", 10);
    return addr >= 0 ? { addr: addr & 0xff, type: "WRITE" } : null;
  }, [log]);

  function jump() {
    const addr = parseInt(jumpAddr, 16);
    if (Number.isNaN(addr)) return;
    setPage(Math.floor((addr & 0xff) / PAGE_SIZE));
  }

  function goTo(addr) {
    setPage(Math.floor((addr & 0xff) / PAGE_SIZE));
  }

  return (
    <section className="memory-console">
      <div className="panel memory-inspector">
        <div className="panel-title">
          <p className="console-label">Main Memory Inspector</p>
          <div className="mem-pill-row">
            <span className="mem-pill pc">PC: 0x{addrHex(registers.PC & 0xff)}</span>
            <span className="mem-pill mar">MAR: 0x{addrHex(registers.MAR & 0xff)}</span>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Address (Hex)</th><th>Address (Dec)</th><th>Data (Hex)</th>
                <th>Data (Dec)</th><th>Binary</th><th>Access</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((byte, i) => {
                const addr = start + i;
                const isMar = (registers.MAR & 0xff) === addr;
                const isPc = (registers.PC & 0xff) === addr;
                const isLastWrite = lastAccess && lastAccess.addr === addr;
                return (
                  <tr key={addr} className={isPc ? "row-pc" : isMar ? "row-mar" : byte !== 0 ? "nonzero" : ""}>
                    <td className="mono-cell">0x{addrHex(addr)}</td>
                    <td>{addr}</td>
                    <td className="mono-cell">{toHex(byte)}</td>
                    <td>{byte}</td>
                    <td className="mono-cell muted-cell">{byte.toString(2).padStart(8, "0")}</td>
                    <td>
                      {isPc && <span className="access-badge pc">▶ PC</span>}
                      {!isPc && isMar && <span className="access-badge mar">MAR</span>}
                      {!isPc && !isMar && isLastWrite && <span className="access-badge write">↓ WRITE</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>Showing {start} to {start + rows.length - 1} of {memory.length}</span>
          {Array.from({ length: pageCount }, (_, i) => (
            <button key={i} className={i === page ? "page-active" : ""} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
          <button disabled={page >= pageCount - 1} onClick={() => setPage(p => Math.min(p + 1, pageCount - 1))}>›</button>
        </div>
      </div>

      <div className="memory-side">
        <div className="panel">
          <p className="console-label">Memory Map</p>
          <div className="memory-map">
            {[...SEGMENTS].reverse().map(seg => (
              <div key={seg.label} className={`memory-map-band ${seg.tone}`} style={{ flexGrow: seg.to - seg.from + 1 }}>
                <span>{seg.label}</span>
              </div>
            ))}
          </div>
          <div className="memory-map-labels">
            <span>0x00</span><span>0x40</span><span>0x80</span><span>0xC0</span><span>0xFF</span>
          </div>
          <p className="muted-cell small-note">Illustrative segmentation over the 256-byte address space.</p>
        </div>

        <div className="panel">
          <p className="console-label">Navigation</p>
          <div className="access-row">
            <span className="config-unit">0x</span>
            <input
              className="config-input access-input"
              value={jumpAddr}
              onChange={e => setJumpAddr(e.target.value.replace(/[^0-9a-fA-F]/g, ""))}
              placeholder="Address"
            />
            <button className="primary" onClick={jump}>Jump</button>
          </div>
          <div className="button-row">
            <button onClick={() => goTo(registers.PC)}>Go to PC</button>
            <button onClick={() => goTo(registers.MAR)}>Go to MAR</button>
          </div>
        </div>
      </div>

      <ActionBar>
        <button onClick={reset}><Icon name="reset" /> Reset</button>
        <button onClick={stepBack} disabled={!canStepBack}><Icon name="step" /> Step Back</button>
        <button onClick={step} disabled={phase === "halted"}><Icon name="step" /> Step</button>
        <button className="primary" onClick={running ? pause : run} disabled={phase === "halted"}>
          <Icon name={running ? "pause" : "play"} /> {running ? "Pause" : "Execute"}
        </button>
      </ActionBar>
    </section>
  );
}
