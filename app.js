const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'alshorouk-radiology-secret-key-2025';

// Initialize database
const db = new sqlite3.Database('./radiology.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based authorization middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Initialize database tables
function initializeDatabase() {
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('nurse','doctor','admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Patients table
    `CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      national_id TEXT UNIQUE,
      medical_number TEXT,
      full_name TEXT NOT NULL,
      mobile TEXT,
      dob DATE,
      age INTEGER,
      gender TEXT CHECK (gender IN ('male','female','other')),
      diagnosis TEXT,
      contact_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Visits table
    `CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      nurse_id INTEGER,
      doctor_id INTEGER,
      visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','signed','closed')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (nurse_id) REFERENCES users(id),
      FOREIGN KEY (doctor_id) REFERENCES users(id)
    )`,

    // Nurse forms table (COMPLETE - all fields from documentation)
    `CREATE TABLE IF NOT EXISTS nurse_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_id INTEGER NOT NULL,
      nurse_id INTEGER NOT NULL,

      -- Basic screening fields
      arrival_mode TEXT,
      chief_complaint TEXT,
      age_text TEXT,
      accompanied_by TEXT,
      language_spoken TEXT,

      -- Vital signs
      temp TEXT,
      pulse TEXT,
      bp TEXT,
      resp_rate TEXT,
      o2_saturation TEXT,
      blood_sugar TEXT,
      weight TEXT,
      height TEXT,

      -- Psychosocial assessment
      psychosocial_history TEXT,
      psychological_problem TEXT,
      special_habits TEXT,
      allergies TEXT,
      allergies_details TEXT,

      -- Nutritional screening
      diet TEXT,
      appetite TEXT,
      gi_problems BOOLEAN,
      gi_problems_details TEXT,
      weight_loss BOOLEAN,
      weight_gain BOOLEAN,
      refer_to_nutritionist BOOLEAN,

      -- Functional assessment
      self_care_status TEXT,
      feeding_status TEXT,
      hygiene_status TEXT,
      toileting_status TEXT,
      ambulation_status TEXT,
      musculoskeletal_notes TEXT,
      pain_musculoskeletal TEXT,
      use_of_assistive_equipment TEXT,

      -- Educational needs (JSON)
      educational_needs TEXT,

      education_notes TEXT,

      -- Pain assessment
      pain_present BOOLEAN,
      pain_intensity TEXT,
      pain_location TEXT,
      pain_frequency TEXT,
      pain_duration TEXT,
      pain_character TEXT,
      pain_action_taken TEXT,

      -- Fall risk assessment
      fall_risk_score INTEGER,
      fall_risk_details TEXT,

      -- Specialized assessments
      elderly_assessment TEXT,
      disabled_assessment TEXT,

      -- Form management
      temporary BOOLEAN DEFAULT 1,
      signed BOOLEAN DEFAULT 0,
      signature_data TEXT,
      signed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
      FOREIGN KEY (nurse_id) REFERENCES users(id)
    )`,

    // Doctor forms table (COMPLETE - all fields from documentation)
    `CREATE TABLE IF NOT EXISTS doctor_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,

      -- Patient information
      patient_full_name TEXT,
      exam_date DATE,
      mobile TEXT,
      medical_number TEXT,
      dob DATE,
      age INTEGER,
      gender TEXT,
      diagnosis TEXT,

      -- Study information
      study_reason TEXT,
      splint_present BOOLEAN,
      splint_notes TEXT,
      chronic_disease TEXT,
      pacemaker BOOLEAN,
      implants TEXT,
      pregnancy_status TEXT,
      pain_numbness BOOLEAN,
      pain_site TEXT,
      spinal_deformity BOOLEAN,
      spinal_deformity_details TEXT,
      swelling BOOLEAN,
      swelling_site TEXT,
      neuro_symptoms TEXT,
      fever BOOLEAN,
      surgeries TEXT,
      tumor_history TEXT,
      previous_investigations TEXT,
      previous_disc BOOLEAN,
      meds_increase_fall_risk BOOLEAN,
      current_medication TEXT,

      -- Technical radiology parameters
      ctd1vol TEXT,
      dlp TEXT,
      kv TEXT,
      mas TEXT,

      -- Clinical findings (space for interpretation)
      findings TEXT,

      -- Signatures
      patient_signature TEXT,
      doctor_signature TEXT,
      doctor_signed_at DATETIME,

      -- Form management
      temporary BOOLEAN DEFAULT 1,
      signed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES users(id)
    )`
  ];

  tables.forEach(sql => {
    db.run(sql, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      }
    });
  });

  // Create default users if they don't exist
  createDefaultUsers();
}

// Create default users for testing
function createDefaultUsers() {
  const defaultUsers = [
    { name: 'Admin User', username: 'admin', password: 'admin', role: 'admin' },
    { name: 'Nurse User', username: 'nurse', password: 'nurse', role: 'nurse' },
    { name: 'Doctor User', username: 'doctor', password: 'doctor', role: 'doctor' }
  ];

  defaultUsers.forEach(user => {
    bcrypt.hash(user.password, 10, (err, hash) => {
      if (err) return;

      db.run(
        'INSERT OR IGNORE INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)',
        [user.name, user.username, hash, user.role]
      );
    });
  });
}

// API Routes

// Authentication
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  });
});

// Patients CRUD
app.get('/api/patients', authenticate, (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM patients';
  let params = [];

  if (search) {
    sql += ' WHERE full_name LIKE ? OR national_id LIKE ? OR medical_number LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  sql += ' ORDER BY created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/patients', authenticate, authorize(['nurse', 'admin']), (req, res) => {
  const { national_id, medical_number, full_name, mobile, dob, age, gender, diagnosis, contact_info } = req.body;

  db.run(
    `INSERT INTO patients (national_id, medical_number, full_name, mobile, dob, age, gender, diagnosis, contact_info)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [national_id, medical_number, full_name, mobile, dob, age, gender, diagnosis, JSON.stringify(contact_info)],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/patients/:id', authenticate, (req, res) => {
  db.get('SELECT * FROM patients WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Patient not found' });
    res.json(row);
  });
});

