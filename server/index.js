import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

import { db, initDatabase } from './db.js';
import { authenticateToken, requireRole, signToken } from './auth.js';
import {
  generateTimetableSchedule,
  validateScheduleConstraints,
  COLLEGE_DAYS,
  COLLEGE_SLOTS,
} from './algorithms/welshPowell.js';
import { processTeacherAbsence } from './algorithms/replacement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite Database schema & seed data
initDatabase();

// ----------------------------------------------------
// 1. AUTHENTICATION ROUTES
// ----------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      semester: user.semester,
      section: user.section,
      teacher_id: user.teacher_id,
    },
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, department, semester, section, teacher_id FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = db.prepare('SELECT email FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email address' });
  }
  // Simulated safe password reset link
  res.json({
    message: 'Password reset link has been dispatched to your registered institutional email.',
  });
});

// ----------------------------------------------------
// 2. ADMIN DASHBOARD OVERVIEW (EXACT FOUR CARDS)
// ----------------------------------------------------
app.get('/api/admin/overview', authenticateToken, requireRole('admin'), (req, res) => {
  // 1. Total Subjects (active)
  const subjectsRow = db.prepare('SELECT COUNT(*) as count FROM subjects WHERE is_archived = 0').get();
  // 2. Total Teachers (active)
  const teachersRow = db.prepare("SELECT COUNT(*) as count FROM teachers WHERE status = 'active'").get();
  // 3. Total Classrooms/Labs (active)
  const classroomsRow = db.prepare("SELECT COUNT(*) as count FROM classrooms WHERE status = 'active'").get();
  // 4. Timetable Status (Draft or Published)
  const activeTimetable = db.prepare('SELECT status, version, published_at FROM timetables WHERE is_active = 1 LIMIT 1').get();

  res.json({
    totalSubjects: subjectsRow.count,
    totalTeachers: teachersRow.count,
    totalClassrooms: classroomsRow.count,
    timetableStatus: activeTimetable ? (activeTimetable.status === 'published' ? 'Published' : 'Draft') : 'Draft',
    activeTimetable: activeTimetable || null,
  });
});

// ----------------------------------------------------
// 3. SUBJECT MANAGEMENT ROUTES (EXACT 10 FIELDS)
// ----------------------------------------------------
app.get('/api/subjects', authenticateToken, (req, res) => {
  const { department, semester, section, search } = req.query;
  let query = `
    SELECT s.*, t.name as teacher_name, t.teacher_id as teacher_code, c.name as classroom_name, c.room_type
    FROM subjects s
    LEFT JOIN teachers t ON s.teacher_id = t.id
    LEFT JOIN classrooms c ON s.classroom_id = c.id
    WHERE s.is_archived = 0
  `;
  const params = [];

  if (department) {
    query += ' AND s.department = ?';
    params.push(department);
  }
  if (semester) {
    query += ' AND s.semester = ?';
    params.push(semester);
  }
  if (section) {
    query += ' AND s.section = ?';
    params.push(section);
  }
  if (search) {
    query += ' AND (s.name LIKE ? OR s.code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY s.semester ASC, s.section ASC, s.name ASC';
  const subjects = db.prepare(query).all(...params);
  res.json({ subjects });
});

app.post('/api/subjects', authenticateToken, requireRole('admin'), (req, res) => {
  const {
    name,
    code,
    department,
    semester,
    section,
    teacher_id,
    classroom_id,
    subject_type,
    lectures_per_week,
    duration_per_lecture,
  } = req.body;

  // Validation: EXACT 10 fields check
  if (
    !name ||
    !code ||
    !department ||
    !semester ||
    !section ||
    !teacher_id ||
    !classroom_id ||
    !subject_type ||
    !lectures_per_week ||
    !duration_per_lecture
  ) {
    return res.status(400).json({ error: 'All 10 required fields must be provided' });
  }

  if (section !== 'Section A' && section !== 'Section B') {
    return res.status(400).json({ error: 'Section must be either Section A or Section B' });
  }

  if (subject_type !== 'Theory' && subject_type !== 'Practical/Lab') {
    return res.status(400).json({ error: 'Subject Type must be Theory or Practical/Lab' });
  }

  const numLecs = parseInt(lectures_per_week, 10);
  const numDur = parseInt(duration_per_lecture, 10);
  if (isNaN(numLecs) || numLecs <= 0) {
    return res.status(400).json({ error: 'Lectures per week must be a positive integer' });
  }
  if (isNaN(numDur) || numDur <= 0) {
    return res.status(400).json({ error: 'Duration per lecture must be a valid duration (e.g., 60 or 120 minutes)' });
  }

  // Check duplicate subject code in same dept/semester/section
  const existing = db.prepare(`
    SELECT id FROM subjects
    WHERE code = ? AND department = ? AND semester = ? AND section = ? AND is_archived = 0
  `).get(code.trim().toUpperCase(), department, semester, section);

  if (existing) {
    return res.status(400).json({
      error: `Subject code ${code.toUpperCase()} already exists for ${department} ${semester} ${section}`,
    });
  }

  // Validate teacher existence and active status
  const teacher = db.prepare('SELECT id, status FROM teachers WHERE id = ?').get(teacher_id);
  if (!teacher || teacher.status !== 'active') {
    return res.status(400).json({ error: 'Selected teacher does not exist or is inactive' });
  }

  // Validate room existence and lab suitability
  const room = db.prepare('SELECT id, room_type, status FROM classrooms WHERE id = ?').get(classroom_id);
  if (!room || room.status !== 'active') {
    return res.status(400).json({ error: 'Selected classroom/lab does not exist or is inactive' });
  }

  if (subject_type === 'Practical/Lab' && room.room_type !== 'Laboratory') {
    return res.status(400).json({
      error: `Practical/Lab subject requires a Laboratory room. Selected room "${room.name || 'Room'}" is classified as Classroom.`,
    });
  }

  const stmt = db.prepare(`
    INSERT INTO subjects (
      name, code, department, semester, section, teacher_id, classroom_id,
      subject_type, lectures_per_week, duration_per_lecture
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    name.trim(),
    code.trim().toUpperCase(),
    department,
    semester,
    section,
    teacher_id,
    classroom_id,
    subject_type,
    numLecs,
    numDur
  );

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, details)
    VALUES (?, ?, 'CREATE_SUBJECT', ?)
  `).run(req.user.id, req.user.name, `Created subject ${code.toUpperCase()}: ${name} (${section})`);

  res.status(201).json({
    message: 'Subject created successfully',
    subjectId: Number(result.lastInsertRowid),
  });
});

app.put('/api/subjects/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const {
    name,
    code,
    department,
    semester,
    section,
    teacher_id,
    classroom_id,
    subject_type,
    lectures_per_week,
    duration_per_lecture,
  } = req.body;

  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const numLecs = parseInt(lectures_per_week, 10);
  const numDur = parseInt(duration_per_lecture, 10);

  db.prepare(`
    UPDATE subjects SET
      name = ?, code = ?, department = ?, semester = ?, section = ?,
      teacher_id = ?, classroom_id = ?, subject_type = ?,
      lectures_per_week = ?, duration_per_lecture = ?
    WHERE id = ?
  `).run(
    name.trim(),
    code.trim().toUpperCase(),
    department,
    semester,
    section,
    teacher_id,
    classroom_id,
    subject_type,
    numLecs,
    numDur,
    id
  );

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, details)
    VALUES (?, ?, 'UPDATE_SUBJECT', ?)
  `).run(req.user.id, req.user.name, `Updated subject #${id}: ${code.toUpperCase()} (${name})`);

  res.json({ message: 'Subject updated successfully' });
});

