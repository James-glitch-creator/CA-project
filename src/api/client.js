// No login: every visitor shares the same public library of saved programs,
// cache presets and performance reports. The backend enforces no per-user
// scoping, so there's nothing to authenticate here.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error("Could not reach the ARCH-LAB API. Is the backend running?");
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  health: () => request("/health"),

  listPrograms: () => request("/programs"),
  createProgram: payload => request("/programs", { method: "POST", body: payload }),
  updateProgram: (id, payload) => request(`/programs/${id}`, { method: "PUT", body: payload }),
  deleteProgram: id => request(`/programs/${id}`, { method: "DELETE" }),

  listRuns: () => request("/runs"),
  createRun: payload => request("/runs", { method: "POST", body: payload }),
  deleteRun: id => request(`/runs/${id}`, { method: "DELETE" }),

  listCacheConfigs: () => request("/cache-configs"),
  createCacheConfig: payload => request("/cache-configs", { method: "POST", body: payload })
};
