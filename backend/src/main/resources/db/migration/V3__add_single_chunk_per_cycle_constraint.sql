-- V3__add_single_chunk_per_cycle_constraint.sql
-- Enforce village business rule: A person cannot take more than one chunk of loan in a single month

ALTER TABLE loans ADD CONSTRAINT uk_loans_cycle_member UNIQUE (cycle_id, member_id);
