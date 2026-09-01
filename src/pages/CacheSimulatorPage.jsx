import { useEffect, useRef, useState } from "react";
import { useSimulator } from "../context/SimulatorContext";
import ActionBar from "../components/ActionBar";
import Icon from "../components/Icons";

export default function CacheSimulatorPage() {
  const { cache, cacheStats, cacheConfigure, cacheAccessAddr, cacheReset, cacheStepBack, canCacheStepBack } = useSimulator();
  const [address, setAddress] = useState("1A4");
  const [cacheSize, setCacheSize] = useState(cache.config.cacheSize);
  const [blockSize, setBlockSize] = useState(cache.config.blockSize);
  const [autoStepping, setAutoStepping] = useState(false);
  const intervalRef = useRef(null);

  const mapping = cache.config.mapping === "Direct" ? "Direct" : "Assoc";

  function applyMapping(next) {
    cacheConfigure({
      cacheSize: Number(cacheSize),
      blockSize: Number(blockSize),
      mapping: next === "Direct" ? "Direct" : "Fully Associative"
    });
  }

  function applySize() {
    cacheConfigure({
      cacheSize: Number(cacheSize) || cache.config.cacheSize,
      blockSize: Number(blockSize) || cache.config.blockSize,
      mapping: cache.config.mapping
    });
  }

  function access() {
    const addr = parseInt(address, 16);
    if (Number.isNaN(addr)) return;
    cacheAccessAddr(addr & 0xff);
    setAddress(((addr + Number(blockSize)) & 0xff).toString(16).toUpperCase());
  }

  function stepBack() {
    cacheStepBack();
    const addr = parseInt(address, 16) || 0;
    setAddress((((addr - Number(blockSize)) % 256 + 256) % 256).toString(16).toUpperCase());
  }

  function resetStats() {
    setAutoStepping(false);
    cacheReset();
    setAddress("0");
  }

  useEffect(() => {
    if (autoStepping) {
      intervalRef.current = setInterval(access, 700);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStepping, address, blockSize]);

  const last = cache.lastResult;

  return (
    <section className="cache-console">
      <div className="cache-top-grid">
        <div className="panel">
          <p className="console-label">Configuration</p>
          <div className="config-row">
            <span>Mapping</span>
            <div className="segmented">
              <button className={mapping === "Direct" ? "active" : ""} onClick={() => applyMapping("Direct")}>Direct</button>
              <button className={mapping === "Assoc" ? "active" : ""} onClick={() => applyMapping("Assoc")}>Assoc</button>
            </div>
          </div>
          <div className="config-row">
            <span>Cache Size</span>
            <input
              className="config-input" type="number" min={4} value={cacheSize}
              onChange={e => setCacheSize(e.target.value)} onBlur={applySize}
            /> <span className="config-unit">B</span>
          </div>
          <div className="config-row">
            <span>Block Size</span>
            <input
              className="config-input" type="number" min={1} value={blockSize}
              onChange={e => setBlockSize(e.target.value)} onBlur={applySize}
            /> <span className="config-unit">B</span>
          </div>
          <div className="config-row">
            <span>Sets</span>
            <span className="config-readout">{cache.config.sets}</span>
          </div>
        </div>

        <div className="panel cache-stats-panel">
          <div className="cache-stat">
            <p>Accesses</p>
            <h2>{cache.accesses}</h2>
          </div>
          <div className="cache-stat">
            <p>Hits</p>
            <h2 className="tone-hit">{cache.hits}</h2>
          </div>
          <div className="cache-stat">
            <p>Misses</p>
            <h2 className="tone-miss">{cache.misses}</h2>
          </div>
          <div className="cache-stat">
            <p>Hit Ratio</p>
            <h2>{cacheStats.hitRatio.toFixed(1)}%</h2>
          </div>
        </div>
      </div>

      <div className="panel">
        <p className="console-label">Architecture Flow</p>
        <div className="cache-flow">
          <div className="flow-box"><Icon name="cpu" size={22} /><span>CPU</span></div>
          <div className="flow-wire" />
          <div className="flow-box active"><Icon name="cache" size={22} /><span>L1 Cache</span></div>
          <div className="flow-wire" />
          <div className="flow-box"><Icon name="memory" size={22} /><span>Main Mem</span></div>
        </div>

        <div className="access-row">
          <span className="config-unit">0x</span>
          <input
            className="config-input access-input"
            value={address}
            onChange={e => setAddress(e.target.value.replace(/[^0-9a-fA-F]/g, ""))}
          />
          <button className="primary" onClick={access}>Access Address</button>
        </div>

        {last && (
          <div className={`result-pill ${last.outcome === "Hit" ? "hit" : "miss"}`}>
            <i /> Cache {last.outcome === "Hit" ? "Hit (Tag Match)" : "Miss"}
          </div>
        )}
      </div>

      <div className="panel">
        <p className="console-label">Cache Array ({cache.config.mapping === "Direct" ? "Direct Mapped" : "Associative"})</p>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Index</th><th>Valid</th><th>Tag</th><th>Data Block (Hex)</th></tr></thead>
            <tbody>
              {cache.lines.map(line => (
                <tr key={line.id} className={line.valid ? "" : "invalid-row"}>
                  <td>{String(line.id).padStart(2, "0")}</td>
                  <td className={line.valid ? "yes-cell" : "no-cell"}>{line.valid ? "1" : "0"}</td>
                  <td className="mono-cell">{line.valid ? line.tag : "-"}</td>
                  <td className="mono-cell">
                    {line.valid ? line.data.map(b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted-cell small-note">
          {cache.config.numLines} lines · {cache.config.sets} set(s) · {cache.config.ways}-way — data is read from the CPU's own main memory.
        </p>
      </div>

      <ActionBar>
        <button onClick={resetStats}><Icon name="reset" /> Reset Stats</button>
        <button onClick={stepBack} disabled={!canCacheStepBack}><Icon name="step" /> Step Back</button>
        <button className="primary" onClick={() => setAutoStepping(a => !a)}>
          <Icon name={autoStepping ? "pause" : "play"} /> {autoStepping ? "Pause" : "Auto Step"}
        </button>
        <button onClick={access}><Icon name="step" /> Step Forward</button>
      </ActionBar>
    </section>
  );
}
