const bcrypt = require('bcryptjs');
const { pool, initDb } = require('../config/db');

const seed = async () => {
  try {
    // Make sure tables and triggers exist
    await initDb();

    console.log('Clearing database tables...');
    await pool.query(
      'TRUNCATE TABLE notifications, maintenance, inspections, extinguishers, users RESTART IDENTITY CASCADE;'
    );

    console.log('Seeding users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const usersResult = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, role, phone)
       VALUES 
       ('Admin', 'User', 'admin@tzw.rw', $1, 'ROLE_ADMIN', '0781000001'),
       ('Inspector', 'One', 'inspector1@tzw.rw', $1, 'ROLE_INSPECTOR', '0781000002'),
       ('Inspector', 'Two', 'inspector2@tzw.rw', $1, 'ROLE_INSPECTOR', '0781000003'),
       ('Regular', 'One', 'user1@tzw.rw', $1, 'ROLE_USER', '0781000004'),
       ('Regular', 'Two', 'user2@tzw.rw', $1, 'ROLE_USER', '0781000005')
       RETURNING id, email, role;`,
      [hashedPassword]
    );

    const users = usersResult.rows;
    const admin = users.find((u) => u.role === 'ROLE_ADMIN');
    const inspector1 = users.find((u) => u.email === 'inspector1@tzw.rw');
    const inspector2 = users.find((u) => u.email === 'inspector2@tzw.rw');
    const user1 = users.find((u) => u.email === 'user1@tzw.rw');
    const user2 = users.find((u) => u.email === 'user2@tzw.rw');

    console.log('Seeding extinguishers...');
    // We need 5 extinguishers
    // Types: WATER/CO2/FOAM/DRY_CHEMICAL
    // Sizes: 2.5LBS/5LBS/9LBS/12LBS
    // Statuses: OPERATIONAL/EXPIRED/DECOMMISSIONED
    // Expiry date cases:
    // - 1 EXPIRED status (past expiry date)
    // - 1 with expiryDate in past but status set to OPERATIONAL (to test auto-expiry on GET)
    // - 1 active with no inspections (to test compliance report)
    // - 2 others (operational with inspections)
    const extinguishersResult = await pool.query(
      `INSERT INTO extinguishers (serial_number, location, type, size, installation_date, expiry_date, status)
       VALUES 
       ('EXT-001', 'Main Hall A', 'CO2', '5LBS', '2023-01-15', '2025-01-15', 'EXPIRED'),
       ('EXT-002', 'Kitchen Area', 'DRY_CHEMICAL', '12LBS', '2023-06-20', '2025-06-20', 'OPERATIONAL'), -- Expiry date in the past, to test auto-expire
       ('EXT-003', 'Server Room', 'CO2', '9LBS', '2025-10-10', '2028-10-10', 'OPERATIONAL'), -- Compliant (with recent COMPLETED inspection in seed)
       ('EXT-004', 'Warehouse B', 'FOAM', '12LBS', '2024-02-12', '2027-02-12', 'OPERATIONAL'), -- Compliant / Non-compliant tests
       ('EXT-005', 'Office C', 'WATER', '2.5LBS', '2025-03-01', '2028-03-01', 'OPERATIONAL') -- No inspections (edge case for compliance)
       RETURNING id, serial_number;`
    );

    const extinguishers = extinguishersResult.rows;
    const ext1 = extinguishers.find((e) => e.serial_number === 'EXT-001');
    const ext2 = extinguishers.find((e) => e.serial_number === 'EXT-002');
    const ext3 = extinguishers.find((e) => e.serial_number === 'EXT-003');
    const ext4 = extinguishers.find((e) => e.serial_number === 'EXT-004');
    const ext5 = extinguishers.find((e) => e.serial_number === 'EXT-005');

    console.log('Seeding inspections...');
    // 3 inspections: 1 SCHEDULED, 1 COMPLETED, 1 CANCELLED
    // Note: status options: SCHEDULED/ONGOING/COMPLETED/CANCELLED
    const inspectionsResult = await pool.query(
      `INSERT INTO inspections (user_id, extinguisher_id, inspector_id, inspection_date, inspection_time, status)
       VALUES 
       ($1, $2, $3, '2026-07-15', '10:00:00', 'SCHEDULED'), -- Will fire notification triggers for user1 and inspector1
       ($4, $5, $6, '2026-05-10', '14:30:00', 'COMPLETED'), -- Completed inspection for EXT-003 (within 12 months)
       ($1, $7, $3, '2026-04-01', '09:00:00', 'CANCELLED')
       RETURNING id, status, extinguisher_id;`,
      [
        user1.id,
        ext2.id,
        inspector1.id,
        user2.id,
        ext3.id,
        inspector2.id,
        ext4.id,
      ]
    );

    const inspections = inspectionsResult.rows;
    const compInspection = inspections.find((i) => i.status === 'COMPLETED');

    console.log('Seeding maintenance records...');
    // 2 maintenance records
    await pool.query(
      `INSERT INTO maintenance (inspection_id, inspector_id, actions, maintenance_date, conditions_noted)
       VALUES 
       ($1, $2, 'Recharged CO2 cylinder, replaced nozzle safety seal.', '2026-05-10', 'Extinguisher pressure was slightly low.'),
       ($3, $4, 'Cleaned external body and bracket assembly.', '2026-05-15', 'Dust accumulation on body.')`,
      [
        compInspection.id,
        inspector2.id,
        compInspection.id, // using the same inspection or just another one
        inspector1.id,
      ]
    );

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  seed();
}

module.exports = seed;
