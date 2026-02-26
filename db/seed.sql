-- ─────────────────────────────────────────────────────────────────────────────
-- AutoFlow Seed Data
-- Run after schema.sql — clears all data and inserts a full demo dataset
-- ─────────────────────────────────────────────────────────────────────────────

-- Clear in FK-safe order
TRUNCATE TABLE
  loyalty_points,
  notifications,
  transactions,
  bookings,
  owner_detailers,
  detailer_schedules,
  password_reset_tokens,
  services,
  locations,
  vehicles,
  users
RESTART IDENTITY CASCADE;

-- ─── USERS ────────────────────────────────────────────────────────────────────
-- Passwords (bcrypt 10 rounds):
--   admin@autoflow.com  → SuperAdmin123!
--   owner@autoflow.com  → Owner123!
--   james@autoflow.com  → Detailer123!
--   grace@autoflow.com  → Detailer123!
--   john@autoflow.com   → Customer123!
--   mary@autoflow.com   → Customer123!

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_verified, approval_status) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@autoflow.com',  '$2a$10$xfX5qUYXerQt7qhMNwCo1uHl5tcwzq7rOMLe0IXfOtlrc28ZTNnn.', 'Super',  'Admin',   '+254700000000', 'admin',    true, 'approved'),
  ('a0000000-0000-0000-0000-000000000002', 'owner@autoflow.com',  '$2a$10$TDY.Qj90j6IzdDJDbEOx8eRSDpzlIGbdo4CY2lSkVME4gor6jIEoa', 'David',  'Kamau',   '+254711000002', 'owner',    true, 'approved'),
  ('a0000000-0000-0000-0000-000000000003', 'james@autoflow.com',  '$2a$10$Wfny9WAFn8mJ7B5HT9IyxeLnU3cCdBunF3YscxL2TK.S.LQE92.yG', 'James',  'Okonkwo', '+254711000003', 'detailer', true, 'approved'),
  ('a0000000-0000-0000-0000-000000000004', 'grace@autoflow.com',  '$2a$10$Wfny9WAFn8mJ7B5HT9IyxeLnU3cCdBunF3YscxL2TK.S.LQE92.yG', 'Grace',  'Wanjiku', '+254711000004', 'detailer', true, 'approved'),
  ('a0000000-0000-0000-0000-000000000005', 'john@autoflow.com',   '$2a$10$XsTHTo6OQ2bGztEhIBJNNe.Pgft2HoraRe51y.nkjv4EwwRxj/NX.', 'John',   'Kariuki', '+254722000005', 'customer', true, 'approved'),
  ('a0000000-0000-0000-0000-000000000006', 'mary@autoflow.com',   '$2a$10$XsTHTo6OQ2bGztEhIBJNNe.Pgft2HoraRe51y.nkjv4EwwRxj/NX.', 'Mary',   'Achieng', '+254722000006', 'customer', true, 'approved');

-- ─── LOCATIONS ────────────────────────────────────────────────────────────────
INSERT INTO locations (id, owner_id, name, address, city, lat, lng, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
   'AutoFlow Westlands', 'Woodvale Grove, Westlands', 'Nairobi', -1.2676, 36.8114, true),
  ('a1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
   'AutoFlow CBD',       'Kimathi Street, CBD',        'Nairobi', -1.2833, 36.8219, true);

-- ─── SERVICES ─────────────────────────────────────────────────────────────────
INSERT INTO services (id, owner_id, name, description, price, duration, category, is_active) VALUES
  ('a2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
   'Basic Wash',      'Exterior rinse, soap wash, and dry',                                    500.00,  30,  'Basic',   true),
  ('a2000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
   'Premium Detail',  'Full exterior + interior deep clean with wax and polish',               1500.00, 90,  'Premium', true),
  ('a2000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002',
   'Interior Clean',  'Vacuuming, dashboard wipe-down, seat shampoo and odour treatment',      800.00,  60,  'Interior', true),
  ('a2000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002',
   'Full Service',    'Basic Wash + Premium Detail + Interior Clean — the complete package',   2000.00, 120, 'Premium', true);

