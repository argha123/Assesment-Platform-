const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = 'assessment-platform-secret-key-2024';
const JWT_EXPIRES_IN = '7d';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const VALID_ROLES = ['admin', 'assessor', 'reviewer', 'client'];

// Privilege catalogue (expandable). Used by the UI to render permission toggles.
const VALID_PRIVILEGES = [
  'run_individual_assessment',
  'run_collaborative_assessment',
  'manage_action_items',
  'manage_evidence',
  'manage_risks',
  'view_reports',
  'manage_compliance',
  'manage_knowledge_base',
  'manage_users',
  'view_audit_log'
];

const ROLE_DEFAULT_PRIVILEGES = {
  admin: VALID_PRIVILEGES,
  assessor: [
    'run_individual_assessment',
    'run_collaborative_assessment',
    'manage_action_items',
    'manage_evidence',
    'manage_risks',
    'view_reports',
    'manage_knowledge_base'
  ],
  reviewer: ['view_reports', 'manage_action_items'],
  client: ['view_reports']
};

function safeParsePrivileges(raw, role) {
  if (!raw) return ROLE_DEFAULT_PRIVILEGES[role] || [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : (ROLE_DEFAULT_PRIVILEGES[role] || []);
  } catch { return ROLE_DEFAULT_PRIVILEGES[role] || []; }
}

function projectUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar,
    department: row.department,
    last_login: row.last_login,
    is_active: row.is_active,
    created_at: row.created_at,
    privileges: safeParsePrivileges(row.privileges, row.role)
  };
}

/* =========================================================
   Public auth endpoints
   ========================================================= */

