// Real cache-mapping simulation: direct / N-way-set-associative / fully-associative,
// backed by whatever bytes currently live in main memory.

export function createCacheState(config, memory) {
  return configureCache(config, memory);
}

export function configureCache({ cacheSize, blockSize, mapping }, memory) {
  const safeBlockSize = Math.max(1, Math.min(memory.length, Math.floor(Number(blockSize) || 1)));
  const safeCacheSize = Math.max(safeBlockSize, Math.floor(Number(cacheSize) || safeBlockSize));
  const numLines = Math.max(1, Math.floor(safeCacheSize / safeBlockSize));

  let ways;
  if (mapping === "Direct") ways = 1;
  else if (mapping === "2-Way") ways = 2;
  else if (mapping === "4-Way") ways = 4;
  else ways = numLines; // Fully Associative
  ways = Math.max(1, Math.min(ways, numLines));

  const sets = Math.max(1, Math.ceil(numLines / ways));

  const lines = Array.from({ length: numLines }, (_, id) => ({
    id,
    setIndex: Math.floor(id / ways),
    valid: false,
    tag: null,
    data: []
  }));

  return {
    config: { cacheSize: safeCacheSize, blockSize: safeBlockSize, mapping, numLines, ways, sets },
    lines,
    accesses: 0,
    hits: 0,
    misses: 0,
    cpuAccesses: 0,
    cpuHits: 0,
    cpuMisses: 0,
    replacement: new Array(sets).fill(0),
    lastResult: null,
    lastCpuResult: null
  };
}

export function cacheAccess(cacheState, address, memory, options = {}) {
  if (!Number.isInteger(address) || address < 0 || address >= memory.length) {
    throw new RangeError(`Cache address must be between 0 and ${memory.length - 1}`);
  }
  const { blockSize, sets } = cacheState.config;
  const blockIndex = Math.floor(address / blockSize);
  const setIndex = blockIndex % sets;
  const tag = Math.floor(blockIndex / sets);

  const candidates = cacheState.lines.filter(l => l.setIndex === setIndex);
  const hitLine = candidates.find(l => l.valid && l.tag === tag);

  const lines = cacheState.lines.map(l => ({ ...l }));
  const replacement = [...cacheState.replacement];
  let outcome;
  let selectedLine = hitLine;

  if (hitLine) {
    outcome = "Hit";
  } else {
    let victim = candidates.find(l => !l.valid);
    if (!victim) {
      // simple round-robin replacement (pseudo-LRU) when the set is full
      victim = candidates[replacement[setIndex] % candidates.length];
      replacement[setIndex] = (replacement[setIndex] + 1) % candidates.length;
    }
    const blockStart = blockIndex * blockSize;
    const data = [];
    for (let i = 0; i < blockSize; i++) {
      data.push(memory[blockStart + i] ?? 0);
    }
    const idx = lines.findIndex(l => l.id === victim.id);
    lines[idx] = { ...lines[idx], valid: true, tag, data };
    selectedLine = lines[idx];
    outcome = "Miss";
  }

  const selectedIndex = lines.findIndex(line => line.id === selectedLine.id);
  const offset = address % blockSize;
  if (options.type === "write") {
    const data = [...lines[selectedIndex].data];
    data[offset] = Number(options.value) & 0xff;
    lines[selectedIndex] = { ...lines[selectedIndex], data };
  }
  const value = options.type === "write" ? Number(options.value) & 0xff : lines[selectedIndex].data[offset] ?? 0;

  const accesses = cacheState.accesses + 1;
  const hits = cacheState.hits + (outcome === "Hit" ? 1 : 0);
  const misses = cacheState.misses + (outcome === "Miss" ? 1 : 0);
  const isCpu = options.source === "cpu";
  const lastResult = { address, outcome, setIndex, tag, value, type: options.type ?? "read", source: options.source ?? "manual" };

  return {
    ...cacheState,
    lines,
    accesses,
    hits,
    misses,
    cpuAccesses: cacheState.cpuAccesses + (isCpu ? 1 : 0),
    cpuHits: cacheState.cpuHits + (isCpu && outcome === "Hit" ? 1 : 0),
    cpuMisses: cacheState.cpuMisses + (isCpu && outcome === "Miss" ? 1 : 0),
    replacement,
    lastResult,
    lastCpuResult: isCpu ? lastResult : cacheState.lastCpuResult
  };
}

export function cacheRatios(cacheState) {
  const { accesses, hits, misses } = cacheState;
  if (accesses === 0) return { hitRatio: 0, missRatio: 0 };
  return {
    hitRatio: (hits / accesses) * 100,
    missRatio: (misses / accesses) * 100
  };
}

export function cpuCacheRatios(cacheState) {
  const { cpuAccesses, cpuHits, cpuMisses } = cacheState;
  if (cpuAccesses === 0) return { hitRatio: 0, missRatio: 0 };
  return { hitRatio: (cpuHits / cpuAccesses) * 100, missRatio: (cpuMisses / cpuAccesses) * 100 };
}
