import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { SAMPLE_PROGRAM } from "../engine/constants";
import { createSimulatorState, computeStats } from "../engine/simulator";
import { configureCache, cacheAccess, cacheRatios, cpuCacheRatios } from "../engine/cache";
import { createMachineState, stepMachine } from "../engine/machine";

function buildInitialState() {
  const { cpu, cache } = createMachineState(SAMPLE_PROGRAM);
  return {
    cpu,
    cpuHistory: [],
    cache,
    cacheHistory: [],
    clockSpeedMs: 550
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "STEP": {
      const next = stepMachine({ cpu: state.cpu, cache: state.cache });
      return {
        ...state,
        ...next,
        cpuHistory: [...state.cpuHistory, { cpu: state.cpu, cache: state.cache }],
        cacheHistory: next.cache !== state.cache ? [] : state.cacheHistory
      };
    }
    case "STEP_BACK": {
      if (state.cpuHistory.length === 0) return state;
      const prev = state.cpuHistory[state.cpuHistory.length - 1];
      return { ...state, cpu: { ...prev.cpu, running: false }, cache: prev.cache, cpuHistory: state.cpuHistory.slice(0, -1), cacheHistory: [] };
    }
    case "SET_RUNNING":
      return { ...state, cpu: { ...state.cpu, running: action.running } };
    case "LOAD_PROGRAM": {
      const cpu = createSimulatorState(action.text);
      return { ...state, cpu, cpuHistory: [], cacheHistory: [], cache: configureCache(state.cache.config, cpu.memory) };
    }
    case "LOAD_AND_RUN": {
      const initial = createSimulatorState(action.text);
      const cpu = { ...initial, running: initial.status.type !== "error" && initial.program.length > 0 };
      return { ...state, cpu, cpuHistory: [], cacheHistory: [], cache: configureCache(state.cache.config, cpu.memory) };
    }
    case "RESET": {
      const cpu = createSimulatorState(state.cpu.programText);
      return { ...state, cpu, cpuHistory: [], cacheHistory: [], cache: configureCache(state.cache.config, cpu.memory) };
    }
    case "CACHE_CONFIGURE":
      return { ...state, cache: configureCache(action.config, state.cpu.memory), cacheHistory: [], cpuHistory: [] };
    case "CACHE_ACCESS":
      return {
        ...state,
        cache: cacheAccess(state.cache, action.address, state.cpu.memory),
        cacheHistory: [...state.cacheHistory, state.cache],
        cpuHistory: []
      };
    case "CACHE_STEP_BACK": {
      if (state.cacheHistory.length === 0) return state;
      const prev = state.cacheHistory[state.cacheHistory.length - 1];
      return { ...state, cache: prev, cacheHistory: state.cacheHistory.slice(0, -1) };
    }
    case "CACHE_RESET":
      return { ...state, cache: configureCache(state.cache.config, state.cpu.memory), cacheHistory: [], cpuHistory: [] };
    case "SET_CLOCK_SPEED":
      return { ...state, clockSpeedMs: action.ms };
    default:
      return state;
  }
}

const SimulatorCtx = createContext(null);

export function SimulatorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  const intervalRef = useRef(null);

  const step = useCallback(() => dispatch({ type: "STEP" }), []);
  const stepBack = useCallback(() => dispatch({ type: "STEP_BACK" }), []);

  const run = useCallback(() => {
    if (state.cpu.phase === "halted" || state.cpu.status.type === "error" || state.cpu.program.length === 0) return;
    dispatch({ type: "SET_RUNNING", running: true });
  }, [state.cpu.phase]);

  const pause = useCallback(() => dispatch({ type: "SET_RUNNING", running: false }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const loadProgram = useCallback(text => dispatch({ type: "LOAD_PROGRAM", text }), []);
  const loadAndRun = useCallback(text => dispatch({ type: "LOAD_AND_RUN", text }), []);
  const setClockSpeed = useCallback(ms => dispatch({ type: "SET_CLOCK_SPEED", ms }), []);

  const cacheConfigure = useCallback(config => dispatch({ type: "CACHE_CONFIGURE", config }), []);
  const cacheAccessAddr = useCallback(address => dispatch({ type: "CACHE_ACCESS", address }), []);
  const cacheReset = useCallback(() => dispatch({ type: "CACHE_RESET" }), []);
  const cacheStepBack = useCallback(() => dispatch({ type: "CACHE_STEP_BACK" }), []);

  useEffect(() => {
    if (state.cpu.running && state.cpu.phase !== "halted") {
      intervalRef.current = setInterval(() => dispatch({ type: "STEP" }), state.clockSpeedMs);
    }
    return () => clearInterval(intervalRef.current);
  }, [state.cpu.running, state.cpu.phase, state.clockSpeedMs]);

  const stats = useMemo(() => computeStats(state.cpu), [state.cpu]);
  const cacheStats = useMemo(() => cacheRatios(state.cache), [state.cache]);
  const cpuCacheStats = useMemo(() => cpuCacheRatios(state.cache), [state.cache]);

  const value = useMemo(() => ({
    ...state,
    stats,
    cacheStats,
    cpuCacheStats,
    canStepBack: state.cpuHistory.length > 0,
    canCacheStepBack: state.cacheHistory.length > 0,
    step,
    stepBack,
    run,
    pause,
    reset,
    loadProgram,
    loadAndRun,
    setClockSpeed,
    cacheConfigure,
    cacheAccessAddr,
    cacheReset,
    cacheStepBack
  }), [state, stats, cacheStats, cpuCacheStats, step, stepBack, run, pause, reset, loadProgram, loadAndRun, setClockSpeed, cacheConfigure, cacheAccessAddr, cacheReset, cacheStepBack]);

  return <SimulatorCtx.Provider value={value}>{children}</SimulatorCtx.Provider>;
}

export function useSimulator() {
  const ctx = useContext(SimulatorCtx);
  if (!ctx) throw new Error("useSimulator must be used within SimulatorProvider");
  return ctx;
}
