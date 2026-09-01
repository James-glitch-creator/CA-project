-- Architecture Simulator (ARCH-LAB) database schema
-- MySQL 8+
-- Run with: mysql -u root -p < schema.sql
--
-- No accounts / no login: every table here is a shared, public library that
-- any visitor can read from and write to.

CREATE DATABASE IF NOT EXISTS arch_lab
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE arch_lab;

-- ---------------------------------------------------------------------------
-- programs: assembly source saved from the Instruction Execution page.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS programs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  source      TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- cache_configs: named presets from the Cache Simulator page
-- (mapping / cache size / block size).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cache_configs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  cache_size  INT UNSIGNED NOT NULL,
  block_size  INT UNSIGNED NOT NULL,
  mapping     ENUM('Direct', 'Assoc') NOT NULL DEFAULT 'Direct',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- runs: one saved "Performance Analysis" report — the summary metrics plus
-- the full fetch/decode/execute log, stored as JSON so the whole history
-- table on the frontend (step / instruction / cycles / state changes) can be
-- replayed later without recomputation.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS runs (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  program_id             INT UNSIGNED NULL,
  program_name           VARCHAR(150) NOT NULL,
  cycles                 INT UNSIGNED NOT NULL,
  instructions_executed  INT UNSIGNED NOT NULL,
  cpi                    DECIMAL(10,4) NOT NULL,
  mips                   DECIMAL(12,4) NOT NULL,
  execution_time_us      DECIMAL(16,4) NOT NULL,
  cache_hit_ratio        DECIMAL(6,2) NULL,
  cache_miss_ratio       DECIMAL(6,2) NULL,
  log                    JSON NOT NULL,
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_runs_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
) ENGINE=InnoDB;
