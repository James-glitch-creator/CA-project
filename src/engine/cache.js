// Real cache-mapping simulation: direct / N-way-set-associative / fully-associative,
// backed by whatever bytes currently live in main memory.

export function createCacheState(config, memory) {
  return configureCache(config, memory);
}

export function configureCache({ cacheSize, blockSize, mapping }, memory) {
  const safeCacheSize = Math.max(blockSize, cacheSize);
  const numLines = Math.max(1, Math.floor(safeCacheSize / blockSize));

  let ways;
  if (mapping === "Direct") ways = 1;
  else if (mapping === "2-Way") ways = 2;
  else if (mapping === "4-Way") ways = 4;
  else ways = numLines; // Fully Associative
  ways = Math.max(1, Math.min(ways, numLines));

  const sets = Math.max(1, Math.floor(numLines / ways));

  const lines = Array.from({ length: numLines }, (_, id) => ({
    id,
    setIndex: id % sets,
    valid: false,
    tag: null,
    data: []
  }));

  return {
    config: { cacheSize: safeCacheSize, blockSize, mapping, numLines, ways, sets },
    lines,
    accesses: 0,
    hits: 0,
    misses: 0,
    lastResult: null,
    memoryRef: memory
  };
}

export function cacheAccess(cacheState, address, memory) {
  const { blockSize, sets } = cacheState.config;
  const blockIndex = Math.floor(address / blockSize);
  const setIndex = blockIndex % sets;
  const tag = Math.floor(blockIndex / sets);

  const candidates = cacheState.lines.filter(l => l.setIndex === setIndex);
  const hitLine = candidates.find(l => l.valid && l.tag === tag);

  const lines = cacheState.lines.map(l => ({ ...l }));
  let outcome;

  if (hitLine) {
    outcome = "Hit";
  } else {
    let victim = candidates.find(l => !l.valid);
    if (!victim) {
      // simple round-robin replacement (pseudo-LRU) when the set is full
      victim = candidates[cacheState.accesses % candidates.length];
    }
    const blockStart = blockIndex * blockSize;
    const data = [];
    for (let i = 0; i < blockSize; i++) {
      data.push(memory[(blockStart + i) % memory.length] ?? 0);
    }
    const idx = lines.findIndex(l => l.id === victim.id);
    lines[idx] = { ...lines[idx], valid: true, tag, data };
    outcome = "Miss";
  }

  const accesses = cacheState.accesses + 1;
  const hits = cacheState.hits + (outcome === "Hit" ? 1 : 0);
  const misses = cacheState.misses + (outcome === "Miss" ? 1 : 0);

  return {
    ...cacheState,
    lines,
    accesses,
    hits,
    misses,
    lastResult: { address, outcome, setIndex, tag }
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