app.put('/api/patients/:id', authenticate, authorize(['nurse', 'admin']), (req, res) => {
  const { national_id, medical_number, full_name, mobile, dob, age, gender, diagnosis, contact_info } = req.body;

  db.run(
    `UPDATE patients SET
     national_id = ?, medical_number = ?, full_name = ?, mobile = ?, dob = ?, age = ?, gender = ?, diagnosis = ?, contact_info = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [national_id, medical_number, full_name, mobile, dob, age, gender, diagnosis, JSON.stringify(contact_info), req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

// Visits CRUD
app.get('/api/visits', authenticate, (req, res) => {
  let sql = `
    SELECT v.*, p.full_name as patient_name, n.name as nurse_name, d.name as doctor_name
    FROM visits v
    LEFT JOIN patients p ON v.patient_id = p.id
    LEFT JOIN users n ON v.nurse_id = n.id
    LEFT JOIN users d ON v.doctor_id = d.id
  `;

  // Role-based filtering
  if (req.user.role === 'nurse') {
    sql += ' WHERE v.nurse_id = ? OR v.nurse_id IS NULL';
  } else if (req.user.role === 'doctor') {
    sql += ' WHERE v.doctor_id = ? OR v.doctor_id IS NULL';
  }

  sql += ' ORDER BY v.created_at DESC';

  const params = req.user.role === 'nurse' || req.user.role === 'doctor' ? [req.user.id] : [];

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/visits', authenticate, authorize(['nurse', 'admin']), (req, res) => {
  const { patient_id, notes } = req.body;

  db.run(
    'INSERT INTO visits (patient_id, nurse_id, notes) VALUES (?, ?, ?)',
    [patient_id, req.user.id, notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/visits/:id', authenticate, (req, res) => {
  const { doctor_id, status, notes } = req.body;

  // Only allow updates by assigned users or admins
  if (req.user.role !== 'admin') {
    db.get('SELECT nurse_id, doctor_id FROM visits WHERE id = ?', [req.params.id], (err, visit) => {
      if (err || (!visit || (visit.nurse_id !== req.user.id && visit.doctor_id !== req.user.id))) {
        return res.status(403).json({ error: 'Not authorized to update this visit' });
      }
      updateVisit();
    });
  } else {
    updateVisit();
  }

  function updateVisit() {
    let sql = 'UPDATE visits SET updated_at = CURRENT_TIMESTAMP';
    let params = [];

    if (doctor_id !== undefined) sql += ', doctor_id = ?';
    if (status !== undefined) sql += ', status = ?';
    if (notes !== undefined) sql += ', notes = ?';

    sql += ' WHERE id = ?';
    params = params.concat([doctor_id, status, notes, req.params.id].filter(x => x !== undefined));

    db.run(sql, params, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    });
  }
});

// Nurse Forms
app.get('/api/nurse-forms/:visitId', authenticate, (req, res) => {
  db.get('SELECT * FROM nurse_forms WHERE visit_id = ?', [req.params.visitId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

app.post('/api/nurse-forms', authenticate, authorize(['nurse', 'admin']), (req, res) => {
  const formData = req.body;

  // Build dynamic INSERT statement with all fields
  const fields = Object.keys(formData).filter(key => key !== 'id');
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map(key => {
    // Handle JSON fields
    if (['educational_needs', 'fall_risk_details', 'elderly_assessment', 'disabled_assessment'].includes(key)) {
      return JSON.stringify(formData[key]);
    }
    return formData[key];
  });

  const sql = `INSERT INTO nurse_forms (${fields.join(', ')}) VALUES (${placeholders})`;

  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.put('/api/nurse-forms/:id', authenticate, authorize(['nurse', 'admin']), (req, res) => {
  const formData = req.body;

  // Check if user owns this form
  db.get('SELECT nurse_id, signed FROM nurse_forms WHERE id = ?', [req.params.id], (err, form) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!form) return res.status(404).json({ error: 'Form not found' });
    if (form.nurse_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this form' });
    }
    if (form.signed) return res.status(400).json({ error: 'Cannot edit signed form' });

    updateForm();
  });

  function updateForm() {
    const fields = Object.keys(formData).filter(key => key !== 'id');
    const setClause = fields.map(key => `${key} = ?`).join(', ');
    const values = fields.map(key => {
      if (['educational_needs', 'fall_risk_details', 'elderly_assessment', 'disabled_assessment'].includes(key)) {
        return JSON.stringify(formData[key]);
      }
      return formData[key];
    });

    values.push(req.params.id);

    const sql = `UPDATE nurse_forms SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    db.run(sql, values, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    });
  }
});

