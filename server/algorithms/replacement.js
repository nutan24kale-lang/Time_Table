/**
 * Smart Timetable Scheduler - Teacher Absence & Automatic Replacement Engine
 *
 * Implements Section 13 Multi-Stage Decision Pipeline:
 * 1. Identify affected lectures for the absent teacher on the absence date/time.
 * 2. Find qualified substitute teachers matching the subject area.
 * 3. Verify real-time availability of candidates (no concurrent lecture, no active leave).
 * 4. Verify classroom and student batch availability.
 * 5. Rank suggestions using transparent scoring (subject affinity, weekly teaching hours, free cushion).
 * 6. Alternative Slot Recovery: If no substitute is available in the same slot, find alternative conflict-free weekly slots.
 * 7. Mark as "unresolved" if neither is possible and trigger high-priority alerts.
 */

import { db } from '../db.js';
import { COLLEGE_DAYS, COLLEGE_SLOTS } from './welshPowell.js';

export function processTeacherAbsence({ absenceId, teacherId, absenceDate, startTime, endTime }) {
  console.log(`[Replacement Engine] Processing absence #${absenceId} for teacher #${teacherId} on ${absenceDate}`);

  // Determine day of week from date string (YYYY-MM-DD)
  const dateObj = new Date(absenceDate);
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = daysOfWeek[dateObj.getDay()];

  // If weekend, no regular college lectures
  if (dayName === 'Sunday' || dayName === 'Saturday') {
    return {
      affectedLecturesCount: 0,
      suggestions: [],
      unresolvedCount: 0,
      message: 'Absence falls on a weekend; no regular college classes affected.',
    };
  }

  // 1. Identify all affected published timetable entries for this teacher on this day
  const affectedEntries = db.prepare(`
    SELECT te.*, s.name as subject_name, s.code as subject_code, s.subject_type,
           s.department as subject_dept, s.semester as subject_sem, s.section as subject_sec,
           c.name as classroom_name, c.room_type,
           t.name as original_teacher_name, t.teacher_id as original_teacher_code
    FROM timetable_entries te
    JOIN timetables tt ON te.timetable_id = tt.id
    JOIN subjects s ON te.subject_id = s.id
    JOIN classrooms c ON te.classroom_id = c.id
    JOIN teachers t ON te.teacher_id = t.id
    WHERE tt.status = 'published'
      AND te.teacher_id = ?
      AND te.day_of_week = ?
    ORDER BY te.slot_index ASC
  `).all(teacherId, dayName);

  if (affectedEntries.length === 0) {
    return {
      affectedLecturesCount: 0,
      suggestions: [],
      unresolvedCount: 0,
      message: 'No published lectures found for this teacher on this day.',
    };
  }

  // 2. Fetch all active teachers to evaluate qualifications and schedules
  const allTeachers = db.prepare(`
    SELECT t.*,
           (SELECT COUNT(*) FROM timetable_entries te2
            JOIN timetables tt2 ON te2.timetable_id = tt2.id
            WHERE tt2.status = 'published' AND te2.teacher_id = t.id) as current_weekly_lectures
    FROM teachers t
    WHERE t.status = 'active'
  `).all();

  const suggestions = [];
  let unresolvedCount = 0;

  for (const entry of affectedEntries) {
    // Stage 3 & 4: Find qualified teachers & verify availability in this slot
    const candidates = [];

    for (const candidate of allTeachers) {
      // Exclude absent teacher
      if (candidate.id === teacherId) continue;

      // Check if candidate is on leave on this date
      const candidateLeave = db.prepare(`
        SELECT id FROM teacher_absences
        WHERE teacher_id = ? AND absence_date = ? AND status = 'approved'
      `).get(candidate.id, absenceDate);
      if (candidateLeave) continue;

      // Check candidate availability in this specific slot
      const hasConflictInSlot = db.prepare(`
        SELECT te.id FROM timetable_entries te
        JOIN timetables tt ON te.timetable_id = tt.id
        WHERE tt.status = 'published'
          AND (te.teacher_id = ? OR te.replacement_teacher_id = ?)
          AND te.day_of_week = ?
          AND te.slot_index = ?
      `).get(candidate.id, candidate.id, entry.day_of_week, entry.slot_index);

      if (hasConflictInSlot) continue;

      // Calculate Qualification / Subject Affinity Score
      let affinityScore = 50; // base score for same department
      const qualLower = (candidate.qualifications || '').toLowerCase();
      const subNameLower = (entry.subject_name || '').toLowerCase();
      const subCodeLower = (entry.subject_code || '').toLowerCase();

      if (qualLower.includes(subNameLower) || subNameLower.split(' ').some(w => w.length > 3 && qualLower.includes(w))) {
        affinityScore += 35; // strong qualification match
      }
      if (candidate.department === entry.subject_dept) {
        affinityScore += 10;
      }

      // Workload balancing factor: prefer teachers with lighter current workload
      const workloadScore = Math.max(0, 20 - (candidate.current_weekly_lectures || 0));
      const totalScore = Math.min(100, affinityScore + workloadScore);

      candidates.push({
        teacherId: candidate.id,
        teacherName: candidate.name,
        teacherCode: candidate.teacher_id,
        qualifications: candidate.qualifications,
        weeklyLectures: candidate.current_weekly_lectures,
        affinityScore,
        score: totalScore,
      });
    }

    // Sort candidate replacements by total score descending
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
      const topCandidate = candidates[0];
      const notes = `Suggested ${topCandidate.teacherName} (Score: ${topCandidate.score.toFixed(1)}/100). Department: ${entry.subject_dept}. Weekly load: ${topCandidate.weeklyLectures} hrs. Free in ${entry.day_of_week} Slot ${entry.slot_index}.`;

      // Insert or update replacement suggestion record
      const result = db.prepare(`
        INSERT INTO replacement_assignments
        (absence_id, timetable_entry_id, original_teacher_id, suggested_teacher_id, status, score, notes)
        VALUES (?, ?, ?, ?, 'suggested', ?, ?)
      `).run(absenceId, entry.id, teacherId, topCandidate.teacherId, topCandidate.score, notes);

      suggestions.push({
        id: Number(result.lastInsertRowid),
        entryId: entry.id,
        subjectName: entry.subject_name,
        subjectCode: entry.subject_code,
        dayOfWeek: entry.day_of_week,
        startTime: entry.start_time,
        endTime: entry.end_time,
        classroomName: entry.classroom_name,
        originalTeacher: entry.original_teacher_name,
        suggestedTeacher: topCandidate.teacherName,
        suggestedTeacherId: topCandidate.teacherId,
        score: topCandidate.score,
        status: 'suggested',
        notes,
      });
    } else {
      // Stage 6: Alternative Slot Recovery
      // Look for a free slot during the week where the classroom and batch are free
      let alternativeFound = false;
      for (const day of COLLEGE_DAYS) {
        if (day === entry.day_of_week) continue; // prefer other days

        for (const slot of COLLEGE_SLOTS) {
          // Check if classroom is free
          const roomBusy = db.prepare(`
            SELECT id FROM timetable_entries te
            JOIN timetables tt ON te.timetable_id = tt.id
            WHERE tt.status = 'published' AND te.classroom_id = ? AND te.day_of_week = ? AND te.slot_index = ?
          `).get(entry.classroom_id, day, slot.index);
          if (roomBusy) continue;

          // Check if student batch is free
          const batchBusy = db.prepare(`
            SELECT te.id FROM timetable_entries te
            JOIN timetables tt ON te.timetable_id = tt.id
            JOIN subjects s ON te.subject_id = s.id
            WHERE tt.status = 'published' AND s.department = ? AND s.semester = ? AND s.section = ? AND te.day_of_week = ? AND te.slot_index = ?
          `).get(entry.subject_dept, entry.subject_sem, entry.subject_sec, day, slot.index);
          if (batchBusy) continue;

          // Found alternative slot!
          alternativeFound = true;
          const notes = `No substitute available at original time. Recommended rescheduled slot: ${day} at ${slot.start}-${slot.end} in ${entry.classroom_name}.`;

          const result = db.prepare(`
            INSERT INTO replacement_assignments
            (absence_id, timetable_entry_id, original_teacher_id, alternative_slot_day, alternative_slot_start, alternative_slot_end, status, score, notes)
            VALUES (?, ?, ?, ?, ?, ?, 'suggested', 70.0, ?)
          `).run(absenceId, entry.id, teacherId, day, slot.start, slot.end, notes);

          suggestions.push({
            id: Number(result.lastInsertRowid),
            entryId: entry.id,
            subjectName: entry.subject_name,
            subjectCode: entry.subject_code,
            dayOfWeek: entry.day_of_week,
            startTime: entry.start_time,
            endTime: entry.end_time,
            alternativeDay: day,
            alternativeStart: slot.start,
            alternativeEnd: slot.end,
            status: 'suggested_reschedule',
            notes,
          });
          break;
        }
        if (alternativeFound) break;
      }

      // Stage 7: Mark Unresolved if neither substitute nor slot found
      if (!alternativeFound) {
        unresolvedCount++;
        const notes = 'CRITICAL: No qualified substitute free at original time slot and all alternative rooms/slots are congested.';
        const result = db.prepare(`
          INSERT INTO replacement_assignments
          (absence_id, timetable_entry_id, original_teacher_id, status, score, notes)
          VALUES (?, ?, ?, 'unresolved', 0, ?)
        `).run(absenceId, entry.id, teacherId, notes);

        suggestions.push({
          id: Number(result.lastInsertRowid),
          entryId: entry.id,
          subjectName: entry.subject_name,
          subjectCode: entry.subject_code,
          dayOfWeek: entry.day_of_week,
          startTime: entry.start_time,
          endTime: entry.end_time,
          status: 'unresolved',
          notes,
        });

        // Trigger urgent admin notification
        db.prepare(`
          INSERT INTO notifications (target_role, title, message, type, link)
          VALUES ('admin', 'Urgent: Unresolved Teacher Absence Lecture', ?, 'urgent', '/admin/absences')
        `).run(`Lecture ${entry.subject_code} on ${entry.day_of_week} ${entry.start_time} has no available substitute or free slot.`);
      }
    }
  }

  return {
    affectedLecturesCount: affectedEntries.length,
    suggestions,
    unresolvedCount,
    message: `Processed ${affectedEntries.length} affected lecture(s). Found ${suggestions.length - unresolvedCount} replacement/reschedule options and ${unresolvedCount} unresolved.`,
  };
}
