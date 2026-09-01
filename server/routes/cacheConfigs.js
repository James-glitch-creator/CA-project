import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, cache_size, block_size, mapping, created_at FROM cache_configs ORDER BY created_at DESC"
    );
    res.json({ cacheConfigs: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, cacheSize, blockSize, mapping } = req.body || {};
    if (!name || !cacheSize || !blockSize || !["Direct", "Assoc"].includes(mapping)) {
      return res.status(400).json({ error: "name, cacheSize, blockSize and a valid mapping are required." });
    }
    const [result] = await pool.query(
      "INSERT INTO cache_configs (name, cache_size, block_size, mapping) VALUES (:name, :cacheSize, :blockSize, :mapping)",
      { name, cacheSize, blockSize, mapping }
    );
    res.status(201).json({ id: result.insertId, name, cacheSize, blockSize, mapping });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM cache_configs WHERE id = :id", { id: req.params.id });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Cache config not found." });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
