// src/controllers/authController.js
const globalPool = require('../config/globalDb');
const tenantPool = require('../config/tenantDb');
const bcrypt = require('bcrypt');

// 1. The Workspace Lookup (Global DB)
exports.lookupWorkspace = async (req, res) => {
    try {
        const { workspace } = req.query;

        if (!workspace) {
            return res.status(400).json({ error: "Workspace code is required." });
        }

        const result = await globalPool.query(
            'SELECT tenant_api_url, subscription_status FROM workspaces WHERE workspace_code = $1',
            [workspace.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Workspace not found. Check your code." });
        }

        const client = result.rows[0];

        if (client.subscription_status !== 'active') {
            return res.status(403).json({ error: "This workspace is currently suspended." });
        }

        return res.status(200).json({ tenant_api_url: client.tenant_api_url });

    } catch (error) {
        console.error("Lookup Error:", error);
        return res.status(500).json({ error: "Internal server error during lookup." });
    }
};

// 2. Fetch all users for the "Netflix" selection screen (Tenant DB)
exports.getUsers = async (req, res) => {
    try {
        // Only select public information. NEVER pull the pin_hash here!
        const result = await tenantPool.query(
            'SELECT user_id, username, role FROM users WHERE active = TRUE'
        );
        
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Failed to load users" });
    }
};

// 3. The Staff Login / PIN Verification (Tenant DB)
exports.login = async (req, res) => {
    try {
        // The Flutter app will pass the user_id (from the tapped profile) and the typed PIN
        const { userId, pin } = req.body;

        if (!userId || !pin) {
            return res.status(400).json({ error: "User ID and PIN are required." });
        }

        // Fetch the user's hash from the database
        const result = await tenantPool.query(
            'SELECT user_id, username, role, pin_hash FROM users WHERE user_id = $1 AND active = TRUE',
            [userId] 
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found or inactive." });
        }

        const user = result.rows[0];

        // Cryptographically compare the typed PIN with the saved hash
        const isValid = await bcrypt.compare(pin, user.pin_hash);

        if (isValid) {
            return res.status(200).json({ 
                success: true, 
                user: {
                    id: user.user_id,
                    username: user.username,
                    role: user.role
                }
            });
        } else {
            return res.status(401).json({ error: "Invalid PIN." });
        }

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ error: "Internal server error during login." });
    }
};

// 4. Create a new user (Tenant DB)
exports.createUser = async (req, res) => {
  try {
    const { username, pin, role } = req.body;

    if (!username || !pin || !role) {
      return res.status(400).json({ error: 'username, pin and role are required.' });
    }

    if (pin.length < 4) {
      return res.status(400).json({ error: 'PIN must be at least 4 digits.' });
    }

    // Check if username already exists
    const existing = await tenantPool.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    // Hash the PIN the same way login expects it
    const pin_hash = await bcrypt.hash(pin, 10);

    const result = await tenantPool.query(
      `INSERT INTO users (username, pin_hash, role, active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING user_id, username, role, active, created_at`,
      [username, pin_hash, role]
    );

    return res.status(201).json({ message: 'User created successfully.', user: result.rows[0] });
  } catch (error) {
    console.error('Create User Error:', error);
    return res.status(500).json({ error: 'Failed to create user.', details: error.message });
  }
};

// 5. Change a user's PIN (Tenant DB)
exports.changePin = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { new_pin } = req.body;

    if (!new_pin) {
      return res.status(400).json({ error: 'new_pin is required.' });
    }

    if (new_pin.length < 4) {
      return res.status(400).json({ error: 'PIN must be at least 4 digits.' });
    }

    // Check user exists
    const existing = await tenantPool.query(
      'SELECT user_id, username FROM users WHERE user_id = $1',
      [user_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const pin_hash = await bcrypt.hash(new_pin, 10);

    await tenantPool.query(
      'UPDATE users SET pin_hash = $1 WHERE user_id = $2',
      [pin_hash, user_id]
    );

    return res.status(200).json({ message: `PIN updated for ${existing.rows[0].username}.` });
  } catch (error) {
    console.error('Change PIN Error:', error);
    return res.status(500).json({ error: 'Failed to update PIN.', details: error.message });
  }
};

// 6. Toggle user active/inactive (Tenant DB)
exports.toggleUserActive = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'active must be a boolean.' });
    }

    const result = await tenantPool.query(
      `UPDATE users SET active = $1 WHERE user_id = $2
       RETURNING user_id, username, active`,
      [active, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({
      message: `User ${active ? 'activated' : 'deactivated'}.`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle Active Error:', error);
    return res.status(500).json({ error: 'Failed to toggle user status.', details: error.message });
  }
};

// 7. Get all users including inactive (Tenant DB) - for admin management page
exports.getAllUsers = async (req, res) => {
  try {
    const result = await tenantPool.query(
      `SELECT user_id, username, role, active, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    return res.status(200).json({ users: result.rows });
  } catch (error) {
    console.error('Get All Users Error:', error);
    return res.status(500).json({ error: 'Failed to fetch users.', details: error.message });
  }
};