-- ====================================
-- SAFE SETTINGS APP SCHEMA APPLICATION
-- This script ONLY creates Settings app tables
-- WITHOUT affecting existing expense data
-- ====================================

-- Enable UUID extension (safe - won't affect existing data)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- SETTINGS APP TABLES ONLY
-- ====================================

-- Table: roles (Settings app only)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Table: role_permissions (Settings app only) 
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_name VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  granted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(role_id, permission_name, resource_type, resource_id)
);

-- Table: feature_visibility (Settings app only)
CREATE TABLE IF NOT EXISTS feature_visibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  app_id VARCHAR(50) NOT NULL,
  feature_id VARCHAR(100) NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  is_enabled BOOLEAN DEFAULT TRUE,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(role_id, app_id, feature_id)
);

-- Table: user_roles (Settings app only)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  is_primary BOOLEAN DEFAULT FALSE,
  
  UNIQUE(user_id, role_id)
);

-- Table: settings_audit_log (Settings app only)
CREATE TABLE IF NOT EXISTS settings_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- ====================================
-- INDEXES for Performance (Safe)
-- ====================================
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_feature_visibility_role_app ON feature_visibility(role_id, app_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_time ON settings_audit_log(user_id, timestamp);

-- ====================================
-- ROW LEVEL SECURITY (Safe)
-- ====================================

-- Enable RLS only on Settings tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies (these won't affect existing tables)
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
CREATE POLICY "Admins can manage roles" ON roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view active roles" ON roles;
CREATE POLICY "Users can view active roles" ON roles
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;
CREATE POLICY "Admins can manage role permissions" ON role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage feature visibility" ON feature_visibility;
CREATE POLICY "Admins can manage feature visibility" ON feature_visibility
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view their own feature visibility" ON feature_visibility;
CREATE POLICY "Users can view their own feature visibility" ON feature_visibility
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = feature_visibility.role_id
    )
  );

DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
CREATE POLICY "Admins can manage user roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view audit log" ON settings_audit_log;
CREATE POLICY "Admins can view audit log" ON settings_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
    )
  );

-- ====================================
-- FUNCTIONS (Safe - only for Settings)
-- ====================================

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION get_user_primary_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name INTO role_name
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_uuid 
  AND ur.is_primary = TRUE
  AND r.is_active = TRUE
  LIMIT 1;
  
  -- If no primary role, get first active role
  IF role_name IS NULL THEN
    SELECT r.name INTO role_name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid 
    AND r.is_active = TRUE
    ORDER BY ur.assigned_at ASC
    LIMIT 1;
  END IF;
  
  -- Default fallback
  RETURN COALESCE(role_name, 'account_officer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_uuid UUID,
  permission_name TEXT,
  resource_type TEXT,
  resource_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = user_uuid
    AND rp.permission_name = permission_name
    AND rp.resource_type = resource_type
    AND rp.resource_id = resource_id
    AND rp.granted = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit logging function (only for Settings tables)
CREATE OR REPLACE FUNCTION log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO settings_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE 
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
      WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)
      ELSE NULL
    END,
    CASE 
      WHEN TG_OP = 'DELETE' THEN NULL
      ELSE row_to_json(NEW)
    END
  );
  
  RETURN CASE 
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- TRIGGERS (Safe - only for Settings tables)
-- ====================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS roles_audit_trigger ON roles;
DROP TRIGGER IF EXISTS role_permissions_audit_trigger ON role_permissions;
DROP TRIGGER IF EXISTS feature_visibility_audit_trigger ON feature_visibility;
DROP TRIGGER IF EXISTS user_roles_audit_trigger ON user_roles;

-- Create audit triggers for Settings tables only
CREATE TRIGGER roles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON roles
  FOR EACH ROW EXECUTE FUNCTION log_settings_change();

CREATE TRIGGER role_permissions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION log_settings_change();

CREATE TRIGGER feature_visibility_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON feature_visibility
  FOR EACH ROW EXECUTE FUNCTION log_settings_change();

CREATE TRIGGER user_roles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_settings_change();

-- ====================================
-- SEED DATA (Safe - uses ON CONFLICT)
-- ====================================

-- Insert default system roles (safe with ON CONFLICT)
INSERT INTO roles (name, display_name, description, is_system_role, is_active) VALUES
  ('admin', 'Administrator', 'Full system access and user management', TRUE, TRUE),
  ('manager', 'Manager', 'Access to expenses and exam management', TRUE, TRUE),
  ('teacher', 'Teacher', 'Access to exam management and grading', TRUE, TRUE),
  ('account_officer', 'Account Officer', 'Access to expense management only', TRUE, TRUE),
  ('exam_officer', 'Exam Officer', 'Access to exam scheduling and coordination', TRUE, TRUE)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Insert default permissions for admin role (safe)
DO $$
DECLARE
  admin_role_id UUID;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  IF admin_role_id IS NOT NULL THEN
    -- Admin permissions for all apps and features
    INSERT INTO role_permissions (role_id, permission_name, resource_type, resource_id, granted) VALUES
      (admin_role_id, 'full_access', 'app', 'expenses', TRUE),
      (admin_role_id, 'full_access', 'app', 'exams', TRUE),
      (admin_role_id, 'full_access', 'app', 'settings', TRUE),
      (admin_role_id, 'user_management', 'feature', 'settings', TRUE),
      (admin_role_id, 'role_configuration', 'feature', 'settings', TRUE),
      (admin_role_id, 'feature_toggles', 'feature', 'settings', TRUE),
      (admin_role_id, 'system_configuration', 'feature', 'settings', TRUE),
      (admin_role_id, 'backup_restore', 'feature', 'settings', TRUE)
    ON CONFLICT (role_id, permission_name, resource_type, resource_id) DO NOTHING;
  END IF;
END $$;