-- V2__seed_demo_data.sql
-- Seed 20 Members, Users, and Initial Transactions

-- Users:
-- leader: admin123 ($2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi or populated via DataInitializer)
-- member: member123
INSERT INTO users (username, password_hash, full_name, role, phone, active, created_at, updated_at)
VALUES 
('leader', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Rama Krishna (Leader)', 'LEADER', '9876543210', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('member', '$2a$10$7EqJtq98hPqEX7fNZaFWoOeh6w3kL1w5t0mY.8nC.1f8yUqZ89QeK', 'Sita Devi (Member View)', 'MEMBER', '9876543211', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 20 Sample Village Members
INSERT INTO members (name, phone, address, active, notes, created_at, updated_at) VALUES
('Ravi', '9848011001', 'East Street, Ward 1', true, 'Shopkeeper', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Suresh', '9848011002', 'Bazaar Street, Ward 1', true, 'Dairy Farmer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Kumar', '9848011003', 'Temple Road, Ward 2', true, 'Carpenter', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Ramesh', '9848011004', 'North Street, Ward 2', true, 'Farmer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Prasad', '9848011005', 'South Street, Ward 2', true, 'Tailor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Mahesh', '9848011006', 'Main Bazaar, Ward 3', true, 'Vegetable Vendor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Srinu', '9848011007', 'School Road, Ward 3', true, 'Auto Driver', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Naresh', '9848011008', 'Post Office Street, Ward 3', true, 'Teacher', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Kiran', '9848011009', 'Old Well Street, Ward 4', true, 'Farmer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Arun', '9848011010', 'Panchayat Road, Ward 4', true, 'Electrician', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Venu', '9848011011', 'East Street, Ward 1', true, 'Mason', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Anand', '9848011012', 'West Street, Ward 4', true, 'Rice Mill Worker', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Raj', '9848011013', 'Main Road, Ward 5', true, 'Painter', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Shiva', '9848011014', 'Temple Street, Ward 5', true, 'Priest Assistant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Ganesh', '9848011015', 'Lake View, Ward 5', true, 'Fisherman', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Babu', '9848011016', 'North Street, Ward 6', true, 'Welder', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Satish', '9848011017', 'South Street, Ward 6', true, 'Mechanic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Vinod', '9848011018', 'Bus Stand Road, Ward 6', true, 'Driver', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Ajay', '9848011019', 'Hospital Road, Ward 7', true, 'Pharmacy Assistant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Venkat', '9848011020', 'Hill Road, Ward 7', true, 'Grocery Store Owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Month 1 (August 2026) - Completed Cycle
INSERT INTO monthly_cycles (cycle_name, month_date, start_date, end_date, opening_balance, lending_amount, reserve_amount, chunk_amount, number_of_chunks, closing_balance, status, notes, created_at, closed_at)
VALUES 
('August 2026', '2026-08-01', '2026-08-01', '2026-08-31', 50000.00, 50000.00, 0.00, 5000.00, 10, 54500.00, 'CLOSED', 'Successful first month with 10 members', '2026-08-01 09:00:00', '2026-08-31 18:00:00');

-- Month 2 (September 2026) - Current Active Open Cycle
INSERT INTO monthly_cycles (cycle_name, month_date, start_date, end_date, opening_balance, lending_amount, reserve_amount, chunk_amount, number_of_chunks, closing_balance, status, notes, created_at)
VALUES 
('September 2026', '2026-09-01', '2026-09-01', '2026-09-30', 54500.00, 50000.00, 4500.00, 5000.00, 10, NULL, 'OPEN', 'Leader decided to lend 50,000 and retain 4,500 reserve', '2026-09-01 10:00:00');

-- Active Loans for September 2026 Cycle (Cycle ID 2)
INSERT INTO loans (cycle_id, member_id, chunk_number, principal_amount, interest_amount, total_due, amount_paid, remaining_amount, due_date, status, notes, created_at, updated_at) VALUES
(2, 1, 1, 5000.00, 500.00, 5500.00, 5500.00, 0.00, '2026-09-25', 'PAID', 'Chunk 1', '2026-09-01 10:30:00', '2026-09-05 14:00:00'),
(2, 2, 2, 5000.00, 500.00, 5500.00, 5500.00, 0.00, '2026-09-25', 'PAID', 'Chunk 2', '2026-09-01 10:30:00', '2026-09-06 16:30:00'),
(2, 3, 3, 5000.00, 600.00, 5600.00, 3000.00, 2600.00, '2026-09-25', 'PARTIALLY_PAID', 'Chunk 3', '2026-09-01 10:30:00', '2026-09-08 11:00:00'),
(2, 4, 4, 5000.00, 500.00, 5500.00, 0.00, 5500.00, '2026-09-25', 'PENDING', 'Chunk 4', '2026-09-01 10:30:00', '2026-09-01 10:30:00'),
(2, 5, 5, 5000.00, 500.00, 5500.00, 0.00, 5500.00, '2026-09-25', 'PENDING', 'Chunk 5', '2026-09-01 10:30:00', '2026-09-01 10:30:00'),
(2, 6, 6, 5000.00, 500.00, 5500.00, 2500.00, 3000.00, '2026-09-25', 'PARTIALLY_PAID', 'Chunk 6', '2026-09-01 10:30:00', '2026-09-10 15:45:00'),
(2, 11, 7, 5000.00, 500.00, 5500.00, 0.00, 5500.00, '2026-09-25', 'PENDING', 'Chunk 7 (Venu)', '2026-09-01 10:30:00', '2026-09-01 10:30:00'),
(2, 12, 8, 5000.00, 600.00, 5600.00, 0.00, 5600.00, '2026-09-25', 'PENDING', 'Chunk 8 (Anand)', '2026-09-01 10:30:00', '2026-09-01 10:30:00'),
(2, 14, 9, 5000.00, 500.00, 5500.00, 5500.00, 0.00, '2026-09-25', 'PAID', 'Chunk 9 (Shiva)', '2026-09-01 10:30:00', '2026-09-11 12:15:00'),
(2, 15, 10, 5000.00, 500.00, 5500.00, 0.00, 5500.00, '2026-09-25', 'PENDING', 'Chunk 10 (Ganesh)', '2026-09-01 10:30:00', '2026-09-01 10:30:00');

-- Payments recorded for September 2026
INSERT INTO payments (loan_id, member_id, cycle_id, amount, principal_portion, interest_portion, payment_date, recorded_by, notes, created_at) VALUES
(1, 1, 2, 5500.00, 5000.00, 500.00, '2026-09-05 14:00:00', 'leader', 'Full repayment received in cash', '2026-09-05 14:00:00'),
(2, 2, 2, 5500.00, 5000.00, 500.00, '2026-09-06 16:30:00', 'leader', 'Full repayment via UPI transfer', '2026-09-06 16:30:00'),
(3, 3, 2, 3000.00, 3000.00, 0.00, '2026-09-08 11:00:00', 'leader', 'First installment paid, promises rest before 25th', '2026-09-08 11:00:00'),
(6, 6, 2, 2500.00, 2500.00, 0.00, '2026-09-10 15:45:00', 'leader', 'Partial payment received', '2026-09-10 15:45:00'),
(9, 14, 2, 5500.00, 5000.00, 500.00, '2026-09-11 12:15:00', 'leader', 'Full settlement received', '2026-09-11 12:15:00');

-- Complete Ledger Audit Trail
INSERT INTO ledger_transactions (cycle_id, transaction_type, amount, running_balance, reference_type, reference_id, description, transaction_date, created_by, created_at) VALUES
(1, 'OPENING_BALANCE', 50000.00, 50000.00, 'CYCLE', 1, 'Initial Group Capital Fund', '2026-08-01 09:00:00', 'leader', '2026-08-01 09:00:00'),
(1, 'LOAN_DISBURSEMENT', -50000.00, 0.00, 'CYCLE', 1, 'Lent 10 chunks of ₹5,000 for August 2026', '2026-08-01 10:00:00', 'leader', '2026-08-01 10:00:00'),
(1, 'LOAN_REPAYMENT', 54500.00, 54500.00, 'CYCLE', 1, 'All August 2026 loans and interest collected in full', '2026-08-31 17:30:00', 'leader', '2026-08-31 17:30:00'),
(2, 'OPENING_BALANCE', 0.00, 54500.00, 'CYCLE', 2, 'September 2026 Opening Balance carried from August', '2026-09-01 09:30:00', 'leader', '2026-09-01 09:30:00'),
(2, 'LOAN_DISBURSEMENT', -50000.00, 4500.00, 'CYCLE', 2, 'Lent 10 chunks of ₹5,000 for September (Reserve: ₹4,500)', '2026-09-01 10:45:00', 'leader', '2026-09-01 10:45:00'),
(2, 'LOAN_REPAYMENT', 5500.00, 10000.00, 'PAYMENT', 1, 'Repayment received from Ravi (Principal: ₹5,000, Interest: ₹500)', '2026-09-05 14:00:00', 'leader', '2026-09-05 14:00:00'),
(2, 'LOAN_REPAYMENT', 5500.00, 15500.00, 'PAYMENT', 2, 'Repayment received from Suresh (Principal: ₹5,000, Interest: ₹500)', '2026-09-06 16:30:00', 'leader', '2026-09-06 16:30:00'),
(2, 'LOAN_REPAYMENT', 3000.00, 18500.00, 'PAYMENT', 3, 'Partial repayment received from Kumar (Principal: ₹3,000)', '2026-09-08 11:00:00', 'leader', '2026-09-08 11:00:00'),
(2, 'LOAN_REPAYMENT', 2500.00, 21000.00, 'PAYMENT', 4, 'Partial repayment received from Mahesh (Principal: ₹2,500)', '2026-09-10 15:45:00', 'leader', '2026-09-10 15:45:00'),
(2, 'LOAN_REPAYMENT', 5500.00, 26500.00, 'PAYMENT', 5, 'Repayment received from Shiva (Principal: ₹5,000, Interest: ₹500)', '2026-09-11 12:15:00', 'leader', '2026-09-11 12:15:00');

-- Audit Logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, created_at) VALUES
('leader', 'CREATE_CYCLE', 'MONTHLY_CYCLE', '1', NULL, 'August 2026 with opening ₹50,000', '127.0.0.1', '2026-08-01 09:00:00'),
('leader', 'CLOSE_CYCLE', 'MONTHLY_CYCLE', '1', 'OPEN', 'CLOSED with closing balance ₹54,500', '127.0.0.1', '2026-08-31 18:00:00'),
('leader', 'CREATE_CYCLE', 'MONTHLY_CYCLE', '2', NULL, 'September 2026: Lent ₹50,000, Reserve ₹4,500', '127.0.0.1', '2026-09-01 10:00:00'),
('leader', 'RECORD_PAYMENT', 'PAYMENT', '1', 'Due: 5500, Remaining: 5500', 'Paid: 5500, Status: PAID', '127.0.0.1', '2026-09-05 14:00:00'),
('leader', 'RECORD_PAYMENT', 'PAYMENT', '2', 'Due: 5500, Remaining: 5500', 'Paid: 5500, Status: PAID', '127.0.0.1', '2026-09-06 16:30:00'),
('leader', 'RECORD_PAYMENT', 'PAYMENT', '3', 'Due: 5600, Remaining: 5600', 'Paid: 3000, Status: PARTIALLY_PAID, Remaining: 2600', '127.0.0.1', '2026-09-08 11:00:00'),
('leader', 'RECORD_PAYMENT', 'PAYMENT', '4', 'Due: 5500, Remaining: 5500', 'Paid: 2500, Status: PARTIALLY_PAID, Remaining: 3000', '127.0.0.1', '2026-09-10 15:45:00'),
('leader', 'RECORD_PAYMENT', 'PAYMENT', '5', 'Due: 5500, Remaining: 5500', 'Paid: 5500, Status: PAID', '127.0.0.1', '2026-09-11 12:15:00');