// Safe Delete / Archive workflow
app.delete('/api/subjects/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  // Check if subject is referenced in any active/published timetable
  const referencedInPublished = db.prepare(`
    SELECT te.id FROM timetable_entries te
    JOIN timetables tt ON te.timetable_id = tt.id
    WHERE te.subject_id = ? AND tt.status = 'published'
  `).get(id);

  if (referencedInPublished) {
    // Safe Archive workflow
    db.prepare('UPDATE subjects SET is_archived = 1 WHERE id = ?').run(id);
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, details)
      VALUES (?, ?, 'ARCHIVE_SUBJECT', ?)
    `).run(req.user.id, req.user.name, `Safely archived subject #${id} (${subject.code}) because it is referenced in a published timetable.`);

    return res.json({
      archived: true,
      message: `Subject ${subject.code} is referenced by published timetable entries. It has been safely archived to preserve historical timetable integrity.`,
    });
  }

  // If not referenced in published timetable, can delete safely
  db.prepare('DELETE FROM timetable_entries WHERE subject_id = ?').run(id);
  db.prepare('DELETE FROM subjects WHERE id = ?').run(id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, details)
    VALUES (?, ?, 'DELETE_SUBJECT', ?)
  `).run(req.user.id, req.user.name, `Deleted unreferenced subject #${id} (${subject.code})`);

  res.json({ archived: false, message: 'Subject deleted successfully' });
});

// ----------------------------------------------------
// 4. TEACHER MANAGEMENT ROUTES
// ----------------------------------------------------
app.get('/api/teachers', authenticateToken, (req, res) => {
  const teachers = db.prepare(`
    SELECT t.*,
           (SELECT COUNT(*) FROM timetable_entries te
            JOIN timetables tt ON te.timetable_id = tt.id
            WHERE tt.status = 'published' AND te.teacher_id = t.id) as scheduled_lectures,
           (SELECT SUM(te.duration_mins)/60 FROM timetable_entries te
            JOIN timetables tt ON te.timetable_id = tt.id
            WHERE tt.status = 'published' AND te.teacher_id = t.id) as scheduled_hours
    FROM teachers t
    ORDER BY t.name ASC
  `).all();
  res.json({ teachers });
});

app.post('/api/teachers', authenticateToken, requireRole('admin'), (req, res) => {
  const { teacher_id, name, email, department, qualifications, max_weekly_hours } = req.body;
  if (!teacher_id || !name || !email || !department || !qualifications) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check unique teacher_id and email
  const existing = db.prepare('SELECT id FROM teachers WHERE teacher_id = ? OR email = ?').get(teacher_id.trim(), email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'A teacher with this Teacher ID or Email already exists' });
  }

  const maxHours = parseInt(max_weekly_hours, 10) || 20;

  const result = db.prepare(`
    INSERT INTO teachers (teacher_id, name, email, department, qualifications, max_weekly_hours)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(teacher_id.trim().toUpperCase(), name.trim(), email.trim().toLowerCase(), department, qualifications.trim(), maxHours);

  // Also create user login account for the teacher
  const teacherHash = bcrypt.hashSync('Teacher@123', 10);
  db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department, teacher_id)
    VALUES (?, ?, ?, 'teacher', ?, ?)
  `).run(name.trim(), email.trim().toLowerCase(), teacherHash, department, teacher_id.trim().toUpperCase());

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, details)
    VALUES (?, ?, 'CREATE_TEACHER', ?)
  `).run(req.user.id, req.user.name, `Created teacher account for ${name} (${teacher_id})`);

  res.status(201).json({ message: 'Teacher created successfully', id: Number(result.lastInsertRowid) });
});

app.put('/api/teachers/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { name, email, department, qualifications, max_weekly_hours } = req.body;

  db.prepare(`
    UPDATE teachers SET
      name = ?, email = ?, department = ?, qualifications = ?, max_weekly_hours = ?
    WHERE id = ?
  `).run(name.trim(), email.trim().toLowerCase(), department, qualifications.trim(), parseInt(max_weekly_hours, 10) || 20, id);

  res.json({ message: 'Teacher details updated successfully' });
});

app.patch('/api/teachers/:id/toggle-status', authenticateToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  const newStatus = teacher.status === 'active' ? 'inactive' : 'active';
  db.prepare('UPDATE teachers SET status = ? WHERE id = ?').run(newStatus, id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, details)
    VALUES (?, ?, 'TOGGLE_TEACHER_STATUS', ?)
  `).run(req.user.id, req.user.name, `Changed teacher ${teacher.name} status to ${newStatus}`);

  res.json({ message: `Teacher status updated to ${newStatus}`, status: newStatus });
});

