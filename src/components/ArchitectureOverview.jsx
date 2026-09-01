import Icon from "./Icons";
import { toHex, formatInstrAddr } from "../engine/constants";
import { deriveDatapath } from "../engine/datapath";

export default function ArchitectureOverview({ cpu }) {
  const { registers, program, fetchedIndex, phase } = cpu;
  const { control, alu, destReg } = deriveDatapath(cpu);

  const startIdx = Math.max(0, (fetchedIndex ?? 0) - 1);
  const around = program.slice(startIdx, (fetchedIndex ?? 0) + 2);

  return (
    <div className="arch-diagram">
      <div className="arch-box arch-control">
        <h4><Icon name="cpu" size={13} /> Control Unit</h4>
        <div className="arch-signals">
          <span>RegWrite: <b className={control.RegWrite ? "on" : ""}>{control.RegWrite}</b></span>
          <span>ALUSrc: <b className={control.ALUSrc ? "on" : ""}>{control.ALUSrc}</b></span>
          <span>MemRead: <b className={control.MemRead ? "on" : ""}>{control.MemRead}</b></span>
          <span>MemWrite: <b className={control.MemWrite ? "on" : ""}>{control.MemWrite}</b></span>
        </div>
      </div>

      <div className="arch-wire arch-wire-top" />

      <div className="arch-box arch-memory">
        <h4><Icon name="memory" size={13} /> Main Memory</h4>
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

      <div className="arch-wire arch-wire-vertical" />

      <div className="arch-box arch-registers">
        <h4><Icon name="registers" size={13} /> Registers</h4>
        <table className="arch-reg-table">
          <tbody>
            {["R0", "R1", "R2", "R3"].map(name => (
              <tr key={name} className={name === destReg ? "arch-current-line" : ""}>
                <td className="mono-cell">{name}</td>
                <td className="mono-cell">
                  {toHex(registers[name], 4)}
                  {name === destReg && phase !== "execute" && <span className="arch-arrow"> → ?</span>}
                  {name === destReg && phase === "execute" && <span className="arch-arrow"> → {toHex(registers[name], 4)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="arch-wire arch-wire-mid" />

      <div className="arch-box arch-alu-box">
        <h4><Icon name="alu" size={13} /> ALU</h4>
        <p className="arch-alu-op">OP: {alu.op}</p>
        <p className="mono-cell">A: {alu.a}</p>
        <p className="mono-cell">B: {alu.b}</p>
        <p className="mono-cell arch-alu-out">Out: {alu.out}</p>
      </div>
    </div>
  );
}
