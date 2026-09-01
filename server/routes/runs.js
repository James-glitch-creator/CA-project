import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const [rows] = await pool.query(
      `SELECT id, program_id, program_name, cycles, instructions_executed, cpi, mips,
              execution_time_us, cache_hit_ratio, cache_miss_ratio, created_at
       FROM runs ORDER BY created_at DESC LIMIT :limit`,
      { limit }
    );
    res.json({ runs: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM runs WHERE id = :id", { id: req.params.id });
    if (rows.length === 0) return res.status(404).json({ error: "Run not found." });
    res.json({ run: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      programId = null,
      programName,
      cycles,
      instructionsExecuted,
      cpi,
      mips,
      executionTimeUs,
      cacheHitRatio = null,
      cacheMissRatio = null,
      log = []
    } = req.body || {};

    if (!programName || cycles == null || instructionsExecuted == null || cpi == null || mips == null || executionTimeUs == null) {
      return res.status(400).json({ error: "Missing required run fields." });
    }

    const [result] = await pool.query(
      `INSERT INTO runs
        (program_id, program_name, cycles, instructions_executed, cpi, mips,
         execution_time_us, cache_hit_ratio, cache_miss_ratio, log)
       VALUES
        (:programId, :programName, :cycles, :instructionsExecuted, :cpi, :mips,
         :executionTimeUs, :cacheHitRatio, :cacheMissRatio, CAST(:log AS JSON))`,
      {
        programId,
        programName,
        cycles,
        instructionsExecuted,
        cpi,
        mips,
        executionTimeUs,
        cacheHitRatio,
        cacheMissRatio,
        log: JSON.stringify(log)
      }
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM runs WHERE id = :id", { id: req.params.id });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Run not found." });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
