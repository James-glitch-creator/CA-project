import { useEffect, useState } from "react";
import { useSimulator } from "../context/SimulatorContext";
import { api } from "../api/client";
import { SAMPLE_PROGRAM } from "../engine/constants";
import BarChart from "../components/BarChart";
import DonutChart from "../components/DonutChart";
import ActionBar from "../components/ActionBar";
import Icon from "../components/Icons";

export default function PerformanceAnalysisPage() {
  const { cpu, stats, cache, cacheStats, step, stepBack, run, pause, reset, loadProgram, canStepBack } = useSimulator();

  const execTimeUs = stats.executionTimeSeconds * 1_000_000;
  const hasData = stats.instructionsExecuted > 0;

  const cycleData = cpu.log.map(entry => ({
    label: `#${entry.step} ${entry.instruction.split(/[\s,]+/)[0]}`,
    value: entry.instruction.startsWith("LOAD") || entry.instruction.startsWith("STORE") ? 4 : 3
  }));

  const [runs, setRuns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function refreshRuns() {
    try {
      setError(null);
      const { runs } = await api.listRuns();
      setRuns(runs);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refreshRuns();
  }, []);

  function runSampleProgram() {
    loadProgram(SAMPLE_PROGRAM);
    run();
  }

  async function saveReport() {
    setBusy(true);
    setError(null);
    try {
      await api.createRun({
        programName: cpu.programText.split("\n")[0].replace(/^;\s*/, "").slice(0, 140) || "Untitled program",
        cycles: stats.cycles,
        instructionsExecuted: stats.instructionsExecuted,
        cpi: Number(stats.cpi.toFixed(4)),
        mips: Number(stats.mips.toFixed(4)),
        executionTimeUs: Number(execTimeUs.toFixed(4)),
        cacheHitRatio: cache.accesses > 0 ? Number(cacheStats.hitRatio.toFixed(2)) : null,
        cacheMissRatio: cache.accesses > 0 ? Number(cacheStats.missRatio.toFixed(2)) : null,
        log: cpu.log
      });
      await refreshRuns();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteReport(id) {
    setBusy(true);
    try {
      await api.deleteRun(id);
      await refreshRuns();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="performance-page">
      <div className="page-header-row">
        <div>
          <h1 className="about-title dim-title">Analysis Workspace</h1>
          <p className="muted-cell">
            Monitor real-time execution metrics and analyze historical performance data across architectural components.
          </p>
        </div>
        <button className="primary" onClick={runSampleProgram}><Icon name="play" /> Run Sample Program</button>
      </div>

      {!hasData ? (
        <div className="panel empty-state-panel">
          <Icon name="performance" size={36} />
          <p>Run a sample program to generate data</p>
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            <div className="panel metric-card">
              <p>Execution Time</p>
              <h2>{execTimeUs.toFixed(2)} µs</h2>
            </div>
            <div className="panel metric-card">
              <p>Clock Cycles</p>
              <h2>{stats.cycles}</h2>
            </div>
            <div className="panel metric-card">
              <p>CPI</p>
              <h2>{stats.cpi.toFixed(2)}</h2>
            </div>
            <div className="panel metric-card">
              <p>MIPS</p>
              <h2>{stats.mips.toFixed(2)}</h2>
            </div>
            <div className="panel metric-card">
              <p>Cache Hit Ratio</p>
              <h2>{cacheStats.hitRatio.toFixed(1)}%</h2>
            </div>
            <div className="panel metric-card">
              <p>Cache Miss Ratio</p>
              <h2>{cacheStats.missRatio.toFixed(1)}%</h2>
            </div>
          </div>

          <div className="top-grid">
            <div className="panel">
              <h3>Cycles per Executed Instruction</h3>
              {cycleData.length === 0
                ? <p className="muted-cell">Run the CPU or Instruction Execution page to generate data.</p>
                : <BarChart data={cycleData} unit=" cyc" />}
            </div>

            <div className="panel">
              <h3>Cache Hit vs Miss</h3>
              {cache.accesses === 0
                ? <p className="muted-cell">Access the Cache Simulator to generate data.</p>
                : (
                  <DonutChart segments={[
                    { label: "Hit", value: cacheStats.hitRatio, color: "var(--chart-hit)" },
                    { label: "Miss", value: cacheStats.missRatio, color: "var(--chart-miss)" }
                  ]} />
                )}
            </div>
          </div>

          <div className="panel">
            <h3>Instructions Executed vs Cycles</h3>
            <BarChart data={[
              { label: "Instructions", value: stats.instructionsExecuted },
              { label: "Clock Cycles", value: stats.cycles }
            ]} />
          </div>

          <div className="panel">
            <div className="panel-title">
              <h3>Saved Reports (MySQL — shared, no login)</h3>
            </div>

            {error && <p className="status-banner error">{error}</p>}
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Saved</th><th>Program</th><th>Cycles</th><th>Instr.</th>
                    <th>CPI</th><th>MIPS</th><th>Hit %</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.length === 0 && (
                    <tr><td colSpan={8} className="empty-cell">No saved reports yet. Run a program, then click Export Report.</td></tr>
                  )}
                  {runs.map(r => (
                    <tr key={r.id}>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                      <td className="mono-cell">{r.program_name}</td>
                      <td>{r.cycles}</td>
                      <td>{r.instructions_executed}</td>
                      <td>{Number(r.cpi).toFixed(2)}</td>
                      <td>{Number(r.mips).toFixed(2)}</td>
                      <td>{r.cache_hit_ratio == null ? "-" : `${Number(r.cache_hit_ratio).toFixed(1)}%`}</td>
                      <td><button className="icon-btn" onClick={() => deleteReport(r.id)} title="Delete">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <ActionBar>
        <button onClick={reset}><Icon name="reset" /> Reset</button>
        <button onClick={stepBack} disabled={!canStepBack}><Icon name="step" /> Step Back</button>
        <button className="primary" onClick={cpu.running ? pause : run} disabled={cpu.phase === "halted"}>
          <Icon name={cpu.running ? "pause" : "play"} />
        </button>
        <button onClick={step} disabled={cpu.phase === "halted"}><Icon name="step" /> Step Fwd</button>
        <button className="primary" onClick={saveReport} disabled={busy || !hasData}>
          <Icon name="reset" /> Export Report
        </button>
      </ActionBar>
    </section>
  );
}