-- ─── VEHICLES ─────────────────────────────────────────────────────────────────
INSERT INTO vehicles (id, customer_id, make, model, year, color, license_plate) VALUES
  ('a3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'Toyota',  'Camry',   2020, 'Silver', 'KDA 001A'),
  ('a3000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'Honda',   'Civic',   2019, 'Black',  'KDB 002B'),
  ('a3000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000006', 'Nissan',  'X-Trail', 2021, 'White',  'KDC 003C');

-- ─── BOOKINGS ─────────────────────────────────────────────────────────────────
-- B1: John → Basic Wash → Westlands → James → COMPLETED + PAID
INSERT INTO bookings (id, customer_id, vehicle_id, service_id, location_id, detailer_id,
                      scheduled_date, scheduled_time, status, payment_status, payment_method, rating, review) VALUES
  ('b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000001',
   'a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000003',
   '2026-02-10', '09:00', 'completed', 'completed', 'mpesa', 5, 'Excellent service! Car looks brand new.');

-- B2: John → Premium Detail → Westlands → Grace → IN PROGRESS
INSERT INTO bookings (id, customer_id, vehicle_id, service_id, location_id, detailer_id,
                      scheduled_date, scheduled_time, status, payment_status, payment_method) VALUES
  ('b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000001',
   'a2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000004',
   '2026-02-26', '10:30', 'in_progress', 'completed', 'mpesa');

-- B3: Mary → Interior Clean → CBD → James → CONFIRMED (cash)
INSERT INTO bookings (id, customer_id, vehicle_id, service_id, location_id, detailer_id,
                      scheduled_date, scheduled_time, status, payment_status, payment_method) VALUES
  ('b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000006', 'a3000000-0000-0000-0000-000000000003',
   'a2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000003',
   '2026-02-27', '14:00', 'confirmed', 'pending', 'cash');

-- B4: Mary → Full Service → Westlands → (unassigned) → PENDING
INSERT INTO bookings (id, customer_id, vehicle_id, service_id, location_id,
                      scheduled_date, scheduled_time, status, payment_status, payment_method) VALUES
  ('b0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000006', 'a3000000-0000-0000-0000-000000000003',
   'a2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001',
   '2026-03-01', '11:00', 'pending', 'pending', 'mpesa');

-- B5: John → Basic Wash → CBD → Grace → COMPLETED + PAID
INSERT INTO bookings (id, customer_id, vehicle_id, service_id, location_id, detailer_id,
                      scheduled_date, scheduled_time, status, payment_status, payment_method, rating, review) VALUES
  ('b0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000002',
   'a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000004',
   '2026-02-15', '08:00', 'completed', 'completed', 'mpesa', 4, 'Great job, very professional.');

-- B6: John → Interior Clean → CBD → James → COMPLETED (card)
INSERT INTO bookings (id, customer_id, vehicle_id, service_id, location_id, detailer_id,
                      scheduled_date, scheduled_time, status, payment_status, payment_method) VALUES
  ('b0000000-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000001',
   'a2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000003',
   '2026-02-20', '15:00', 'completed', 'completed', 'card');

-- ─── TRANSACTIONS ──────────────────────────────────────────────────────────────
INSERT INTO transactions (booking_id, customer_id, amount, method, status, mpesa_code) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005',  500.00, 'mpesa', 'completed', 'QGH1234567'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 1500.00, 'mpesa', 'completed', 'QGH2345678'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005',  500.00, 'mpesa', 'completed', 'QGH3456789'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000005',  800.00, 'card',  'completed', NULL);

-- ─── LOYALTY POINTS ───────────────────────────────────────────────────────────
-- 10 pts per KES 100 spent (B1=500→50, B5=500→50, B6=800→80)
INSERT INTO loyalty_points (customer_id, booking_id, points, description) VALUES
  ('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001',  50, 'Points earned for Basic Wash on 2026-02-10'),
  ('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005',  50, 'Points earned for Basic Wash on 2026-02-15'),
  ('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000006',  80, 'Points earned for Interior Clean on 2026-02-20');

-- ─── DETAILER SCHEDULES ───────────────────────────────────────────────────────
-- James: Mon–Fri 08:00–18:00
INSERT INTO detailer_schedules (detailer_id, day_of_week, start_time, end_time, is_available) VALUES
  ('a0000000-0000-0000-0000-000000000003', 0, NULL,    NULL,    false), -- Sun off
  ('a0000000-0000-0000-0000-000000000003', 1, '08:00', '18:00', true),
  ('a0000000-0000-0000-0000-000000000003', 2, '08:00', '18:00', true),
  ('a0000000-0000-0000-0000-000000000003', 3, '08:00', '18:00', true),
  ('a0000000-0000-0000-0000-000000000003', 4, '08:00', '18:00', true),
  ('a0000000-0000-0000-0000-000000000003', 5, '08:00', '18:00', true),
  ('a0000000-0000-0000-0000-000000000003', 6, NULL,    NULL,    false); -- Sat off

-- Grace: Mon–Sat 09:00–17:00
INSERT INTO detailer_schedules (detailer_id, day_of_week, start_time, end_time, is_available) VALUES
  ('a0000000-0000-0000-0000-000000000004', 0, NULL,    NULL,    false), -- Sun off
  ('a0000000-0000-0000-0000-000000000004', 1, '09:00', '17:00', true),
  ('a0000000-0000-0000-0000-000000000004', 2, '09:00', '17:00', true),
  ('a0000000-0000-0000-0000-000000000004', 3, '09:00', '17:00', true),
  ('a0000000-0000-0000-0000-000000000004', 4, '09:00', '17:00', true),
  ('a0000000-0000-0000-0000-000000000004', 5, '09:00', '17:00', true),
  ('a0000000-0000-0000-0000-000000000004', 6, '09:00', '13:00', true); -- Sat half-day

-- ─── OWNER-DETAILER ASSIGNMENTS ───────────────────────────────────────────────
INSERT INTO owner_detailers (owner_id, detailer_id) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003'),
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004');

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
  ('a0000000-0000-0000-0000-000000000005', 'Booking Confirmed',   'Your Basic Wash at AutoFlow Westlands on Feb 10 has been confirmed.',   'booking', true),
  ('a0000000-0000-0000-0000-000000000005', 'Service Completed',   'Your Basic Wash at AutoFlow Westlands is done! Rate your experience.',   'booking', true),
  ('a0000000-0000-0000-0000-000000000005', 'Loyalty Points Earned','You earned 50 loyalty points for your recent visit!',                    'system',  true),
  ('a0000000-0000-0000-0000-000000000005', 'Premium Detail Started','James has started your Premium Detail. Estimated: 90 min.',             'booking', false),
  ('a0000000-0000-0000-0000-000000000006', 'Booking Confirmed',   'Your Interior Clean at AutoFlow CBD on Feb 27 has been confirmed.',     'booking', false),
  ('a0000000-0000-0000-0000-000000000002', 'New Booking Received', 'John Kariuki booked a Full Service for Mar 1 at AutoFlow Westlands.',   'booking', false),
  ('a0000000-0000-0000-0000-000000000003', 'New Job Assigned',     'You have been assigned a Basic Wash for John Kariuki on Feb 10.',       'booking', true),
  ('a0000000-0000-0000-0000-000000000004', 'New Job Assigned',     'You have been assigned a Premium Detail for John Kariuki on Feb 26.',   'booking', false);

-- ─────────────────────────────────────────────────────────────────────────────
-- Summary of seeded accounts:
--   admin@autoflow.com    SuperAdmin123!   (admin)
--   owner@autoflow.com    Owner123!        (owner)
--   james@autoflow.com    Detailer123!     (detailer)
--   grace@autoflow.com    Detailer123!     (detailer)
--   john@autoflow.com     Customer123!     (customer)
--   mary@autoflow.com     Customer123!     (customer)
-- ─────────────────────────────────────────────────────────────────────────────