// Self-registration (assessor/reviewer/client only — admin must be created by another admin)
router.post('/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const requested = role && VALID_ROLES.includes(role) ? role : 'assessor';
    // Public registration cannot self-promote to admin
    const userRole = requested === 'admin' ? 'assessor' : requested;

    const db = getDb();
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ error: 'Email already registered.' });

    const hashed = bcrypt.hashSync(password, 10);
    const userId = uuidv4();
    const privileges = JSON.stringify(ROLE_DEFAULT_PRIVILEGES[userRole] || []);

    db.prepare(`INSERT INTO users (id, name, email, password, role, privileges) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(userId, name, email, hashed, userRole, privileges);

    const token = jwt.sign({ userId, email, role: userRole }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const user = projectUser(db.prepare('SELECT * FROM users WHERE id = ?').get(userId));

    req.audit({ action: 'register', entity_type: 'user', entity_id: userId, user_id: userId, user_name: name, details: `New user registered with role "${userRole}"` });

    res.status(201).json({ message: 'User registered successfully.', token, user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    if (!user.is_active) return res.status(403).json({ error: 'Account is deactivated. Contact an administrator.' });
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    req.audit({ action: 'login', entity_type: 'user', entity_id: user.id, user_id: user.id, user_name: user.name, details: `User logged in` });

    res.json({ message: 'Login successful.', token, user: projectUser(fresh) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/* =========================================================
   Forgot / reset password (public)
   ========================================================= */

// Request a reset token. Always returns 200 to avoid leaking which emails exist.
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    let resetToken = null;
    if (user) {
      // Invalidate previous unused tokens for this user
      db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0').run(user.id);
      resetToken = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
      db.prepare(`INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`)
        .run(uuidv4(), user.id, resetToken, expiresAt);
    }

    // In production we'd email the link. For this demo we return the token in dev mode
    // so the operator can complete the flow without an email service.
    res.json({
      message: 'If an account exists for that email, a reset link has been generated.',
      // Demo helper — exposes the token for development; in production this MUST NOT be returned.
      reset_token: process.env.NODE_ENV === 'production' ? undefined : resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to start password reset.' });
  }
});

// Complete the reset
router.post('/reset-password', (req, res) => {
  try {
    const { token, new_password } = req.body || {};
    if (!token || !new_password) return res.status(400).json({ error: 'Token and new password are required.' });
    if (new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const db = getDb();
    const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(token);
    if (!row) return res.status(400).json({ error: 'Invalid or expired reset token.' });
    if (row.used) return res.status(400).json({ error: 'This reset token has already been used.' });
    if (new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired. Request a new one.' });
    }

    const hashed = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, row.user_id);
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(row.id);
    res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

/* =========================================================
   Authenticated user endpoints
   ========================================================= */

router.get('/me', authenticate, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: projectUser(user) });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user information.' });
  }
});

// Update own profile (name / avatar / department / email)
router.put('/profile', authenticate, (req, res) => {
  try {
    const { name, avatar, department, email } = req.body;
    const db = getDb();

    const updates = [];
    const values = [];
    if (name !== undefined)       { updates.push('name = ?');       values.push(name); }
    if (avatar !== undefined)     { updates.push('avatar = ?');     values.push(avatar); }
    if (department !== undefined) { updates.push('department = ?'); values.push(department); }
    if (email !== undefined && email !== req.user.email) {
      const taken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
      if (taken) return res.status(409).json({ error: 'Email already registered to another user.' });
      updates.push('email = ?'); values.push(email);
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });

    values.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Profile updated successfully.', user: projectUser(updated) });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Change own password (requires current password)
router.put('/password', authenticate, (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }
    const db = getDb();
    const row = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    if (!row || !bcrypt.compareSync(current_password, row.password)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(new_password, 10), req.user.id);
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

/* =========================================================
   Admin user management
   ========================================================= */

// Privilege catalogue — used by the UI to render checkboxes
router.get('/privileges', authenticate, authorize('admin'), (req, res) => {
  res.json({ privileges: VALID_PRIVILEGES, defaults: ROLE_DEFAULT_PRIVILEGES });
});

// List users (admin)
router.get('/users', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    res.json({ users: rows.map(projectUser) });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users.' });
  }
});

// Create user (admin)
router.post('/users', authenticate, authorize('admin'), (req, res) => {
  try {
    const { name, email, password, role, department, privileges, is_active } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const userRole = role && VALID_ROLES.includes(role) ? role : 'assessor';
    const db = getDb();
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ error: 'Email already registered.' });

    const userId = uuidv4();
    const finalPrivileges = Array.isArray(privileges)
      ? privileges.filter(p => VALID_PRIVILEGES.includes(p))
      : (ROLE_DEFAULT_PRIVILEGES[userRole] || []);

    db.prepare(`INSERT INTO users (id, name, email, password, role, department, privileges, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(userId, name, email, bcrypt.hashSync(password, 10), userRole,
        department || null, JSON.stringify(finalPrivileges),
        is_active === false ? 0 : 1);

    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    req.audit({ action: 'create', entity_type: 'user', entity_id: userId, details: `Admin created user "${name}" with role "${userRole}"` });
    res.status(201).json({ message: 'User created.', user: projectUser(created) });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// Generic admin update (name, email, department, role, privileges, is_active)
router.put('/users/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    const { name, email, department, role, privileges, is_active } = req.body || {};
    const updates = [];
    const values = [];

    if (name !== undefined)       { updates.push('name = ?');       values.push(name); }
    if (department !== undefined) { updates.push('department = ?'); values.push(department); }

    if (email !== undefined && email !== target.email) {
      const taken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
      if (taken) return res.status(409).json({ error: 'Email already registered to another user.' });
      updates.push('email = ?'); values.push(email);
    }

    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role.' });
      if (target.id === req.user.id && role !== target.role) {
        return res.status(400).json({ error: 'Cannot change your own role.' });
      }
      updates.push('role = ?'); values.push(role);
    }

    if (privileges !== undefined) {
      if (!Array.isArray(privileges)) return res.status(400).json({ error: 'privileges must be an array.' });
      const sanitized = privileges.filter(p => VALID_PRIVILEGES.includes(p));
      updates.push('privileges = ?'); values.push(JSON.stringify(sanitized));
    }

    if (is_active !== undefined) {
      if (target.id === req.user.id && !is_active) {
        return res.status(400).json({ error: 'Cannot deactivate your own account.' });
      }
      updates.push('is_active = ?'); values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });

    values.push(id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    req.audit({ action: 'update', entity_type: 'user', entity_id: id, details: `Admin updated user "${updated.name}" (${updates.length} fields)` });
    res.json({ message: 'User updated.', user: projectUser(updated) });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// Backwards-compat: change role only
router.put('/users/:id/role', authenticate, authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }
    const db = getDb();
    const target = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot change your own role.' });
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.json({ message: 'User role updated successfully.', user: projectUser(updated) });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// Admin reset password — sets a new password directly
router.put('/users/:id/password', authenticate, authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body || {};
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }
    const db = getDb();
    const target = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(new_password, 10), id);
    req.audit({ action: 'update', entity_type: 'user', entity_id: id, details: `Admin reset password for user` });
    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Admin password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Delete a user (admin only, not self)
router.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account.' });
    const db = getDb();
    const target = db.prepare('SELECT name FROM users WHERE id = ?').get(id);
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'User not found.' });
    req.audit({ action: 'delete', entity_type: 'user', entity_id: id, details: `Admin deleted user "${target?.name || 'unknown'}"` });
    res.json({ message: 'User deleted.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

module.exports = router;