// ----------------------------------------------------
// 5. CLASSROOM & LAB MANAGEMENT ROUTES
// ----------------------------------------------------
app.get('/api/classrooms', authenticateToken, (req, res) => {
  const classrooms = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM timetable_entries te
            JOIN timetables tt ON te.timetable_id = tt.id
            WHERE tt.status = 'published' AND te.classroom_id = c.id) as scheduled_sessions
    FROM classrooms c
    ORDER BY c.room_type ASC, c.name ASC
  `).all();
  res.json({ classrooms });
});

app.post('/api/classrooms', authenticateToken, requireRole('admin'), (req, res) => {
  const { name, room_type, capacity, building, department, equipment } = req.body;
  if (!name || !room_type || !capacity || !building) {
    return res.status(400).json({ error: 'Room name, type, capacity, and building are required' });
  }

  const existing = db.prepare('SELECT id FROM classrooms WHERE name = ?').get(name.trim());
  if (existing) {
    return res.status(400).json({ error: 'A classroom/lab with this name already exists' });
  }

  const result = db.prepare(`
    INSERT INTO classrooms (name, room_type, capacity, building, department, equipment)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name.trim(), room_type, parseInt(capacity, 10), building.trim(), department || 'AIDS', equipment || '');

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, details)
    VALUES (?, ?, 'CREATE_CLASSROOM', ?)
  `).run(req.user.id, req.user.name, `Created room ${name} (${room_type}) in ${building}`);

  res.status(201).json({ message: 'Classroom/Lab added successfully', id: Number(result.lastInsertRowid) });
});

app.put('/api/classrooms/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { name, room_type, capacity, building, department, equipment } = req.body;

  db.prepare(`
    UPDATE classrooms SET
      name = ?, room_type = ?, capacity = ?, building = ?, department = ?, equipment = ?
    WHERE id = ?
  `).run(name.trim(), room_type, parseInt(capacity, 10), building.trim(), department, equipment, id);

  res.json({ message: 'Classroom/Lab details updated successfully' });
});

app.patch('/api/classrooms/:id/toggle-status', authenticateToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const room = db.prepare('SELECT * FROM classrooms WHERE id = ?').get(id);
  if (!room) return res.status(404).json({ error: 'Classroom not found' });

  const newStatus = room.status === 'active' ? 'inactive' : 'active';
  db.prepare('UPDATE classrooms SET status = ? WHERE id = ?').run(newStatus, id);

  res.json({ message: `Room status updated to ${newStatus}`, status: newStatus });
});

// ----------------------------------------------------
// 6. CLASSROOM & LAB AVAILABILITY GRID
// ----------------------------------------------------
app.get('/api/availability', authenticateToken, (req, res) => {
  const { room_type, day, slot_index, building } = req.query;

  let query = "SELECT * FROM classrooms WHERE status = 'active'";
  const params = [];
  if (room_type) {
    query += ' AND room_type = ?';
    params.push(room_type);
  }
  if (building) {
    query += ' AND building = ?';
    params.push(building);
  }
  query += ' ORDER BY room_type ASC, name ASC';

  const rooms = db.prepare(query).all(...params);

  // Fetch all published timetable entries to map bookings
  const bookings = db.prepare(`
    SELECT te.*, s.name as subject_name, s.code as subject_code, s.section as subject_section,
           t.name as teacher_name
    FROM timetable_entries te
    JOIN timetables tt ON te.timetable_id = tt.id
    JOIN subjects s ON te.subject_id = s.id
    JOIN teachers t ON te.teacher_id = t.id
    WHERE tt.status = 'published'
  `).all();

  // Construct availability grid
  const days = day ? [day] : COLLEGE_DAYS;
  const slots = slot_index !== undefined ? [COLLEGE_SLOTS.find(s => s.index === parseInt(slot_index, 10))].filter(Boolean) : COLLEGE_SLOTS;

  const grid = [];
  for (const r of rooms) {
    const roomSchedule = [];
    for (const d of days) {
      for (const s of slots) {
        // Find matching booking
        const booking = bookings.find(b => {
          if (b.classroom_id !== r.id || b.day_of_week !== d) return false;
          if (b.duration_mins > 60) {
            return b.slot_index === s.index || (b.slot_index + 1) === s.index;
          }
          return b.slot_index === s.index;
        });

        roomSchedule.push({
          day: d,
          slotIndex: s.index,
          timeLabel: s.label,
          status: booking ? 'Occupied' : 'Available',
          booking: booking ? {
            subjectName: booking.subject_name,
            subjectCode: booking.subject_code,
            section: booking.subject_section,
            teacherName: booking.teacher_name,
            startTime: booking.start_time,
            endTime: booking.end_time,
          } : null,
        });
      }
    }

    grid.push({
      room: r,
      schedule: roomSchedule,
      totalSlots: roomSchedule.length,
      occupiedCount: roomSchedule.filter(s => s.status === 'Occupied').length,
      availableCount: roomSchedule.filter(s => s.status === 'Available').length,
    });
  }

  res.json({
    rooms: grid,
    collegeDays: COLLEGE_DAYS,
    collegeSlots: COLLEGE_SLOTS,
  });
});

// ----------------------------------------------------
// 7. SMART TIMETABLE GENERATOR & MANAGEMENT
// ----------------------------------------------------
app.post('/api/generator/generate', authenticateToken, requireRole('admin'), (req, res) => {
  const { department, semester, section } = req.body;
  if (!department || !semester || !section) {
    return res.status(400).json({ error: 'Department, Semester, and Section are required' });
  }

  // Fetch subjects for this specific batch
  const subjects = db.prepare(`
    SELECT * FROM subjects
    WHERE department = ? AND semester = ? AND section = ? AND is_archived = 0
  `).all(department, semester, section);

  if (subjects.length === 0) {
    return res.status(400).json({
      error: `No active subjects found for ${department} Semester ${semester} (${section}). Please add subjects first.`,
    });
  }

  const teachers = db.prepare("SELECT * FROM teachers WHERE status = 'active'").all();
  const classrooms = db.prepare("SELECT * FROM classrooms WHERE status = 'active'").all();

  // Fetch existing published entries for other sections to avoid college-wide room/teacher conflicts
  const otherSectionEntries = db.prepare(`
    SELECT te.*, s.department, s.semester, s.section
    FROM timetable_entries te
    JOIN timetables tt ON te.timetable_id = tt.id
    JOIN subjects s ON te.subject_id = s.id
    WHERE tt.status = 'published'
      AND NOT (s.department = ? AND s.semester = ? AND s.section = ?)
  `).all(department, semester, section);

  const result = generateTimetableSchedule({
    subjects,
    teachers,
    classrooms,
    existingEntries: otherSectionEntries,
  });

  res.json(result);
});

app.post('/api/generator/validate', authenticateToken, requireRole('admin'), (req, res) => {
  const { schedule } = req.body;
  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: 'Schedule array is required for validation' });
  }

  const result = validateScheduleConstraints(schedule);
  res.json(result);
});

app.post('/api/generator/save-draft', authenticateToken, requireRole('admin'), (req, res) => {
  const { department, semester, section, title, schedule } = req.body;
  if (!department || !semester || !section || !Array.isArray(schedule)) {
    return res.status(400).json({ error: 'Department, Semester, Section, and schedule are required' });
  }

  const ttTitle = title || `${department} - Semester ${semester} (${section}) [Draft]`;

  // Create draft timetable
  const ttResult = db.prepare(`
    INSERT INTO timetables (title, department, semester, section, status, version, is_active, created_by)
    VALUES (?, ?, ?, ?, 'draft', 1, 0, ?)
  `).run(ttTitle, department, semester, section, req.user.email);
  const timetableId = Number(ttResult.lastInsertRowid);

  const insertEntryStmt = db.prepare(`
    INSERT INTO timetable_entries (
      timetable_id, subject_id, teacher_id, classroom_id,
      day_of_week, start_time, end_time, slot_index, duration_mins
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of schedule) {
    insertEntryStmt.run(
      timetableId,
      item.subjectId,
      item.teacherId,
      item.classroomId,
      item.dayOfWeek,
      item.startTime,
      item.endTime,
      item.slotIndex,
      item.durationMins
    );
  }

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, details)
    VALUES (?, ?, 'SAVE_DRAFT_TIMETABLE', ?)
  `).run(req.user.id, req.user.name, `Saved draft timetable #${timetableId} for ${department} Sem ${semester} ${section}`);

  res.status(201).json({
    message: 'Draft timetable saved successfully',
    timetableId,
  });
});