// Doctor Forms
app.get('/api/doctor-forms/:visitId', authenticate, (req, res) => {
  db.get('SELECT * FROM doctor_forms WHERE visit_id = ?', [req.params.visitId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

app.post('/api/doctor-forms', authenticate, authorize(['doctor', 'admin']), (req, res) => {
  const formData = req.body;

  const fields = Object.keys(formData).filter(key => key !== 'id');
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map(key => formData[key]);

  const sql = `INSERT INTO doctor_forms (${fields.join(', ')}) VALUES (${placeholders})`;

  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.put('/api/doctor-forms/:id', authenticate, authorize(['doctor', 'admin']), (req, res) => {
  const formData = req.body;

  db.get('SELECT doctor_id, signed FROM doctor_forms WHERE id = ?', [req.params.id], (err, form) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!form) return res.status(404).json({ error: 'Form not found' });
    if (form.doctor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this form' });
    }
    if (form.signed) return res.status(400).json({ error: 'Cannot edit signed form' });

    updateForm();
  });

  function updateForm() {
    const fields = Object.keys(formData).filter(key => key !== 'id');
    const setClause = fields.map(key => `${key} = ?`).join(', ');
    const values = fields.map(key => formData[key]);

    values.push(req.params.id);

    const sql = `UPDATE doctor_forms SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    db.run(sql, values, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    });
  }
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Al-Shorouk Radiology Management System running on port ${PORT}`);
  console.log('Access at: http://localhost:' + PORT);
  console.log('Default users:');
  console.log('  Admin: admin / admin');
  console.log('  Nurse: nurse / nurse');
  console.log('  Doctor: doctor / doctor');
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});