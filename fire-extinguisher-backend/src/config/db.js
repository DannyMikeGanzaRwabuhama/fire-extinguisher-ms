const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fire_extinguisher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PG client', err);
});

const query = (text, params) => pool.query(text, params);

const initDb = async () => {
  console.log('Initializing database tables...');
  
  // Table creation script in proper order
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      phone VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS extinguishers (
      id SERIAL PRIMARY KEY,
      serial_number VARCHAR(100) UNIQUE NOT NULL,
      location VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      size VARCHAR(50) NOT NULL,
      installation_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'OPERATIONAL'
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      extinguisher_id INTEGER REFERENCES extinguishers(id) ON DELETE CASCADE,
      inspector_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      inspection_date DATE NOT NULL,
      inspection_time TIME NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
      CONSTRAINT unique_extinguisher_datetime UNIQUE (extinguisher_id, inspection_date, inspection_time)
    );

    CREATE TABLE IF NOT EXISTS maintenance (
      id SERIAL PRIMARY KEY,
      inspection_id INTEGER REFERENCES inspections(id) ON DELETE CASCADE,
      inspector_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      actions TEXT NOT NULL,
      maintenance_date DATE NOT NULL,
      conditions_noted TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      is_read BOOLEAN NOT NULL DEFAULT FALSE
    );
  `;
  
  await pool.query(createTablesSql);
  console.log('Database tables created/checked successfully.');
  
  // Now run the trigger file
  await runTriggerSql();
};

const runTriggerSql = async () => {
  try {
    const triggerPath = path.join(__dirname, '../triggers/inspection_trigger.sql');
    if (fs.existsSync(triggerPath)) {
      console.log('Applying triggers from inspection_trigger.sql...');
      const triggerSql = fs.readFileSync(triggerPath, 'utf8');
      await pool.query(triggerSql);
      console.log('Triggers applied successfully.');
    } else {
      console.warn('Warning: inspection_trigger.sql file not found at', triggerPath);
    }
  } catch (error) {
    console.error('Error applying triggers:', error);
    throw error;
  }
};

module.exports = {
  query,
  pool,
  initDb,
};
