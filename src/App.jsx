import { useState } from "react";
import { SimulatorProvider } from "./context/SimulatorContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Home from "./pages/Home";
import CpuSimulatorPage from "./pages/CpuSimulatorPage";
import AluSimulatorPage from "./pages/AluSimulatorPage";
import RegistersPage from "./pages/RegistersPage";
import MemoryPage from "./pages/MemoryPage";
import CacheSimulatorPage from "./pages/CacheSimulatorPage";
import InstructionExecutionPage from "./pages/InstructionExecutionPage";
import PerformanceAnalysisPage from "./pages/PerformanceAnalysisPage";
import AboutPage from "./pages/AboutPage";
import "./index.css";

const PAGES = {
  "Home": Home,
  "CPU Simulator": CpuSimulatorPage,
  "ALU Simulator": AluSimulatorPage,
  "Registers": RegistersPage,
  "Memory": MemoryPage,
  "Cache Simulator": CacheSimulatorPage,
  "Instruction Execution": InstructionExecutionPage,
  "Performance Analysis": PerformanceAnalysisPage,
  "About": AboutPage
};

function Shell() {
  const [activePage, setActivePage] = useState("Home");
  const Page = PAGES[activePage] ?? Home;

  return (
    <div className="app">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="main">
        <Header activePage={activePage} />
        <Page goTo={setActivePage} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SimulatorProvider>
      <Shell />
    </SimulatorProvider>
  );
}
