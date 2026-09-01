import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import { pingDatabase } from "./db.js";
import programRoutes from "./routes/programs.js";
import runRoutes from "./routes/runs.js";
import cacheConfigRoutes from "./routes/cacheConfigs.js";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", async (_req, res) => {
  try {
    await pingDatabase();
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "unreachable", message: err.message });
  }
});

app.use("/api/programs", programRoutes);
app.use("/api/runs", runRoutes);
app.use("/api/cache-configs", cacheConfigRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ARCH-LAB API listening on http://localhost:${PORT}`);
});