app.post('/api/generator/publish', authenticateToken, requireRole('admin'), (req, res) => {
  const { department, semester, section, title, schedule } = req.body;
  if (!department || !semester || !section || !Array.isArray(schedule)) {
    return res.status(400).json({ error: 'Department, Semester, Section, and schedule are required' });
  }

  // Enforce Hard Validation before publishing: NEVER publish invalid schedule
  const validation = validateScheduleConstraints(schedule);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Cannot publish timetable with unresolved conflicts.',
      conflicts: validation.conflicts,
    });
  }

  // Archive any existing published timetable for this specific batch
  db.prepare(`
    UPDATE timetables SET status = 'archived', is_active = 0
    WHERE department = ? AND semester = ? AND section = ? AND status = 'published'
  `).run(department, semester, section);

  // Get next version number
  const lastVer = db.prepare(`
    SELECT MAX(version) as max_v FROM timetables
    WHERE department = ? AND semester = ? AND section = ?
  `).get(department, semester, section);
  const newVersion = (lastVer && lastVer.max_v) ? lastVer.max_v + 1 : 1;

  const ttTitle = title || `${department} - Semester ${semester} (${section}) [v${newVersion}]`;

  // Insert published timetable
  const ttResult = db.prepare(`
    INSERT INTO timetables (title, department, semester, section, status, version, is_active, created_by, published_at)
    VALUES (?, ?, ?, ?, 'published', ?, 1, ?, CURRENT_TIMESTAMP)
  `).run(ttTitle, department, semester, section, newVersion, req.user.email);
  const timetableId = Number(ttResult.lastInsertRowid);

  const insertEntryStmt = db.prepare(`
    INSERT INTO timetable_entries (
      timetable_id, subject_id, teacher_id, classroom_id,
      day_of_week, start_time, end_time, slot_index, duration_mins
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of schedule) {
    insertEntryStmt.run(
      timetableId,
      item.subjectId,
      item.teacherId,
      item.classroomId,
      item.dayOfWeek,
      item.startTime,
      item.endTime,
      item.slotIndex,
      item.durationMins
    );
  }

  // Create Snapshot in Version History
  db.prepare(`
    INSERT INTO timetable_versions (
      timetable_id, version_number, title, scope, status, validation_status,
      change_summary, data_json, created_by
    ) VALUES (?, ?, ?, ?, 'Published', 'Valid - 0 Conflicts', ?, ?, ?)
  `).run(
    timetableId,
    newVersion,
    ttTitle,
    `${department} / Sem ${semester} / ${section}`,
    `Published version ${newVersion} with Welsh-Powell conflict-free algorithm.`,
    JSON.stringify({ timetableId, department, semester, section, version: newVersion, schedule }),
    req.user.email
  );

  // Broadcast Notifications to students and teachers
  db.prepare(`
    INSERT INTO notifications (target_role, title, message, type, link)
    VALUES ('student', 'New Official Timetable Published', ?, 'success', '/student/my-timetable')
  `).run(`The official timetable for ${department} Semester ${semester} (${section}) has been updated to Version ${newVersion}.`);

  db.prepare(`
    INSERT INTO notifications (target_role, title, message, type, link)
    VALUES ('teacher', 'Faculty Timetable Update', ?, 'info', '/teacher/my-timetable')
  `).run(`New schedule published for ${department} Semester ${semester} (${section}). Please review your teaching slots.`);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, details)
    VALUES (?, ?, 'PUBLISH_TIMETABLE', ?)
  `).run(req.user.id, req.user.name, `Published timetable #${timetableId} v${newVersion} for ${department} Sem ${semester} ${section}`);

  res.json({
    message: `Timetable published successfully as Version ${newVersion}`,
    timetableId,
    version: newVersion,
  });
});

