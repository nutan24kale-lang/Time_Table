import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '..', 'timetable.sqlite');

export const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
      department TEXT DEFAULT 'AIDS',
      semester TEXT,
      section TEXT,
      teacher_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Teachers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      qualifications TEXT NOT NULL,
      availability TEXT DEFAULT '{"Monday":["09:00-16:00"],"Tuesday":["09:00-16:00"],"Wednesday":["09:00-16:00"],"Thursday":["09:00-16:00"],"Friday":["09:00-16:00"]}',
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      max_weekly_hours INTEGER DEFAULT 20,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Classrooms & Labs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS classrooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      room_type TEXT NOT NULL CHECK (room_type IN ('Classroom', 'Laboratory')),
      capacity INTEGER NOT NULL,
      building TEXT NOT NULL,
      department TEXT DEFAULT 'AIDS',
      equipment TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Subjects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      department TEXT NOT NULL,
      semester TEXT NOT NULL,
      section TEXT NOT NULL CHECK (section IN ('Section A', 'Section B')),
      teacher_id INTEGER NOT NULL REFERENCES teachers(id),
      classroom_id INTEGER NOT NULL REFERENCES classrooms(id),
      subject_type TEXT NOT NULL CHECK (subject_type IN ('Theory', 'Practical/Lab')),
      lectures_per_week INTEGER NOT NULL CHECK (lectures_per_week > 0),
      duration_per_lecture INTEGER NOT NULL CHECK (duration_per_lecture > 0),
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(code, department, semester, section)
    );
  `);

  // 5. Timetables table
  db.exec(`
    CREATE TABLE IF NOT EXISTS timetables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      semester TEXT NOT NULL,
      section TEXT NOT NULL,
      academic_year TEXT DEFAULT '2026-2027',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
      version INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME
    );
  `);

  // 6. Timetable Entries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS timetable_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timetable_id INTEGER NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
      subject_id INTEGER NOT NULL REFERENCES subjects(id),
      teacher_id INTEGER NOT NULL REFERENCES teachers(id),
      classroom_id INTEGER NOT NULL REFERENCES classrooms(id),
      day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      slot_index INTEGER NOT NULL,
      duration_mins INTEGER NOT NULL,
      is_replacement INTEGER DEFAULT 0,
      replacement_teacher_id INTEGER REFERENCES teachers(id),
      status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'substituted', 'rescheduled', 'cancelled'))
    );
  `);

  // 7. Teacher Absences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teacher_absences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL REFERENCES teachers(id),
      absence_date TEXT NOT NULL,
      start_time TEXT DEFAULT '09:00',
      end_time TEXT DEFAULT '16:00',
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      processed_by TEXT
    );
  `);

  // 8. Replacement Suggestions / Assignments
  db.exec(`
    CREATE TABLE IF NOT EXISTS replacement_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      absence_id INTEGER NOT NULL REFERENCES teacher_absences(id) ON DELETE CASCADE,
      timetable_entry_id INTEGER NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
      original_teacher_id INTEGER NOT NULL REFERENCES teachers(id),
      suggested_teacher_id INTEGER REFERENCES teachers(id),
      assigned_teacher_id INTEGER REFERENCES teachers(id),
      alternative_slot_day TEXT,
      alternative_slot_start TEXT,
      alternative_slot_end TEXT,
      score REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'approved', 'rejected', 'unresolved')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      target_role TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'urgent')),
      link TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. Timetable Versions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS timetable_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timetable_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      scope TEXT NOT NULL,
      status TEXT NOT NULL,
      validation_status TEXT NOT NULL,
      change_summary TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 11. Audit Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if data is already seeded
  const usersCountRow = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (usersCountRow.count === 0) {
    seedInitialData();
  }
}

