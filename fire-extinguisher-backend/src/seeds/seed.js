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
    const inspector1 = users.find((u) => u.email === 'inspector1@tzw.rw');
    const inspector2 = users.find((u) => u.email === 'inspector2@tzw.rw');
    const user1 = users.find((u) => u.email === 'user1@tzw.rw');
    const user2 = users.find((u) => u.email === 'user2@tzw.rw');

    console.log('Seeding extinguishers...');
    // We need 15 extinguishers
    const extinguishersResult = await pool.query(
      `INSERT INTO extinguishers (serial_number, location, type, size, installation_date, expiry_date, status)
       VALUES 
       ('EXT-001', 'Main Hall A', 'CO2', '5LBS', '2023-01-15', '2025-01-15', 'EXPIRED'),
       ('EXT-002', 'Kitchen Area', 'DRY_CHEMICAL', '12LBS', '2023-06-20', '2025-06-20', 'OPERATIONAL'), -- Expired date, operational status to test auto-expire
       ('EXT-003', 'Server Room', 'CO2', '9LBS', '2025-10-10', '2028-10-10', 'OPERATIONAL'),
       ('EXT-004', 'Warehouse B', 'FOAM', '12LBS', '2024-02-12', '2027-02-12', 'OPERATIONAL'),
       ('EXT-005', 'Office C', 'WATER', '2.5LBS', '2025-03-01', '2028-03-01', 'OPERATIONAL'),
       ('EXT-006', 'Main Lobby', 'DRY_CHEMICAL', '5LBS', '2024-05-15', '2027-05-15', 'OPERATIONAL'),
       ('EXT-007', 'Corridor D', 'WATER', '9LBS', '2024-08-20', '2027-08-20', 'OPERATIONAL'),
       ('EXT-008', 'Staff Room', 'FOAM', '5LBS', '2024-09-01', '2027-09-01', 'DECOMMISSIONED'),
       ('EXT-009', 'Electrical Closet', 'CO2', '5LBS', '2024-10-15', '2027-10-15', 'OPERATIONAL'),
       ('EXT-010', 'Loading Dock', 'DRY_CHEMICAL', '12LBS', '2024-11-20', '2027-11-20', 'OPERATIONAL'),
       ('EXT-011', 'Reception Area', 'WATER', '2.5LBS', '2024-12-05', '2027-12-05', 'OPERATIONAL'),
       ('EXT-012', 'Conference Room A', 'CO2', '9LBS', '2025-01-10', '2028-01-10', 'OPERATIONAL'),
       ('EXT-013', 'Cafeteria', 'FOAM', '9LBS', '2025-02-18', '2028-02-18', 'OPERATIONAL'),
       ('EXT-014', 'Parking Level 1', 'DRY_CHEMICAL', '12LBS', '2025-03-22', '2028-03-22', 'OPERATIONAL'),
       ('EXT-015', 'Parking Level 2', 'DRY_CHEMICAL', '12LBS', '2025-04-10', '2028-04-10', 'OPERATIONAL')
       RETURNING id, serial_number;`
    );

    const extinguishers = extinguishersResult.rows;
    const getExtId = (sn) => extinguishers.find((e) => e.serial_number === sn).id;

    console.log('Seeding inspections...');
    const inspections = [];

    const addInspection = async (userId, extId, inspectorId, date, time, status) => {
      const res = await pool.query(
        `INSERT INTO inspections (user_id, extinguisher_id, inspector_id, inspection_date, inspection_time, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, status`,
        [userId, extId, inspectorId, date, time, status]
      );
      inspections.push(res.rows[0]);
    };

    await addInspection(user1.id, getExtId('EXT-003'), inspector1.id, '2026-05-10', '14:30:00', 'COMPLETED');
    await addInspection(user1.id, getExtId('EXT-004'), inspector2.id, '2026-05-12', '10:00:00', 'COMPLETED');
    await addInspection(user2.id, getExtId('EXT-005'), inspector1.id, '2026-05-14', '11:00:00', 'COMPLETED');
    await addInspection(user2.id, getExtId('EXT-006'), inspector2.id, '2026-05-15', '09:00:00', 'COMPLETED');
    await addInspection(user1.id, getExtId('EXT-007'), inspector1.id, '2026-05-16', '13:00:00', 'COMPLETED');
    await addInspection(user1.id, getExtId('EXT-009'), inspector2.id, '2026-05-18', '15:30:00', 'COMPLETED');
    await addInspection(user2.id, getExtId('EXT-010'), inspector1.id, '2026-05-20', '10:30:00', 'COMPLETED');
    await addInspection(user2.id, getExtId('EXT-011'), inspector2.id, '2026-05-22', '16:00:00', 'COMPLETED');
    await addInspection(user1.id, getExtId('EXT-012'), inspector1.id, '2026-07-10', '09:30:00', 'SCHEDULED');
    await addInspection(user2.id, getExtId('EXT-013'), inspector2.id, '2026-07-12', '11:30:00', 'SCHEDULED');
    await addInspection(user1.id, getExtId('EXT-014'), inspector1.id, '2026-05-05', '14:00:00', 'CANCELLED');
    await addInspection(user2.id, getExtId('EXT-015'), inspector2.id, '2026-05-08', '15:00:00', 'ONGOING');

    const completedInsps = inspections.filter((i) => i.status === 'COMPLETED');

    console.log('Seeding maintenance records...');
    const addMaintenance = async (inspectionId, inspectorId, actions, date, conditions) => {
      await pool.query(
        `INSERT INTO maintenance (inspection_id, inspector_id, actions, maintenance_date, conditions_noted)
         VALUES ($1, $2, $3, $4, $5)`,
        [inspectionId, inspectorId, actions, date, conditions]
      );
    };

    await addMaintenance(completedInsps[0].id, inspector1.id, 'Recharged cylinder and verified pressure level.', '2026-05-10', 'Pressure was below threshold.');
    await addMaintenance(completedInsps[1].id, inspector2.id, 'Replaced discharge hose and safety pin.', '2026-05-12', 'Hose showed minor cracks.');
    await addMaintenance(completedInsps[2].id, inspector1.id, 'Wiped body shell, replaced bracket lock.', '2026-05-14', 'Bracket lock was loose.');
    await addMaintenance(completedInsps[3].id, inspector2.id, 'Replaced nozzle and tag seal.', '2026-05-15', 'Tag seal was broken.');
    await addMaintenance(completedInsps[4].id, inspector1.id, 'Cleaned discharge horn, tightened wall bracket.', '2026-05-16', 'Wall bracket slightly loose.');
    await addMaintenance(completedInsps[5].id, inspector2.id, 'Hydrostatic testing completed and certified.', '2026-05-18', 'Due for regular hydrostatic test.');
    await addMaintenance(completedInsps[6].id, inspector1.id, 'Recharged gas cartridge and checked safety valve.', '2026-05-20', 'Low pressure warning.');
    await addMaintenance(completedInsps[7].id, inspector2.id, 'Cleaned body assembly and updated inspection sticker.', '2026-05-22', 'Sticker was dirty.');

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
