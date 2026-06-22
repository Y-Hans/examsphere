-- Foreign Key Constraints
ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE roles ADD CONSTRAINT fk_roles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE user_roles ADD CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE user_roles ADD CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id);
ALTER TABLE role_permissions ADD CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id);
ALTER TABLE role_permissions ADD CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id);

ALTER TABLE subjects ADD CONSTRAINT fk_subjects_exam FOREIGN KEY (exam_id) REFERENCES exams(id);
ALTER TABLE units ADD CONSTRAINT fk_units_subject FOREIGN KEY (subject_id) REFERENCES subjects(id);
ALTER TABLE chapters ADD CONSTRAINT fk_chapters_unit FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE topics ADD CONSTRAINT fk_topics_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id);
ALTER TABLE concepts ADD CONSTRAINT fk_concepts_topic FOREIGN KEY (topic_id) REFERENCES topics(id);

ALTER TABLE questions ADD CONSTRAINT fk_questions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE questions ADD CONSTRAINT fk_questions_exam FOREIGN KEY (exam_id) REFERENCES exams(id);
ALTER TABLE questions ADD CONSTRAINT fk_questions_subject FOREIGN KEY (subject_id) REFERENCES subjects(id);
ALTER TABLE questions ADD CONSTRAINT fk_questions_user FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE question_versions ADD CONSTRAINT fk_qv_question FOREIGN KEY (question_id) REFERENCES questions(id);
ALTER TABLE question_versions ADD CONSTRAINT fk_qv_user FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE question_topics ADD CONSTRAINT fk_qt_question FOREIGN KEY (question_id) REFERENCES questions(id);
ALTER TABLE question_topics ADD CONSTRAINT fk_qt_topic FOREIGN KEY (topic_id) REFERENCES topics(id);

ALTER TABLE question_tags ADD CONSTRAINT fk_qtg_question FOREIGN KEY (question_id) REFERENCES questions(id);
ALTER TABLE question_tags ADD CONSTRAINT fk_qtg_tag FOREIGN KEY (tag_id) REFERENCES tags(id);

ALTER TABLE question_images ADD CONSTRAINT fk_qi_question FOREIGN KEY (question_id) REFERENCES questions(id);
ALTER TABLE question_review_logs ADD CONSTRAINT fk_qrl_question FOREIGN KEY (question_id) REFERENCES questions(id);
ALTER TABLE question_review_logs ADD CONSTRAINT fk_qrl_user FOREIGN KEY (reviewer_id) REFERENCES users(id);

ALTER TABLE test_templates ADD CONSTRAINT fk_tt_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE test_templates ADD CONSTRAINT fk_tt_exam FOREIGN KEY (exam_id) REFERENCES exams(id);
ALTER TABLE test_templates ADD CONSTRAINT fk_tt_user FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE test_sections ADD CONSTRAINT fk_ts_template FOREIGN KEY (template_id) REFERENCES test_templates(id);
ALTER TABLE test_sections ADD CONSTRAINT fk_ts_subject FOREIGN KEY (subject_id) REFERENCES subjects(id);

ALTER TABLE test_section_questions ADD CONSTRAINT fk_tsq_section FOREIGN KEY (section_id) REFERENCES test_sections(id);
ALTER TABLE test_section_questions ADD CONSTRAINT fk_tsq_question FOREIGN KEY (question_id) REFERENCES questions(id);

ALTER TABLE test_sessions ADD CONSTRAINT fk_tsess_template FOREIGN KEY (template_id) REFERENCES test_templates(id);
ALTER TABLE test_sessions ADD CONSTRAINT fk_tsess_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE test_sessions ADD CONSTRAINT fk_tsess_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Note: For partitioned tables, FKs to partitioned tables are allowed in Oracle 21c+,
-- but FKs *from* partitioned tables to non-partitioned are standard.
ALTER TABLE test_responses ADD CONSTRAINT fk_tresp_session FOREIGN KEY (session_id) REFERENCES test_sessions(id);

ALTER TABLE practice_sessions ADD CONSTRAINT fk_ps_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE practice_sessions ADD CONSTRAINT fk_ps_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE practice_responses ADD CONSTRAINT fk_presp_session FOREIGN KEY (session_id) REFERENCES practice_sessions(id);

ALTER TABLE doubts ADD CONSTRAINT fk_doubts_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE doubts ADD CONSTRAINT fk_doubts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE doubt_responses ADD CONSTRAINT fk_dr_doubt FOREIGN KEY (doubt_id) REFERENCES doubts(id);
ALTER TABLE doubt_responses ADD CONSTRAINT fk_dr_user FOREIGN KEY (author_id) REFERENCES users(id);

-- Unique Constraints
ALTER TABLE tenants ADD CONSTRAINT uq_tenants_subdomain UNIQUE (subdomain);
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);