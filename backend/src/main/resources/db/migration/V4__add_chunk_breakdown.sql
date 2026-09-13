-- V4__add_chunk_breakdown.sql
-- Support mixed chunk denominations (e.g. 10k and 5k chunks) in a single monthly cycle

ALTER TABLE monthly_cycles ADD COLUMN chunk_breakdown VARCHAR(200);
ALTER TABLE monthly_cycles ALTER COLUMN chunk_amount DROP NOT NULL;