function seedInitialData() {
  console.log('[Database] Seeding initial academic data...');

  const passwordHash = bcrypt.hashSync('college123', 10);
  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const teacherHash = bcrypt.hashSync('Teacher@123', 10);
  const studentHash = bcrypt.hashSync('Student@123', 10);

  // 1. Seed Teachers
  const teacherData = [
    { id: 'TCH101', name: 'Dr. Rajesh Sharma', email: 'sharma@college.edu', qualifications: 'Data Structures, Analysis of Algorithms, Head of Dept', max_hours: 18 },
    { id: 'TCH102', name: 'Dr. Ananya Mehta', email: 'mehta@college.edu', qualifications: 'Database Management Systems, Advanced Databases, SQL', max_hours: 18 },
    { id: 'TCH103', name: 'Prof. Vikram Patil', email: 'patil@college.edu', qualifications: 'Operating Systems, System Programming, Linux Internals', max_hours: 20 },
    { id: 'TCH104', name: 'Prof. Sneha Rao', email: 'rao@college.edu', qualifications: 'Computer Networks, Network Security, Cryptography', max_hours: 20 },
    { id: 'TCH105', name: 'Dr. Amit Desai', email: 'desai@college.edu', qualifications: 'Artificial Intelligence, Machine Learning, Python', max_hours: 18 },
    { id: 'TCH106', name: 'Prof. Priya Iyer', email: 'iyer@college.edu', qualifications: 'Theory of Computation, Compiler Design, Automata', max_hours: 20 },
  ];

  const insertTeacherStmt = db.prepare(`
    INSERT INTO teachers (teacher_id, name, email, department, qualifications, max_weekly_hours)
    VALUES (?, ?, ?, 'AIDS', ?, ?)
  `);

  for (const t of teacherData) {
    insertTeacherStmt.run(t.id, t.name, t.email, t.qualifications, t.max_hours);
  }

  // 2. Seed Users (Admin, Teachers, Students)
  const insertUserStmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department, semester, section, teacher_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Admin user
  insertUserStmt.run('Head of Department (Admin)', 'admin@college.edu', adminHash, 'admin', 'AIDS', null, null, null);

  // Teacher users
  for (const t of teacherData) {
    insertUserStmt.run(t.name, t.email, teacherHash, 'teacher', 'AIDS', null, null, t.id);
  }

  // Student users
  insertUserStmt.run('Rahul Verma', 'student1@college.edu', studentHash, 'student', 'AIDS', '4th', 'Section A', null);
  insertUserStmt.run('Pooja Patel', 'student2@college.edu', studentHash, 'student', 'AIDS', '4th', 'Section B', null);

  // 3. Seed Classrooms & Labs
  const roomsData = [
    { name: 'Room 301', room_type: 'Classroom', capacity: 75, building: 'Main Block', equipment: 'Audio-Visual Projector, Smart Podium' },
    { name: 'Room 302', room_type: 'Classroom', capacity: 70, building: 'Main Block', equipment: 'Interactive Whiteboard, Sound System' },
    { name: 'Room 303', room_type: 'Classroom', capacity: 65, building: 'Main Block', equipment: 'Projector, Tiered Seating' },
    { name: 'Room 401', room_type: 'Classroom', capacity: 75, building: 'Science Block', equipment: 'Digital Display, Lecture Capture' },
    { name: 'Computer Lab 1', room_type: 'Laboratory', capacity: 40, building: 'CS Block', equipment: '40 Workstations, Ubuntu Linux & Windows, MySQL Server' },
    { name: 'Computer Lab 2', room_type: 'Laboratory', capacity: 40, building: 'CS Block', equipment: '40 Workstations, Cisco Packet Tracer, Network Racks' },
    { name: 'AI & Data Lab', room_type: 'Laboratory', capacity: 35, building: 'CS Block', equipment: '35 High-End GPU Workstations, Python, TensorFlow nodes' },
  ];

  const insertRoomStmt = db.prepare(`
    INSERT INTO classrooms (name, room_type, capacity, building, department, equipment)
    VALUES (?, ?, ?, ?, 'AIDS', ?)
  `);

  for (const r of roomsData) {
    insertRoomStmt.run(r.name, r.room_type, r.capacity, r.building, r.equipment);
  }

  // 4. Seed Subjects for Computer Engineering Sem 4 Section A & B
  const teacherRows = db.prepare('SELECT id, teacher_id FROM teachers').all();
  const teacherMap = {};
  for (const t of teacherRows) {
    teacherMap[t.teacher_id] = t.id;
  }

  const roomRows = db.prepare('SELECT id, name FROM classrooms').all();
  const roomMap = {};
  for (const r of roomRows) {
    roomMap[r.name] = r.id;
  }

  const subjectsData = [
    // Section A
    { name: 'Data Structures & Algorithms', code: 'CS401', dept: 'AIDS', sem: '4th', sec: 'Section A', tId: teacherMap['TCH101'], rId: roomMap['Room 301'], type: 'Theory', lecs: 4, dur: 60 },
    { name: 'Database Management Systems', code: 'CS402', dept: 'AIDS', sem: '4th', sec: 'Section A', tId: teacherMap['TCH102'], rId: roomMap['Room 301'], type: 'Theory', lecs: 3, dur: 60 },
    { name: 'Operating Systems', code: 'CS403', dept: 'AIDS', sem: '4th', sec: 'Section A', tId: teacherMap['TCH103'], rId: roomMap['Room 302'], type: 'Theory', lecs: 3, dur: 60 },
    { name: 'Computer Networks', code: 'CS404', dept: 'AIDS', sem: '4th', sec: 'Section A', tId: teacherMap['TCH104'], rId: roomMap['Room 302'], type: 'Theory', lecs: 3, dur: 60 },
    { name: 'Theory of Computation', code: 'CS405', dept: 'AIDS', sem: '4th', sec: 'Section A', tId: teacherMap['TCH106'], rId: roomMap['Room 303'], type: 'Theory', lecs: 3, dur: 60 },
    { name: 'Artificial Intelligence', code: 'CS406', dept: 'AIDS', sem: '4th', sec: 'Section A', tId: teacherMap['TCH105'], rId: roomMap['Room 303'], type: 'Theory', lecs: 3, dur: 60 },
    { name: 'DBMS Lab', code: 'CS402L', dept: 'AIDS', sem: '4th', sec: 'Section A', tId: teacherMap['TCH102'], rId: roomMap['Computer Lab 1'], type: 'Practical/Lab', lecs: 2, dur: 120 },
    { name: 'OS & Networks Lab', code: 'CS404L', dept: 'AIDS', sem: '4th', sec: 'Section A', tId: teacherMap['TCH104'], rId: roomMap['Computer Lab 2'], type: 'Practical/Lab', lecs: 2, dur: 120 },
    { name: 'Advanced Algorithms Lab', code: 'CS401L', dept: 'AIDS', sem: '4th', sec: 'Section A', tId: teacherMap['TCH101'], rId: roomMap['AI & Data Lab'], type: 'Practical/Lab', lecs: 2, dur: 120 },
    // Section B
    { name: 'Data Structures & Algorithms', code: 'CS401-B', dept: 'AIDS', sem: '4th', sec: 'Section B', tId: teacherMap['TCH101'], rId: roomMap['Room 302'], type: 'Theory', lecs: 4, dur: 60 },
    { name: 'Database Management Systems', code: 'CS402-B', dept: 'AIDS', sem: '4th', sec: 'Section B', tId: teacherMap['TCH102'], rId: roomMap['Room 303'], type: 'Theory', lecs: 3, dur: 60 },
    { name: 'Operating Systems', code: 'CS403-B', dept: 'AIDS', sem: '4th', sec: 'Section B', tId: teacherMap['TCH103'], rId: roomMap['Room 301'], type: 'Theory', lecs: 3, dur: 60 },
    { name: 'Computer Networks', code: 'CS404-B', dept: 'AIDS', sem: '4th', sec: 'Section B', tId: teacherMap['TCH104'], rId: roomMap['Room 301'], type: 'Theory', lecs: 3, dur: 60 },
    { name: 'Artificial Intelligence', code: 'CS406-B', dept: 'AIDS', sem: '4th', sec: 'Section B', tId: teacherMap['TCH105'], rId: roomMap['Room 302'], type: 'Theory', lecs: 3, dur: 60 },
  ];

  const insertSubjectStmt = db.prepare(`
    INSERT INTO subjects (name, code, department, semester, section, teacher_id, classroom_id, subject_type, lectures_per_week, duration_per_lecture)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of subjectsData) {
    insertSubjectStmt.run(s.name, s.code, s.dept, s.sem, s.sec, s.tId, s.rId, s.type, s.lecs, s.dur);
  }

  // 5. Seed a Published Timetable for Sem 4 Section A
  const insertTimetableStmt = db.prepare(`
    INSERT INTO timetables (title, department, semester, section, academic_year, status, version, is_active, created_by, published_at)
    VALUES (?, ?, ?, ?, ?, 'published', 1, 1, 'admin@college.edu', CURRENT_TIMESTAMP)
  `);

  const ttResult = insertTimetableStmt.run(
    'AIDS - Semester 4 (Section A) - Spring 2026',
    'AIDS',
    '4th',
    'Section A',
    '2026-2027'
  );
  const timetableId = Number(ttResult.lastInsertRowid);

  // Fetch subject IDs for Sem 4 Section A
  const subjectRows = db.prepare(`SELECT id, code, teacher_id, classroom_id, subject_type FROM subjects WHERE section = 'Section A'`).all();
  const subByCode = {};
  for (const s of subjectRows) {
    subByCode[s.code] = s;
  }

  // Periods:
  // Slot 0: 09:00 - 10:00
  // Slot 1: 10:00 - 11:00
  // (Break 11:00 - 11:15)
  // Slot 2: 11:15 - 12:15
  // Slot 3: 12:15 - 01:15
  // (Lunch Break 01:15 - 02:00)
  // Slot 4: 02:00 - 03:00
  // Slot 5: 03:00 - 04:00

  const timetableEntries = [
    // Monday
    { day: 'Monday', slot: 0, start: '09:00', end: '10:00', dur: 60, code: 'CS401' },
    { day: 'Monday', slot: 1, start: '10:00', end: '11:00', dur: 60, code: 'CS402' },
    { day: 'Monday', slot: 2, start: '11:15', end: '12:15', dur: 60, code: 'CS403' },
    { day: 'Monday', slot: 3, start: '12:15', end: '01:15', dur: 60, code: 'CS404' },
    { day: 'Monday', slot: 4, start: '02:00', end: '04:00', dur: 120, code: 'CS402L' }, // 2hr lab spans slot 4 & 5

    // Tuesday
    { day: 'Tuesday', slot: 0, start: '09:00', end: '10:00', dur: 60, code: 'CS405' },
    { day: 'Tuesday', slot: 1, start: '10:00', end: '11:00', dur: 60, code: 'CS406' },
    { day: 'Tuesday', slot: 2, start: '11:15', end: '12:15', dur: 60, code: 'CS401' },
    { day: 'Tuesday', slot: 3, start: '12:15', end: '01:15', dur: 60, code: 'CS403' },
    { day: 'Tuesday', slot: 4, start: '02:00', end: '04:00', dur: 120, code: 'CS404L' },

    // Wednesday
    { day: 'Wednesday', slot: 0, start: '09:00', end: '10:00', dur: 60, code: 'CS402' },
    { day: 'Wednesday', slot: 1, start: '10:00', end: '11:00', dur: 60, code: 'CS404' },
    { day: 'Wednesday', slot: 2, start: '11:15', end: '12:15', dur: 60, code: 'CS406' },
    { day: 'Wednesday', slot: 3, start: '12:15', end: '01:15', dur: 60, code: 'CS405' },
    { day: 'Wednesday', slot: 4, start: '02:00', end: '04:00', dur: 120, code: 'CS401L' },

    // Thursday
    { day: 'Thursday', slot: 0, start: '09:00', end: '10:00', dur: 60, code: 'CS401' },
    { day: 'Thursday', slot: 1, start: '10:00', end: '11:00', dur: 60, code: 'CS403' },
    { day: 'Thursday', slot: 2, start: '11:15', end: '12:15', dur: 60, code: 'CS402' },
    { day: 'Thursday', slot: 3, start: '12:15', end: '01:15', dur: 60, code: 'CS404' },
    { day: 'Thursday', slot: 4, start: '02:00', end: '03:00', dur: 60, code: 'CS405' },
    { day: 'Thursday', slot: 5, start: '03:00', end: '04:00', dur: 60, code: 'CS406' },

    // Friday
    { day: 'Friday', slot: 0, start: '09:00', end: '10:00', dur: 60, code: 'CS401' },
    { day: 'Friday', slot: 1, start: '10:00', end: '11:00', dur: 60, code: 'CS402' },
    { day: 'Friday', slot: 2, start: '11:15', end: '12:15', dur: 60, code: 'CS403' },
    { day: 'Friday', slot: 3, start: '12:15', end: '01:15', dur: 60, code: 'CS404' },
    { day: 'Friday', slot: 4, start: '02:00', end: '03:00', dur: 60, code: 'CS405' },
    { day: 'Friday', slot: 5, start: '03:00', end: '04:00', dur: 60, code: 'CS406' },
  ];

  const insertEntryStmt = db.prepare(`
    INSERT INTO timetable_entries (timetable_id, subject_id, teacher_id, classroom_id, day_of_week, start_time, end_time, slot_index, duration_mins)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const e of timetableEntries) {
    const sub = subByCode[e.code];
    if (sub) {
      insertEntryStmt.run(timetableId, sub.id, sub.teacher_id, sub.classroom_id, e.day, e.start, e.end, e.slot, e.dur);
    }
  }

  // 6. Record Initial Version in Version History
  const versionData = {
    timetableId,
    title: 'AIDS - Semester 4 (Section A) - Spring 2026',
    department: 'AIDS',
    semester: '4th',
    section: 'Section A',
    entries: timetableEntries,
  };

  db.prepare(`
    INSERT INTO timetable_versions (timetable_id, version_number, title, scope, status, validation_status, change_summary, data_json, created_by)
    VALUES (?, 1, 'Initial Approved Timetable', 'AIDS / Sem 4 / Sec A', 'Published', 'Valid - 0 Conflicts', 'Initial baseline schedule generated using Welsh-Powell algorithm with constraint satisfaction.', ?, 'admin@college.edu')
  `).run(timetableId, JSON.stringify(versionData));

  // 7. Seed one Sample Teacher Absence and Replacement
  const absenceResult = db.prepare(`
    INSERT INTO teacher_absences (teacher_id, absence_date, start_time, end_time, reason, status, processed_at, processed_by)
    VALUES (?, '2026-10-20', '09:00', '13:00', 'Attending National Academic Conference on High Performance Computing', 'approved', CURRENT_TIMESTAMP, 'admin@college.edu')
  `).run(teacherMap['TCH101']); // Dr. Rajesh Sharma
  const absenceId = Number(absenceResult.lastInsertRowid);

  // Suggest Prof. Priya Iyer (TCH106) or Dr. Amit Desai as replacement
  const affectedEntry = db.prepare(`
    SELECT id FROM timetable_entries WHERE timetable_id = ? AND teacher_id = ? AND day_of_week = 'Monday' AND slot_index = 0
  `).get(timetableId, teacherMap['TCH101']);

  if (affectedEntry) {
    db.prepare(`
      INSERT INTO replacement_assignments (absence_id, timetable_entry_id, original_teacher_id, suggested_teacher_id, assigned_teacher_id, status, score, notes)
      VALUES (?, ?, ?, ?, ?, 'approved', 92.5, 'Assigned Dr. Amit Desai: Qualified in Algorithms, 0 conflict in Monday Slot 1, workload balanced.')
    `).run(absenceId, affectedEntry.id, teacherMap['TCH101'], teacherMap['TCH105'], teacherMap['TCH105']);

    // Update timetable entry status
    db.prepare(`
      UPDATE timetable_entries SET is_replacement = 1, replacement_teacher_id = ?, status = 'substituted' WHERE id = ?
    `).run(teacherMap['TCH105'], affectedEntry.id);
  }

  // 8. Notifications
  const insertNotifStmt = db.prepare(`
    INSERT INTO notifications (user_id, target_role, title, message, type, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertNotifStmt.run(null, 'all', 'Official Timetable Published', 'The official timetable for Computer Engineering Semester 4 (Section A & B) has been published.', 'success', '/student/my-timetable');
  insertNotifStmt.run(null, 'teacher', 'Faculty Absence & Replacement Notice', 'Dr. Rajesh Sharma approved for conference on Oct 20. Replacement assigned to Dr. Amit Desai.', 'info', '/teacher/schedule-changes');
  insertNotifStmt.run(null, 'admin', 'System Initialized', 'Smart Timetable Scheduler initialized successfully with Welsh-Powell algorithm engine.', 'info', '/admin/dashboard');

  // 9. Audit Log
  db.prepare(`
    INSERT INTO audit_logs (user_name, action, details)
    VALUES ('System', 'INITIALIZE', 'Initial academic database seeded with teachers, rooms, subjects, and published timetable.')
  `).run();

  console.log('[Database] Seeding completed successfully!');
}