// View Active Timetable (Supports filtering by batch, teacher, or college-wide)
app.get('/api/timetables/active', authenticateToken, (req, res) => {
  const { department, semester, section, teacher_id } = req.query;

  let query = `
    SELECT te.*, s.name as subject_name, s.code as subject_code, s.subject_type,
           s.department as subject_dept, s.semester as subject_sem, s.section as subject_sec,
           c.name as classroom_name, c.room_type, c.building,
           t.name as teacher_name, t.teacher_id as teacher_code,
           rt.name as replacement_teacher_name,
           tt.title as timetable_title, tt.version as timetable_version, tt.status as timetable_status,
           tt.published_at
    FROM timetable_entries te
    JOIN timetables tt ON te.timetable_id = tt.id
    JOIN subjects s ON te.subject_id = s.id
    JOIN classrooms c ON te.classroom_id = c.id
    JOIN teachers t ON te.teacher_id = t.id
    LEFT JOIN teachers rt ON te.replacement_teacher_id = rt.id
    WHERE tt.status = 'published'
  `;
  const params = [];

  // Role-based scoping:
  if (req.user.role === 'student') {
    // Student can ONLY view authorized class
    query += ' AND s.department = ? AND s.semester = ? AND s.section = ?';
    params.push(req.user.department, req.user.semester, req.user.section);
  } else if (req.user.role === 'teacher' && !department) {
    // Teacher viewing own timetable by default
    query += ' AND (te.teacher_id = (SELECT id FROM teachers WHERE teacher_id = ?) OR te.replacement_teacher_id = (SELECT id FROM teachers WHERE teacher_id = ?))';
    params.push(req.user.teacher_id, req.user.teacher_id);
  } else {
    // Admin or specific filters
    if (department) {
      query += ' AND s.department = ?';
      params.push(department);
    }
    if (semester) {
      query += ' AND s.semester = ?';
      params.push(semester);
    }
    if (section) {
      query += ' AND s.section = ?';
      params.push(section);
    }
    if (teacher_id) {
      query += ' AND te.teacher_id = ?';
      params.push(teacher_id);
    }
  }

  query += ' ORDER BY te.day_of_week ASC, te.slot_index ASC';
  const entries = db.prepare(query).all(...params);

  // Group by Day
  const scheduleByDay = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  };

  for (const e of entries) {
    if (scheduleByDay[e.day_of_week]) {
      scheduleByDay[e.day_of_week].push(e);
    }
  }

  res.json({
    entries,
    scheduleByDay,
    totalScheduled: entries.length,
    collegeDays: COLLEGE_DAYS,
    collegeSlots: COLLEGE_SLOTS,
  });
});

// ----------------------------------------------------
// 8. INTERACTIVE GRAPH & CONFLICT ANALYSIS
// ----------------------------------------------------
app.get('/api/graph-analysis', authenticateToken, (req, res) => {
  const { department, semester, section, teacher_id, conflict_type } = req.query;

  // Fetch published timetable entries
  let query = `
    SELECT te.*, s.name as subject_name, s.code as subject_code, s.subject_type,
           s.department, s.semester, s.section,
           c.name as classroom_name, c.room_type,
           t.name as teacher_name, t.teacher_id as teacher_code
    FROM timetable_entries te
    JOIN timetables tt ON te.timetable_id = tt.id
    JOIN subjects s ON te.subject_id = s.id
    JOIN classrooms c ON te.classroom_id = c.id
    JOIN teachers t ON te.teacher_id = t.id
    WHERE tt.status = 'published'
  `;
  const params = [];

  // Scoping
  if (req.user.role === 'student') {
    query += ' AND s.department = ? AND s.semester = ? AND s.section = ?';
    params.push(req.user.department, req.user.semester, req.user.section);
  } else if (req.user.role === 'teacher') {
    query += ' AND te.teacher_id = (SELECT id FROM teachers WHERE teacher_id = ?)';
    params.push(req.user.teacher_id);
  } else {
    if (department) { query += ' AND s.department = ?'; params.push(department); }
    if (semester) { query += ' AND s.semester = ?'; params.push(semester); }
    if (section) { query += ' AND s.section = ?'; params.push(section); }
    if (teacher_id) { query += ' AND te.teacher_id = ?'; params.push(teacher_id); }
  }

  const entries = db.prepare(query).all(...params);

  // Build nodes
  const nodes = entries.map((e, idx) => ({
    id: e.id,
    label: `${e.subject_code}\n${e.day_of_week} ${e.start_time}`,
    subjectName: e.subject_name,
    subjectCode: e.subject_code,
    subjectType: e.subject_type,
    teacherName: e.teacher_name,
    teacherId: e.teacher_id,
    classroomName: e.classroom_name,
    classroomId: e.classroom_id,
    dayOfWeek: e.day_of_week,
    startTime: e.start_time,
    endTime: e.end_time,
    slotIndex: e.slot_index,
    department: e.department,
    semester: e.semester,
    section: e.section,
    color: '#0f5132',
    degree: 0,
  }));

  // Build conflict edges between concurrent or potential clash pairs
  const edges = [];
  const N = nodes.length;
  const adjacencyMatrix = Array.from({ length: N }, () => Array(N).fill(0));

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const u = nodes[i];
      const v = nodes[j];

      // Potential conflict if they share resource
      let clashType = null;
      let isActualClash = (u.dayOfWeek === v.dayOfWeek && u.slotIndex === v.slotIndex);

      if (u.teacherId === v.teacherId) {
        clashType = 'TEACHER_CONFLICT';
      } else if (u.classroomId === v.classroomId) {
        clashType = 'ROOM_CONFLICT';
      } else if (u.department === v.department && u.semester === v.semester && u.section === v.section) {
        clashType = 'BATCH_CONFLICT';
      }

      if (clashType) {
        if (!conflict_type || conflict_type === clashType) {
          adjacencyMatrix[i][j] = 1;
          adjacencyMatrix[j][i] = 1;
          nodes[i].degree++;
          nodes[j].degree++;

          edges.push({
            id: `edge_${u.id}_${v.id}`,
            source: u.id,
            target: v.id,
            type: clashType,
            isActualClash,
            color: isActualClash ? '#ef4444' : '#10b981', // red if active clash, green if successfully separated
            description: `${clashType.replace('_', ' ')}: ${isActualClash ? 'Active Conflict' : 'Resolved & Separated by Welsh-Powell'}`,
          });
        }
      }
    }
  }

  // Workload distributions & heatmaps for Student & Teacher dashboards
  const dayDistribution = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 };
  const subjectDistribution = {};
  const heatmap = {};

  for (const e of entries) {
    dayDistribution[e.day_of_week] = (dayDistribution[e.day_of_week] || 0) + 1;
    subjectDistribution[e.subject_code] = (subjectDistribution[e.subject_code] || 0) + 1;

    const heatKey = `${e.day_of_week}_${e.slot_index}`;
    heatmap[heatKey] = (heatmap[heatKey] || 0) + 1;
  }

  res.json({
    nodes,
    edges,
    adjacencyMatrix,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    activeConflictsCount: edges.filter(e => e.isActualClash).length,
    dayDistribution,
    subjectDistribution,
    heatmap,
  });
});

