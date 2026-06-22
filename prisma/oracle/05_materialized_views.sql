-- Materialized Views for Analytics
-- Requires CREATE MATERIALIZED VIEW privilege

CREATE MATERIALIZED VIEW mv_user_topic_accuracy
REFRESH COMPLETE ON DEMAND
START WITH SYSDATE NEXT (SYSDATE + 1/24) -- Refresh every hour
AS
SELECT
    pr.tenant_id,
    ps.user_id,
    qt.topic_id,
    COUNT(pr.id) as total_attempts,
    SUM(CASE WHEN pr.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
    ROUND(AVG(pr.time_spent_sec), 2) as avg_time_sec
FROM practice_responses pr
JOIN practice_sessions ps ON pr.session_id = ps.id
JOIN question_topics qt ON pr.question_id = qt.question_id
GROUP BY pr.tenant_id, ps.user_id, qt.topic_id;

CREATE MATERIALIZED VIEW mv_question_usage_stats
REFRESH COMPLETE ON DEMAND
START WITH SYSDATE NEXT (SYSDATE + 1/96) -- Refresh every 15 minutes
AS
SELECT
    q.tenant_id,
    q.id as question_id,
    q.difficulty,
    COUNT(tr.id) as total_attempts,
    SUM(CASE WHEN tr.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
    ROUND(AVG(tr.time_spent_sec), 2) as avg_time_sec
FROM questions q
LEFT JOIN test_responses tr ON q.id = tr.question_id
WHERE q.deleted_at IS NULL
GROUP BY q.tenant_id, q.id, q.difficulty;

CREATE MATERIALIZED VIEW mv_tenant_daily_active
REFRESH COMPLETE ON DEMAND
START WITH SYSDATE NEXT (SYSDATE + 1/24) -- Refresh every hour
AS
SELECT
    tenant_id,
    TRUNC(created_at) as activity_date,
    COUNT(DISTINCT user_id) as active_users
FROM (
    SELECT tenant_id, user_id, created_at FROM test_sessions WHERE deleted_at IS NULL
    UNION ALL
    SELECT tenant_id, user_id, created_at FROM practice_sessions
)
GROUP BY tenant_id, TRUNC(created_at);