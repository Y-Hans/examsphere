-- Add new partitions for Q2 2025
-- Run this script quarterly to add new partitions for time-based tables

ALTER TABLE test_responses ADD PARTITION test_resp_2025_q2 VALUES LESS THAN (TO_DATE('2025-07-01', 'YYYY-MM-DD'));
ALTER TABLE practice_responses ADD PARTITION prac_resp_2025_q2 VALUES LESS THAN (TO_DATE('2025-07-01', 'YYYY-MM-DD'));
ALTER TABLE audit_logs ADD PARTITION audit_2025_q2 VALUES LESS THAN (TO_DATE('2025-07-01', 'YYYY-MM-DD'));
ALTER TABLE domain_events ADD PARTITION event_2025_q2 VALUES LESS THAN (TO_DATE('2025-07-01', 'YYYY-MM-DD'));

-- Verify partitions
SELECT table_name, partition_name, high_value 
FROM user_tab_partitions 
WHERE table_name IN ('TEST_RESPONSES', 'PRACTICE_RESPONSES', 'AUDIT_LOGS', 'DOMAIN_EVENTS')
ORDER BY table_name, partition_name;
