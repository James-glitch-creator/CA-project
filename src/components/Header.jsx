import Icon from "./Icons";
import { useSimulator } from "../context/SimulatorContext";

export default function Header({ activePage }) {
  const { reset } = useSimulator();

  return (
    <header className="header">
      <div>
        <div className="breadcrumb">Home / {activePage}</div>
        <h1>{activePage}</h1>
      </div>

      <div className="header-actions">
        <button className="reset-btn" onClick={reset} title="Reset the simulator to its initial state">
          <Icon name="reset" /> Reset
        </button>
      </div>
    </header>
  );
}
