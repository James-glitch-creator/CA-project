const INSTRUCTIONS = [
  ["0x10", "LOAD", "LOAD R1, 100", "Load one byte from data memory"],
  ["0x11", "STORE", "STORE R1, 100", "Store one byte through the L1 cache"],
  ["0x20", "MOV", "MOV R1, R2 | #5", "Move a register or immediate value"],
  ["0x30", "ADD", "ADD R1, R2, R3", "8-bit addition; update Z/C/V/N"],
  ["0x31", "SUB", "SUB R1, R2, R3", "8-bit subtraction; update Z/C/V/N"],
  ["0x32", "AND", "AND R1, R2, R3", "Bitwise AND; update Z/C/V/N"],
  ["0x33", "OR", "OR R1, R2, R3", "Bitwise OR; update Z/C/V/N"],
  ["0x34", "XOR", "XOR R1, R2, R3", "Bitwise XOR; update Z/C/V/N"],
  ["0x35", "NOT", "NOT R1, R2", "Bitwise complement; update Z/C/V/N"],
  ["0x00", "NOP", "NOP", "No operation"],
  ["0xFF", "HALT", "HALT", "Stop execution"]
];

export default function DocumentationPage() {
  return (
    <section className="documentation-page">
      <article className="docs-article">
        <header className="docs-heading" id="getting-started">
          <span>Documentation</span>
          <h1>ArchSim Documentation</h1>
          <p>
            Welcome to the official documentation for ArchSim, a high-fidelity computer architecture
            simulator designed for academic and technical analysis. This guide covers everything from
            basic CPU components to advanced cache performance metrics.
          </p>
        </header>

        <div className="docs-callout">
          <div className="callout-icon">!</div>
          <div>
            <h3>Getting Started Tip</h3>
            <p>
              For your first run, navigate to the <strong>Instruction Execution</strong> tab, load the
              sample program, and use the “Step” function to observe data flowing through the data paths.
            </p>
          </div>
        </div>

        <section className="docs-section" id="instruction-set">
          <h2>Instruction Set Architecture (ISA)</h2>
          <p>
            ArchSim implements a simplified 8-bit RISC-like CPU with 32-bit instruction words.
            Each word contains an 8-bit opcode and up to three 8-bit operand fields. Instructions
            use a separate word-addressed space beginning at 0x00400000, while data memory contains
            256 byte locations from 0 through 255.
          </p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead><tr><th>Opcode</th><th>Mnemonic</th><th>Syntax</th><th>Description</th></tr></thead>
              <tbody>
                {INSTRUCTIONS.map(row => (
                  <tr key={row[0]}>{row.map((cell, index) => <td key={cell} className={index < 3 ? "code-cell" : ""}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </article>
    </section>
  );
}
