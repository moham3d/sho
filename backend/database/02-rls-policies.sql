-- Row Level Security (RLS) Policies for Al-Shorouk Radiology Management System
-- Version: 1.0.0
-- Date: 2025-09-24

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE nurse_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create helper functions for role-based access control
CREATE OR REPLACE FUNCTION is_nurse()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_role() = 'nurse';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_role() = 'doctor';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY user_self_select ON users
    FOR SELECT USING (id = current_user_id() OR is_admin());

CREATE POLICY user_self_update ON users
    FOR UPDATE USING (id = current_user_id() OR is_admin());

CREATE POLICY admin_insert_user ON users
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY admin_delete_user ON users
    FOR DELETE USING (is_admin());

-- Patients table policies
CREATE POLICY patient_select_all ON patients
    FOR SELECT USING (is_nurse() OR is_doctor() OR is_admin());

CREATE POLICY patient_insert_nurse_admin ON patients
    FOR INSERT WITH CHECK (is_nurse() OR is_admin());

CREATE POLICY patient_update_nurse_admin ON patients
    FOR UPDATE USING (is_nurse() OR is_admin());

CREATE POLICY patient_delete_admin ON patients
    FOR DELETE USING (is_admin());

-- Visits table policies
CREATE POLICY visit_select_assigned ON visits
    FOR SELECT USING (
        nurse_id = current_user_id() OR
        doctor_id = current_user_id() OR
        is_admin()
    );

CREATE POLICY visit_insert_nurse ON visits
    FOR INSERT WITH CHECK (
        is_nurse() AND
        nurse_id = current_user_id()
    );

CREATE POLICY visit_update_assigned ON visits
    FOR UPDATE USING (
        nurse_id = current_user_id() OR
        doctor_id = current_user_id() OR
        is_admin()
    );

CREATE POLICY visit_delete_admin ON visits
    FOR DELETE USING (is_admin());

-- Nurse forms table policies
CREATE POLICY nurse_form_select_assigned ON nurse_forms
    FOR SELECT USING (
        nurse_id = current_user_id() OR
        is_admin()
    );

CREATE POLICY nurse_form_insert_assigned ON nurse_forms
    FOR INSERT WITH CHECK (
        is_nurse() AND
        nurse_id = current_user_id()
    );

CREATE POLICY nurse_form_update_assigned_draft ON nurse_forms
    FOR UPDATE USING (
        (nurse_id = current_user_id() OR is_admin()) AND
        status = 'draft'
    );

CREATE POLICY nurse_form_delete_admin ON nurse_forms
    FOR DELETE USING (is_admin());

-- Doctor forms table policies
CREATE POLICY doctor_form_select_assigned ON doctor_forms
    FOR SELECT USING (
        doctor_id = current_user_id() OR
        is_admin()
    );

CREATE POLICY doctor_form_insert_assigned ON doctor_forms
    FOR INSERT WITH CHECK (
        is_doctor() AND
        doctor_id = current_user_id()
    );

CREATE POLICY doctor_form_update_assigned_draft ON doctor_forms
    FOR UPDATE USING (
        (doctor_id = current_user_id() OR is_admin()) AND
        status = 'draft'
    );

CREATE POLICY doctor_form_delete_admin ON doctor_forms
    FOR DELETE USING (is_admin());

-- Digital signatures table policies
CREATE POLICY signature_select_own ON digital_signatures
    FOR SELECT USING (
        user_id = current_user_id() OR
        is_admin()
    );

CREATE POLICY signature_insert_own ON digital_signatures
    FOR INSERT WITH CHECK (
        user_id = current_user_id()
    );

CREATE POLICY signature_delete_admin ON digital_signatures
    FOR DELETE USING (is_admin());

-- Audit logs table policies
CREATE POLICY audit_log_select_admin ON audit_logs
    FOR SELECT USING (is_admin());

-- Grant role-based permissions
GRANT web_anon TO nurse_user;
GRANT web_anon TO doctor_user;
GRANT web_anon TO admin_user;