// ----------------------------------------------------
// 9. TEACHER ABSENCE & REPLACEMENT WORKFLOW
// ----------------------------------------------------
app.get('/api/absences', authenticateToken, (req, res) => {
  let query = `
    SELECT a.*, t.name as teacher_name, t.teacher_id as teacher_code, t.department
    FROM teacher_absences a
    JOIN teachers t ON a.teacher_id = t.id
  `;
  const params = [];

  // Scoping: teachers can view their own requests, admin sees all
  if (req.user.role === 'teacher') {
    query += ' WHERE a.teacher_id = (SELECT id FROM teachers WHERE teacher_id = ?)';
    params.push(req.user.teacher_id);
  }

  query += ' ORDER BY a.absence_date DESC, a.created_at DESC';
  const absences = db.prepare(query).all(...params);

  // Attach replacement suggestions
  const absencesWithReplacements = absences.map(a => {
    const replacements = db.prepare(`
      SELECT r.*,
             orig_t.name as original_teacher_name,
             sug_t.name as suggested_teacher_name, sug_t.teacher_id as suggested_teacher_code,
             asg_t.name as assigned_teacher_name,
             te.day_of_week, te.start_time, te.end_time, te.slot_index,
             s.name as subject_name, s.code as subject_code,
             c.name as classroom_name
      FROM replacement_assignments r
      JOIN teachers orig_t ON r.original_teacher_id = orig_t.id
      LEFT JOIN teachers sug_t ON r.suggested_teacher_id = sug_t.id
      LEFT JOIN teachers asg_t ON r.assigned_teacher_id = asg_t.id
      JOIN timetable_entries te ON r.timetable_entry_id = te.id
      JOIN subjects s ON te.subject_id = s.id
      JOIN classrooms c ON te.classroom_id = c.id
      WHERE r.absence_id = ?
    `).all(a.id);

    return {
      ...a,
      replacements,
    };
  });

  res.json({ absences: absencesWithReplacements });
});

app.post('/api/absences', authenticateToken, (req, res) => {
  const { teacher_id, absence_date, start_time, end_time, reason } = req.body;
  if (!absence_date || !reason) {
    return res.status(400).json({ error: 'Absence date and reason are required' });
  }

  let targetTeacherId = teacher_id;
  if (req.user.role === 'teacher') {
    const tRow = db.prepare('SELECT id FROM teachers WHERE teacher_id = ?').get(req.user.teacher_id);
    if (!tRow) return res.status(404).json({ error: 'Teacher record not found' });
    targetTeacherId = tRow.id;
  }

  if (!targetTeacherId) {
    return res.status(400).json({ error: 'Teacher must be specified' });
  }

  const result = db.prepare(`
    INSERT INTO teacher_absences (teacher_id, absence_date, start_time, end_time, reason, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(targetTeacherId, absence_date, start_time || '09:00', end_time || '16:00', reason.trim());

  const absenceId = Number(result.lastInsertRowid);

  // Automatically execute replacement engine to generate candidate replacements
  const replacementOutcome = processTeacherAbsence({
    absenceId,
    teacherId: targetTeacherId,
    absenceDate: absence_date,
    startTime: start_time || '09:00',
    endTime: end_time || '16:00',
  });

  // Notify Admin
  db.prepare(`
    INSERT INTO notifications (target_role, title, message, type, link)
    VALUES ('admin', 'New Faculty Absence Request', ?, 'warning', '/admin/absences')
  `).run(`Faculty submitted absence request for ${absence_date}. ${replacementOutcome.affectedLecturesCount} lecture(s) require review.`);

  res.status(201).json({
    message: 'Absence request submitted successfully',
    absenceId,
    replacementOutcome,
  });
});

app.post('/api/absences/:id/approve', authenticateToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const absence = db.prepare('SELECT * FROM teacher_absences WHERE id = ?').get(id);
  if (!absence) return res.status(404).json({ error: 'Absence request not found' });

  db.prepare(`
    UPDATE teacher_absences SET status = 'approved', processed_at = CURRENT_TIMESTAMP, processed_by = ?
    WHERE id = ?
  `).run(req.user.email, id);

  // Check if replacement engine has run for this absence; if not, run it
  const existingReplacements = db.prepare('SELECT id FROM replacement_assignments WHERE absence_id = ?').all(id);
  if (existingReplacements.length === 0) {
    processTeacherAbsence({
      absenceId: id,
      teacherId: absence.teacher_id,
      absenceDate: absence.absence_date,
      startTime: absence.start_time,
      endTime: absence.end_time,
    });
  }

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, details)
    VALUES (?, ?, 'APPROVE_ABSENCE', ?)
  `).run(req.user.id, req.user.name, `Approved absence #${id} for teacher #${absence.teacher_id} on ${absence.absence_date}`);

  res.json({ message: 'Absence approved. Review and assign replacements below.' });
});

