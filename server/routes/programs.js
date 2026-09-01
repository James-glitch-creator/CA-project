import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, source, created_at, updated_at FROM programs ORDER BY updated_at DESC"
    );
    res.json({ programs: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, source, created_at, updated_at FROM programs WHERE id = :id",
      { id: req.params.id }
    );
    if (rows.length === 0) return res.status(404).json({ error: "Program not found." });
    res.json({ program: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, source } = req.body || {};
    if (!name || !source) {
      return res.status(400).json({ error: "name and source are required." });
    }
    const [result] = await pool.query(
      "INSERT INTO programs (name, source) VALUES (:name, :source)",
      { name, source }
    );
    res.status(201).json({ id: result.insertId, name, source });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { name, source } = req.body || {};
    if (!name || !source) {
      return res.status(400).json({ error: "name and source are required." });
    }
    const [result] = await pool.query(
      "UPDATE programs SET name = :name, source = :source WHERE id = :id",
      { id: req.params.id, name, source }
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Program not found." });
    res.json({ id: Number(req.params.id), name, source });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM programs WHERE id = :id", { id: req.params.id });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Program not found." });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
