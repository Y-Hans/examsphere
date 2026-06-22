-- Indexes for ExamSphere
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_deleted_at ON tenants(deleted_at);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);

CREATE INDEX idx_questions_tenant_id ON questions(tenant_id);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_questions_subject_id ON questions(subject_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_deleted_at ON questions(deleted_at);
-- Composite index for tenant isolation + soft delete
CREATE INDEX idx_questions_tenant_deleted ON questions(tenant_id, deleted_at);

CREATE INDEX idx_qv_question_id ON question_versions(question_id);
CREATE INDEX idx_qv_created_at ON question_versions(created_at);

CREATE INDEX idx_qt_question_id ON question_topics(question_id);
CREATE INDEX idx_qt_topic_id ON question_topics(topic_id);

CREATE INDEX idx_qi_question_id ON question_images(question_id);

CREATE INDEX idx_qrl_question_id ON question_review_logs(question_id);

CREATE INDEX idx_tt_tenant_id ON test_templates(tenant_id);
CREATE INDEX idx_tt_exam_id ON test_templates(exam_id);
CREATE INDEX idx_tt_status ON test_templates(status);

CREATE INDEX idx_ts_user_id ON test_sessions(user_id);
CREATE INDEX idx_ts_tenant_id ON test_sessions(tenant_id);
CREATE INDEX idx_ts_template_id ON test_sessions(template_id);
CREATE INDEX idx_ts_status ON test_sessions(status);

CREATE INDEX idx_tresp_session_id ON test_responses(session_id);
CREATE INDEX idx_tresp_question_id ON test_responses(question_id);

CREATE INDEX idx_ps_user_id ON practice_sessions(user_id);
CREATE INDEX idx_ps_tenant_id ON practice_sessions(tenant_id);

CREATE INDEX idx_presp_session_id ON practice_responses(session_id);

CREATE INDEX idx_as_user_id ON analytics_snapshots(user_id);
CREATE INDEX idx_as_tenant_id ON analytics_snapshots(tenant_id);

CREATE INDEX idx_wt_user_id ON weak_topics(user_id);
CREATE INDEX idx_wt_tenant_id ON weak_topics(tenant_id);
CREATE INDEX idx_wt_topic_id ON weak_topics(topic_id);

CREATE INDEX idx_doubts_user_id ON doubts(user_id);
CREATE INDEX idx_doubts_tenant_id ON doubts(tenant_id);
CREATE INDEX idx_doubts_status ON doubts(status);

CREATE INDEX idx_subs_user_id ON subscriptions(user_id);
CREATE INDEX idx_subs_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subs_status ON subscriptions(status);

CREATE INDEX idx_notif_user_id ON notifications(user_id);
CREATE INDEX idx_notif_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notif_status ON notifications(status);

CREATE INDEX idx_audit_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

CREATE INDEX idx_event_tenant_id ON domain_events(tenant_id);
CREATE INDEX idx_event_type ON domain_events(type);
CREATE INDEX idx_event_processed_at ON domain_events(processed_at);