app.post('/api/absences/replacements/:replacementId/approve', authenticateToken, requireRole('admin'), (req, res) => {
  const { replacementId } = req.params;
  const { assigned_teacher_id } = req.body;

  const replacement = db.prepare('SELECT * FROM replacement_assignments WHERE id = ?').get(replacementId);
  if (!replacement) return res.status(404).json({ error: 'Replacement suggestion not found' });

  const finalTeacherId = assigned_teacher_id || replacement.suggested_teacher_id;
  if (!finalTeacherId && !replacement.alternative_slot_day) {
    return res.status(400).json({ error: 'A replacement teacher or alternative slot must be selected' });
  }

  if (finalTeacherId) {
    // 1. Update replacement assignment status
    db.prepare(`
      UPDATE replacement_assignments SET
        status = 'approved', assigned_teacher_id = ?
      WHERE id = ?
    `).run(finalTeacherId, replacementId);

    // 2. Update actual timetable entry
    db.prepare(`
      UPDATE timetable_entries SET
        is_replacement = 1, replacement_teacher_id = ?, status = 'substituted'
      WHERE id = ?
    `).run(finalTeacherId, replacement.timetable_entry_id);
  } else if (replacement.alternative_slot_day) {
    // Rescheduled slot
    db.prepare(`
      UPDATE replacement_assignments SET status = 'approved' WHERE id = ?
    `).run(replacementId);

    db.prepare(`
      UPDATE timetable_entries SET
        day_of_week = ?, start_time = ?, end_time = ?, status = 'rescheduled'
      WHERE id = ?
    `).run(replacement.alternative_slot_day, replacement.alternative_slot_start, replacement.alternative_slot_end, replacement.timetable_entry_id);
  }

  // Notify Students & Teachers of the schedule update
  const entry = db.prepare(`
    SELECT te.*, s.name as subject_name, s.code as subject_code, s.department, s.semester, s.section,
           t.name as orig_teacher_name, c.name as classroom_name
    FROM timetable_entries te
    JOIN subjects s ON te.subject_id = s.id
    JOIN teachers t ON te.teacher_id = t.id
    JOIN classrooms c ON te.classroom_id = c.id
    WHERE te.id = ?
  `).get(replacement.timetable_entry_id);

  if (entry) {
    db.prepare(`
      INSERT INTO notifications (target_role, title, message, type, link)
      VALUES ('student', 'Schedule Adjustment Notice', ?, 'warning', '/student/my-timetable')
    `).run(`Substitute assigned for ${entry.subject_code} (${entry.day_of_week} ${entry.start_time}). Please check your timetable.`);

    db.prepare(`
      INSERT INTO notifications (target_role, title, message, type, link)
      VALUES ('teacher', 'Substitute Lecture Assigned', ?, 'info', '/teacher/schedule-changes')
    `).run(`You have been assigned as replacement instructor for ${entry.subject_code} on ${entry.day_of_week} at ${entry.start_time}.`);
  }

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, details)
    VALUES (?, ?, 'APPROVE_REPLACEMENT', ?)
  `).run(req.user.id, req.user.name, `Approved replacement #${replacementId} for lecture #${replacement.timetable_entry_id}`);

  res.json({ message: 'Replacement teacher approved and schedule updated successfully' });
});

// ----------------------------------------------------
// 10. WORKLOAD & UTILIZATION REPORTS
// ----------------------------------------------------
app.get('/api/reports/workload', authenticateToken, (req, res) => {
  let query = `
    SELECT t.id, t.teacher_id, t.name, t.email, t.department, t.max_weekly_hours,
           COUNT(te.id) as total_lectures,
           COALESCE(SUM(te.duration_mins)/60.0, 0) as total_hours,
           SUM(CASE WHEN te.day_of_week = 'Monday' THEN 1 ELSE 0 END) as mon_lecs,
           SUM(CASE WHEN te.day_of_week = 'Tuesday' THEN 1 ELSE 0 END) as tue_lecs,
           SUM(CASE WHEN te.day_of_week = 'Wednesday' THEN 1 ELSE 0 END) as wed_lecs,
           SUM(CASE WHEN te.day_of_week = 'Thursday' THEN 1 ELSE 0 END) as thu_lecs,
           SUM(CASE WHEN te.day_of_week = 'Friday' THEN 1 ELSE 0 END) as fri_lecs
    FROM teachers t
    LEFT JOIN timetable_entries te ON t.id = te.teacher_id
    LEFT JOIN timetables tt ON te.timetable_id = tt.id AND tt.status = 'published'
  `;
  const params = [];

  // Teacher role can only view their own workload
  if (req.user.role === 'teacher') {
    query += ' WHERE t.teacher_id = ?';
    params.push(req.user.teacher_id);
  }

  query += ' GROUP BY t.id ORDER BY t.name ASC';
  const workload = db.prepare(query).all(...params);

  res.json({ workload });
});

app.get('/api/reports/utilization', authenticateToken, requireRole('admin'), (req, res) => {
  // Total college available teaching hours per week = 5 days * 6 hours = 30 hours per room
  const TOTAL_WEEKLY_ROOM_HOURS = 30;

  const roomUtilization = db.prepare(`
    SELECT c.id, c.name, c.room_type, c.capacity, c.building,
           COUNT(te.id) as total_booked_slots,
           COALESCE(SUM(te.duration_mins)/60.0, 0) as booked_hours
    FROM classrooms c
    LEFT JOIN timetable_entries te ON c.id = te.classroom_id
    LEFT JOIN timetables tt ON te.timetable_id = tt.id AND tt.status = 'published'
    WHERE c.status = 'active'
    GROUP BY c.id
    ORDER BY c.room_type ASC, booked_hours DESC
  `).all();

  const enrichedRooms = roomUtilization.map(r => {
    const utilizationRate = Math.min(100, (r.booked_hours / TOTAL_WEEKLY_ROOM_HOURS) * 100);
    return {
      ...r,
      availableHours: Math.max(0, TOTAL_WEEKLY_ROOM_HOURS - r.booked_hours),
      utilizationPercentage: parseFloat(utilizationRate.toFixed(1)),
    };
  });

  // Calculate overall metrics
  const totalRooms = enrichedRooms.length;
  const avgUtilization = totalRooms > 0
    ? enrichedRooms.reduce((acc, r) => acc + r.utilizationPercentage, 0) / totalRooms
    : 0;

  res.json({
    rooms: enrichedRooms,
    averageUtilization: parseFloat(avgUtilization.toFixed(1)),
    totalAvailableSlots: totalRooms * 30,
    totalBookedSlots: enrichedRooms.reduce((acc, r) => acc + r.total_booked_slots, 0),
  });
});

