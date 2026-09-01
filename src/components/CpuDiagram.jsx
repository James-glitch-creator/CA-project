import { getActiveComponents } from "../engine/activeComponents";

export default function CpuDiagram({ phase, op, compact = false }) {
  const active = getActiveComponents(phase, op);
  const cls = id => `cpu-box ${active.has(id) ? "active" : ""}`;
  const busCls = id => `bus-label ${active.has(id) ? "active" : ""}`;

  return (
    <div className={`cpu-diagram ${compact ? "compact" : ""}`}>
      <div className="cpu-frame-label">CPU</div>

      <div className={cls("CONTROL_UNIT") + " control-unit"}>Control Unit</div>

      <div className="cpu-row">
        <div className={cls("REGISTERS") + " green"}>Registers</div>
        <div className="arrow">↔</div>
        <div className={cls("ALU") + " yellow"}>ALU</div>
        <div className="arrow">↔</div>
        <div className={cls("PC") + " purple"}>PC</div>
      </div>

      <div className="cpu-row second">
        <div className={cls("MAR") + " purple"}>MAR</div>
        <div className={busCls("DATA_BUS")}>Data Bus</div>
        <div className={cls("MDR") + " purple"}>MDR</div>
      </div>

      <div className={busCls("ADDRESS_BUS")}>Address Bus</div>

      <div className={cls("MEMORY") + " memory-box"}>Main Memory</div>
    </div>
  );
}
