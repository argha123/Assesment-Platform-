const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');

/**
 * Log an action to the audit_log table.
 * @param {object} opts
 * @param {string} opts.action - e.g. 'create', 'update', 'delete', 'login', 'complete'
 * @param {string} opts.entity_type - e.g. 'account', 'assessment', 'user', 'question'
 * @param {string} [opts.entity_id] - ID of the affected entity
 * @param {string} [opts.user_id] - ID of the acting user
 * @param {string} [opts.user_name] - Name of the acting user
 * @param {string} [opts.details] - Human-readable description
 * @param {string} [opts.ip_address] - Request IP
 */
function logAudit({ action, entity_type, entity_id, user_id, user_name, details, ip_address }) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_log (id, user_id, user_name, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      user_id || null,
      user_name || null,
      action,
      entity_type || null,
      entity_id || null,
      details || null,
      ip_address || null
    );
  } catch (e) {
    // Never let audit logging break the main flow
    console.error('Audit log write failed:', e.message);
  }
}

/**
 * Express middleware that attaches a helper to req so routes can easily log.
 */
function auditMiddleware(req, res, next) {
  req.audit = (opts) => {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
    logAudit({
      ...opts,
      user_id: opts.user_id || req.user?.id || null,
      user_name: opts.user_name || req.user?.name || null,
      ip_address: opts.ip_address || ip
    });
  };
  next();
}

module.exports = { logAudit, auditMiddleware };