// CSV Export for Workload & Utilization
app.get('/api/reports/export-csv', authenticateToken, requireRole('admin'), (req, res) => {
  const { type } = req.query;

  if (type === 'utilization') {
    const rooms = db.prepare(`
      SELECT c.name, c.room_type, c.capacity, c.building,
             COUNT(te.id) as booked_slots,
             COALESCE(SUM(te.duration_mins)/60.0, 0) as booked_hours
      FROM classrooms c
      LEFT JOIN timetable_entries te ON c.id = te.classroom_id
      LEFT JOIN timetables tt ON te.timetable_id = tt.id AND tt.status = 'published'
      WHERE c.status = 'active'
      GROUP BY c.id
    `).all();

    let csv = 'Room Name,Room Type,Capacity,Building,Booked Slots,Booked Hours,Utilization (%)\n';
    for (const r of rooms) {
      const util = ((r.booked_hours / 30) * 100).toFixed(1);
      csv += `"${r.name}","${r.room_type}",${r.capacity},"${r.building}",${r.booked_slots},${r.booked_hours},${util}%\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="room_utilization_report.csv"');
    return res.send(csv);
  }

  // Default: Teacher Workload CSV
  const teachers = db.prepare(`
    SELECT t.teacher_id, t.name, t.department, t.max_weekly_hours,
           COUNT(te.id) as total_lectures,
           COALESCE(SUM(te.duration_mins)/60.0, 0) as total_hours
    FROM teachers t
    LEFT JOIN timetable_entries te ON t.id = te.teacher_id
    LEFT JOIN timetables tt ON te.timetable_id = tt.id AND tt.status = 'published'
    GROUP BY t.id
  `).all();

  let csv = 'Teacher ID,Name,Department,Max Weekly Hours,Total Lectures,Total Teaching Hours\n';
  for (const t of teachers) {
    csv += `"${t.teacher_id}","${t.name}","${t.department}",${t.max_weekly_hours},${t.total_lectures},${t.total_hours}\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="faculty_workload_report.csv"');
  res.send(csv);
});

// ----------------------------------------------------
// 11. TIMETABLE VERSION HISTORY & RESTORATION
// ----------------------------------------------------
app.get('/api/versions', authenticateToken, (req, res) => {
  const versions = db.prepare(`
    SELECT id, timetable_id, version_number, title, scope, status,
           validation_status, change_summary, created_by, created_at
    FROM timetable_versions
    ORDER BY version_number DESC, created_at DESC
  `).all();
  res.json({ versions });
});

app.get('/api/versions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const version = db.prepare('SELECT * FROM timetable_versions WHERE id = ?').get(id);
  if (!version) return res.status(404).json({ error: 'Version not found' });

  version.data = JSON.parse(version.data_json);
  res.json({ version });
});

app.post('/api/versions/:id/restore', authenticateToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const versionRecord = db.prepare('SELECT * FROM timetable_versions WHERE id = ?').get(id);
  if (!versionRecord) return res.status(404).json({ error: 'Version record not found' });

  const snapshot = JSON.parse(versionRecord.data_json);
  if (!snapshot.schedule || !Array.isArray(snapshot.schedule)) {
    return res.status(400).json({ error: 'Corrupt snapshot data' });
  }

  // Validate before restoring
  const validation = validateScheduleConstraints(snapshot.schedule);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Cannot restore this version: contains constraint violations against current database state.',
      conflicts: validation.conflicts,
    });
  }

  // Get new sequential version
  const lastVer = db.prepare(`
    SELECT MAX(version_number) as max_v FROM timetable_versions
  `).get();
  const nextVer = (lastVer && lastVer.max_v) ? lastVer.max_v + 1 : 1;

  // Set existing active timetables to archived
  db.prepare(`
    UPDATE timetables SET status = 'archived', is_active = 0
    WHERE department = ? AND semester = ? AND section = ? AND status = 'published'
  `).run(snapshot.department, snapshot.semester, snapshot.section);

  // Create restored timetable
  const ttResult = db.prepare(`
    INSERT INTO timetables (title, department, semester, section, status, version, is_active, created_by, published_at)
    VALUES (?, ?, ?, ?, 'published', ?, 1, ?, CURRENT_TIMESTAMP)
  `).run(
    `${snapshot.department} - Sem ${snapshot.semester} (${snapshot.section}) [Restored v${versionRecord.version_number} -> v${nextVer}]`,
    snapshot.department,
    snapshot.semester,
    snapshot.section,
    nextVer,
    req.user.email
  );
  const newTtId = Number(ttResult.lastInsertRowid);

  const insertEntryStmt = db.prepare(`
    INSERT INTO timetable_entries (
      timetable_id, subject_id, teacher_id, classroom_id,
      day_of_week, start_time, end_time, slot_index, duration_mins
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of snapshot.schedule) {
    insertEntryStmt.run(
      newTtId,
      item.subjectId || item.subject_id,
      item.teacherId || item.teacher_id,
      item.classroomId || item.classroom_id,
      item.dayOfWeek || item.day_of_week,
      item.startTime || item.start_time,
      item.endTime || item.end_time,
      item.slotIndex !== undefined ? item.slotIndex : item.slot_index,
      item.durationMins || item.duration_mins
    );
  }

  // Record restoration event in Version History
  db.prepare(`
    INSERT INTO timetable_versions (
      timetable_id, version_number, title, scope, status, validation_status,
      change_summary, data_json, created_by
    ) VALUES (?, ?, ?, ?, 'Published', 'Valid - 0 Conflicts', ?, ?, ?)
  `).run(
    newTtId,
    nextVer,
    `Restored from Version ${versionRecord.version_number}`,
    versionRecord.scope,
    `Rollback and restoration of Version ${versionRecord.version_number} initiated by ${req.user.name}.`,
    versionRecord.data_json,
    req.user.email
  );

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, details)
    VALUES (?, ?, 'RESTORE_VERSION', ?)
  `).run(req.user.id, req.user.name, `Restored timetable version ${versionRecord.version_number} as new version ${nextVer}`);

  res.json({
    message: `Timetable restored successfully as Version ${nextVer}`,
    newVersion: nextVer,
  });
});

// ----------------------------------------------------
// 12. NOTIFICATIONS
// ----------------------------------------------------
app.get('/api/notifications', authenticateToken, (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE target_role = 'all' OR target_role = ? OR user_id = ?
    ORDER BY created_at DESC LIMIT 30
  `).all(req.user.role, req.user.id);
  res.json({ notifications });
});

app.patch('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  res.json({ message: 'Marked as read' });
});

app.patch('/api/notifications/read-all', authenticateToken, (req, res) => {
  db.prepare(`
    UPDATE notifications SET is_read = 1
    WHERE target_role = 'all' OR target_role = ? OR user_id = ?
  `).run(req.user.role, req.user.id);
  res.json({ message: 'All notifications marked as read' });
});

// ----------------------------------------------------
// 13. AUDIT LOGS
// ----------------------------------------------------
app.get('/api/audit', authenticateToken, requireRole('admin'), (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
  res.json({ logs });
});

// ----------------------------------------------------
// 14. HEALTH CHECK & STATIC SERVING
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Smart Timetable Scheduler Backend', timestamp: new Date() });
});

// Serve frontend static build if dist folder exists
const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), err => {
    if (err) next();
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Smart Timetable Scheduler] Server listening on port ${PORT}`);
});