-- Create function to check if user can access patient data
CREATE OR REPLACE FUNCTION can_access_patient(patient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Admin can access all patients
    IF is_admin() THEN
        RETURN true;
    END IF;

    -- Nurse can access patients they created or assigned to their visits
    IF is_nurse() THEN
        RETURN EXISTS (
            SELECT 1 FROM patients p
            LEFT JOIN visits v ON p.id = v.patient_id
            WHERE p.id = can_access_patient.patient_id
            AND (v.nurse_id = current_user_id())
        );
    END IF;

    -- Doctor can access patients assigned to their visits
    IF is_doctor() THEN
        RETURN EXISTS (
            SELECT 1 FROM visits v
            WHERE v.patient_id = can_access_patient.patient_id
            AND v.doctor_id = current_user_id()
        );
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can modify visit
CREATE OR REPLACE FUNCTION can_modify_visit(visit_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Admin can modify all visits
    IF is_admin() THEN
        RETURN true;
    END IF;

    -- Nurse can modify visits they created (only if not signed)
    IF is_nurse() THEN
        RETURN EXISTS (
            SELECT 1 FROM visits v
            LEFT JOIN nurse_forms nf ON v.id = nf.visit_id
            WHERE v.id = can_modify_visit.visit_id
            AND v.nurse_id = current_user_id()
            AND (nf.status IS NULL OR nf.status = 'draft')
        );
    END IF;

    -- Doctor can modify visits assigned to them (only if not signed)
    IF is_doctor() THEN
        RETURN EXISTS (
            SELECT 1 FROM visits v
            LEFT JOIN doctor_forms df ON v.id = df.visit_id
            WHERE v.id = can_modify_visit.visit_id
            AND v.doctor_id = current_user_id()
            AND (df.status IS NULL OR df.status = 'draft')
        );
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to enforce visit status transitions
CREATE OR REPLACE FUNCTION validate_visit_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Only allow specific status transitions
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        CASE
            WHEN OLD.status = 'draft' THEN
                IF NEW.status NOT IN ('in_progress', 'nurse_signed') THEN
                    RAISE EXCEPTION 'Invalid status transition from draft to %', NEW.status;
                END IF;
            WHEN OLD.status = 'in_progress' THEN
                IF NEW.status NOT IN ('nurse_signed', 'doctor_signed') THEN
                    RAISE EXCEPTION 'Invalid status transition from in_progress to %', NEW.status;
                END IF;
            WHEN OLD.status = 'nurse_signed' THEN
                IF NEW.status NOT IN ('doctor_signed', 'completed') THEN
                    RAISE EXCEPTION 'Invalid status transition from nurse_signed to %', NEW.status;
                END IF;
            WHEN OLD.status = 'doctor_signed' THEN
                IF NEW.status NOT IN ('completed') THEN
                    RAISE EXCEPTION 'Invalid status transition from doctor_signed to %', NEW.status;
                END IF;
            WHEN OLD.status = 'completed' THEN
                RAISE EXCEPTION 'Cannot change status from completed';
            ELSE
                RAISE EXCEPTION 'Unknown status: %', OLD.status;
        END CASE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply status transition trigger
CREATE TRIGGER validate_visit_status_transition_trigger
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION validate_visit_status_transition();

-- Create function to prevent modification of signed forms
CREATE OR REPLACE FUNCTION prevent_signed_form_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'signed' AND NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Cannot modify signed form';
    END IF;

    IF OLD.status = 'signed' AND (OLD.assessment_data IS DISTINCT FROM NEW.assessment_data OR OLD.evaluation_data IS DISTINCT FROM NEW.evaluation_data) THEN
        RAISE EXCEPTION 'Cannot modify data of signed form';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply form modification triggers
CREATE TRIGGER prevent_nurse_form_modification
    BEFORE UPDATE ON nurse_forms
    FOR EACH ROW
    EXECUTE FUNCTION prevent_signed_form_modification();

CREATE TRIGGER prevent_doctor_form_modification
    BEFORE UPDATE ON doctor_forms
    FOR EACH ROW
    EXECUTE FUNCTION prevent_signed_form_modification();

-- Create function to audit sensitive operations
CREATE OR REPLACE FUNCTION audit_sensitive_operation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, ip_address, user_agent)
        VALUES (
            current_user_id(),
            'DELETE_' || UPPER(TG_TABLE_NAME),
            TG_TABLE_NAME,
            OLD.id,
            jsonb_build_object(
                'data', row_to_json(OLD)
            ),
            current_setting('app.client_ip', true),
            current_setting('app.user_agent', true)
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log updates to sensitive fields
        IF TG_TABLE_NAME IN ('users', 'patients', 'visits', 'nurse_forms', 'doctor_forms') THEN
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
            VALUES (
                current_user_id(),
                'UPDATE_' || UPPER(TG_TABLE_NAME),
                TG_TABLE_NAME,
                NEW.id,
                jsonb_build_object(
                    'data', row_to_json(OLD)
                ),
                jsonb_build_object(
                    'data', row_to_json(NEW)
                ),
                current_setting('app.client_ip', true),
                current_setting('app.user_agent', true)
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME IN ('users', 'patients', 'visits', 'nurse_forms', 'doctor_forms', 'digital_signatures') THEN
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent)
            VALUES (
                current_user_id(),
                'CREATE_' || UPPER(TG_TABLE_NAME),
                TG_TABLE_NAME,
                NEW.id,
                jsonb_build_object(
                    'data', row_to_json(NEW)
                ),
                current_setting('app.client_ip', true),
                current_setting('app.user_agent', true)
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_operation();

CREATE TRIGGER audit_patients_changes
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_operation();

CREATE TRIGGER audit_visits_changes
    AFTER INSERT OR UPDATE OR DELETE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_operation();

CREATE TRIGGER audit_nurse_forms_changes
    AFTER INSERT OR UPDATE OR DELETE ON nurse_forms
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_operation();

CREATE TRIGGER audit_doctor_forms_changes
    AFTER INSERT OR UPDATE OR DELETE ON doctor_forms
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_operation();

CREATE TRIGGER audit_signatures_changes
    AFTER INSERT OR DELETE ON digital_signatures
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_operation();

-- Create view for users with their effective permissions
CREATE VIEW user_permissions AS
SELECT
    u.id,
    u.username,
    u.role,
    u.is_active,
    CASE
        WHEN u.role = 'admin' THEN 'full_access'
        WHEN u.role = 'nurse' THEN 'patient_management,visit_management,nurse_forms'
        WHEN u.role = 'doctor' THEN 'visit_management,doctor_forms'
        ELSE 'limited'
    END as permissions
FROM users u
WHERE u.is_active = true;

-- Grant permissions on views
GRANT SELECT ON user_permissions TO admin_user;

-- RLS policies setup complete
SELECT 'Row Level Security policies created successfully' as status;