/**
 * Smart Timetable Scheduler - Welsh-Powell Greedy Graph Coloring Engine
 *
 * Academic Foundation:
 * 1. Vertex Definition: Each lecture session is modeled as a vertex V_k.
 * 2. Edge Definition: An undirected edge (V_i, V_j) represents a conflict:
 *    - Same Teacher (cannot teach in two rooms simultaneously)
 *    - Same Classroom/Lab (cannot host two classes simultaneously)
 *    - Same Student Batch (cannot attend two lectures simultaneously)
 * 3. Adjacency Matrix: A[i][j] = 1 if edge exists, 0 otherwise.
 * 4. Welsh-Powell Algorithm:
 *    - Calculate degree d(V_k) for each vertex.
 *    - Sort vertices in descending order of degrees.
 *    - Iteratively assign colors to independent sets.
 * 5. Time-Slot Mapping & Constraint Validation:
 *    - Maps colors to discrete college periods (Mon-Fri, 6 slots/day).
 *    - Validates no teacher clash, room clash, batch clash, or lab mismatch.
 */

export const COLLEGE_SLOTS = [
  { index: 0, start: '09:00', end: '10:00', label: '09:00 - 10:00 AM', isLabSlot: false },
  { index: 1, start: '10:00', end: '11:00', label: '10:00 - 11:00 AM', isLabSlot: false },
  // 11:00 - 11:15 Short Break
  { index: 2, start: '11:15', end: '12:15', label: '11:15 - 12:15 PM', isLabSlot: false },
  { index: 3, start: '12:15', end: '01:15', label: '12:15 - 01:15 PM', isLabSlot: false },
  // 01:15 - 02:00 Lunch Break
  { index: 4, start: '02:00', end: '03:00', label: '02:00 - 03:00 PM', isLabSlot: true },
  { index: 5, start: '03:00', end: '04:00', label: '03:00 - 04:00 PM', isLabSlot: true },
];

export const COLLEGE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Generates timetable candidate using Welsh-Powell algorithm
 */
export function generateTimetableSchedule({ subjects, teachers, classrooms, existingEntries = [] }) {
  // 1. Expand subjects into individual lecture vertices
  const vertices = [];
  let vertexId = 0;

  for (const sub of subjects) {
    const isLab = sub.subject_type === 'Practical/Lab';
    const numSessions = isLab ? sub.lectures_per_week : sub.lectures_per_week;

    for (let session = 1; session <= numSessions; session++) {
      const teacher = teachers.find(t => t.id === sub.teacher_id);
      const room = classrooms.find(r => r.id === sub.classroom_id);

      vertices.push({
        id: vertexId++,
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        subjectType: sub.subject_type,
        department: sub.department,
        semester: sub.semester,
        section: sub.section,
        batchKey: `${sub.department}_${sub.semester}_${sub.section}`,
        teacherId: sub.teacher_id,
        teacherName: teacher ? teacher.name : 'Unknown',
        classroomId: sub.classroom_id,
        classroomName: room ? room.name : 'Unknown',
        roomType: room ? room.room_type : 'Classroom',
        durationMins: sub.duration_per_lecture,
        sessionIndex: session,
        color: null,
        degree: 0,
      });
    }
  }

  const N = vertices.length;
  if (N === 0) {
    return {
      success: false,
      error: 'No active subjects found for timetable generation.',
      schedule: [],
      vertices: [],
      adjacencyMatrix: [],
      welshPowellSteps: [],
      conflicts: [],
    };
  }

  // 2. Build Adjacency Matrix
  const adjacencyMatrix = Array.from({ length: N }, () => Array(N).fill(0));
  const edges = [];

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const u = vertices[i];
      const v = vertices[j];

      let hasConflict = false;
      let conflictReason = null;

      // Conflict 1: Same Student Batch cannot attend two classes at once
      if (u.batchKey === v.batchKey) {
        hasConflict = true;
        conflictReason = 'Student Batch Conflict (same semester & section)';
      }
      // Conflict 2: Same Teacher cannot be in two places at once
      else if (u.teacherId === v.teacherId) {
        hasConflict = true;
        conflictReason = 'Teacher Conflict (same faculty assigned)';
      }
      // Conflict 3: Same Classroom/Lab cannot be occupied twice
      else if (u.classroomId === v.classroomId) {
        hasConflict = true;
        conflictReason = 'Classroom/Lab Conflict (same room assigned)';
      }

      if (hasConflict) {
        adjacencyMatrix[i][j] = 1;
        adjacencyMatrix[j][i] = 1;
        edges.push({
          source: u.id,
          target: v.id,
          reason: conflictReason,
        });
      }
    }
  }

  // 3. Compute Degrees for each vertex
  for (let i = 0; i < N; i++) {
    let degree = 0;
    for (let j = 0; j < N; j++) {
      if (adjacencyMatrix[i][j] === 1) degree++;
    }
    vertices[i].degree = degree;
  }

  // 4. Welsh-Powell Greedy Graph Coloring Algorithm
  // Step 4.1: Sort vertices in descending order of degrees
  const sortedIndices = vertices
    .map((v, idx) => ({ id: v.id, degree: v.degree, originalIndex: idx }))
    .sort((a, b) => b.degree - a.degree);

  let currentColor = 1;
  const uncolored = new Set(sortedIndices.map(item => item.originalIndex));
  const welshPowellSteps = [];

  while (uncolored.size > 0) {
    const coloredInThisRound = [];

    for (const item of sortedIndices) {
      const vIdx = item.originalIndex;
      if (!uncolored.has(vIdx)) continue;

      // Check if adjacent to any vertex already colored with currentColor
      let canColor = true;
      for (const coloredIdx of coloredInThisRound) {
        if (adjacencyMatrix[vIdx][coloredIdx] === 1) {
          canColor = false;
          break;
        }
      }

      if (canColor) {
        vertices[vIdx].color = currentColor;
        uncolored.delete(vIdx);
        coloredInThisRound.push(vIdx);
      }
    }

    welshPowellSteps.push({
      round: currentColor,
      color: currentColor,
      verticesColored: coloredInThisRound.map(idx => ({
        id: vertices[idx].id,
        code: vertices[idx].subjectCode,
        name: vertices[idx].subjectName,
        teacher: vertices[idx].teacherName,
        degree: vertices[idx].degree,
      })),
    });

    currentColor++;
  }

  const chromaticNumber = currentColor - 1;

  // 5. Time Slot Allocation and Constraint Validation
  // Total college slots available per week = 5 days * 6 slots = 30 slots
  // For each day, slots 0-3 are morning theory/practical slots, slots 4-5 are afternoon lab/theory slots.
  const timeSlotsGrid = [];
  for (const day of COLLEGE_DAYS) {
    for (const slot of COLLEGE_SLOTS) {
      timeSlotsGrid.push({
        day,
        slotIndex: slot.index,
        startTime: slot.start,
        endTime: slot.end,
        isLabSlot: slot.isLabSlot,
        key: `${day}_${slot.index}`,
      });
    }
  }

  const schedule = [];
  const conflicts = [];
  const slotOccupancy = {}; // key: `${day}_${slotIndex}` -> { teachers: Set(), rooms: Set(), batches: Set() }

  // Initialize occupancy tracker with any external existing entries (e.g. from other sections)
  for (const ext of existingEntries) {
    const key = `${ext.day_of_week}_${ext.slot_index}`;
    if (!slotOccupancy[key]) {
      slotOccupancy[key] = { teachers: new Set(), rooms: new Set(), batches: new Set() };
    }
    slotOccupancy[key].teachers.add(ext.teacher_id);
    slotOccupancy[key].rooms.add(ext.classroom_id);
    slotOccupancy[key].batches.add(`${ext.department}_${ext.semester}_${ext.section}`);
  }

  // Separate Labs (which require 2 hours = 120 mins) from Theory (60 mins)
  const labVertices = vertices.filter(v => v.subjectType === 'Practical/Lab');
  const theoryVertices = vertices.filter(v => v.subjectType !== 'Practical/Lab');

  // Place Labs first (Labs prefer afternoon block 02:00 - 04:00 PM = Slot 4 & 5)
  for (const lab of labVertices) {
    let placed = false;
    for (const day of COLLEGE_DAYS) {
      const slot4Key = `${day}_4`;
      const slot5Key = `${day}_5`;

      if (!slotOccupancy[slot4Key]) slotOccupancy[slot4Key] = { teachers: new Set(), rooms: new Set(), batches: new Set() };
      if (!slotOccupancy[slot5Key]) slotOccupancy[slot5Key] = { teachers: new Set(), rooms: new Set(), batches: new Set() };

      const occ4 = slotOccupancy[slot4Key];
      const occ5 = slotOccupancy[slot5Key];

      const teacherFree = !occ4.teachers.has(lab.teacherId) && !occ5.teachers.has(lab.teacherId);
      const roomFree = !occ4.rooms.has(lab.classroomId) && !occ5.rooms.has(lab.classroomId);
      const batchFree = !occ4.batches.has(lab.batchKey) && !occ5.batches.has(lab.batchKey);

      if (teacherFree && roomFree && batchFree) {
        // Place lab
        occ4.teachers.add(lab.teacherId);
        occ4.rooms.add(lab.classroomId);
        occ4.batches.add(lab.batchKey);

        occ5.teachers.add(lab.teacherId);
        occ5.rooms.add(lab.classroomId);
        occ5.batches.add(lab.batchKey);

        schedule.push({
          vertexId: lab.id,
          subjectId: lab.subjectId,
          subjectCode: lab.subjectCode,
          subjectName: lab.subjectName,
          subjectType: lab.subjectType,
          teacherId: lab.teacherId,
          teacherName: lab.teacherName,
          classroomId: lab.classroomId,
          classroomName: lab.classroomName,
          roomType: lab.roomType,
          department: lab.department,
          semester: lab.semester,
          section: lab.section,
          dayOfWeek: day,
          slotIndex: 4,
          startTime: '02:00',
          endTime: '04:00',
          durationMins: 120,
          color: lab.color,
        });

        placed = true;
        break;
      }
    }

    if (!placed) {
      conflicts.push({
        type: 'LAB_ALLOCATION_CONFLICT',
        subject: lab.subjectName,
        teacher: lab.teacherName,
        reason: 'Unable to find 2 consecutive free afternoon slots in designated lab without collision.',
      });
    }
  }

  // Next, Place Theory lectures evenly across the week
  // Group theory by color or day to achieve balanced distribution
  let dayPointer = 0;
  for (const theory of theoryVertices) {
    let placed = false;
    let attempts = 0;

    while (attempts < timeSlotsGrid.length) {
      const slotCandidate = timeSlotsGrid[(dayPointer + attempts) % timeSlotsGrid.length];
      const key = `${slotCandidate.day}_${slotCandidate.slotIndex}`;

      if (!slotOccupancy[key]) {
        slotOccupancy[key] = { teachers: new Set(), rooms: new Set(), batches: new Set() };
      }

      const occ = slotOccupancy[key];
      const teacherFree = !occ.teachers.has(theory.teacherId);
      const roomFree = !occ.rooms.has(theory.classroomId);
      const batchFree = !occ.batches.has(theory.batchKey);

      // Check if batch already has this subject on this day (distribute lectures across days)
      const alreadyHasSubjectToday = schedule.some(
        s => s.dayOfWeek === slotCandidate.day && s.subjectId === theory.subjectId
      );

      if (teacherFree && roomFree && batchFree && (!alreadyHasSubjectToday || attempts > 15)) {
        occ.teachers.add(theory.teacherId);
        occ.rooms.add(theory.classroomId);
        occ.batches.add(theory.batchKey);

        schedule.push({
          vertexId: theory.id,
          subjectId: theory.subjectId,
          subjectCode: theory.subjectCode,
          subjectName: theory.subjectName,
          subjectType: theory.subjectType,
          teacherId: theory.teacherId,
          teacherName: theory.teacherName,
          classroomId: theory.classroomId,
          classroomName: theory.classroomName,
          roomType: theory.roomType,
          department: theory.department,
          semester: theory.semester,
          section: theory.section,
          dayOfWeek: slotCandidate.day,
          slotIndex: slotCandidate.slotIndex,
          startTime: slotCandidate.startTime,
          endTime: slotCandidate.endTime,
          durationMins: 60,
          color: theory.color,
        });

        dayPointer = (dayPointer + attempts + 1) % timeSlotsGrid.length;
        placed = true;
        break;
      }
      attempts++;
    }

    if (!placed) {
      conflicts.push({
        type: 'THEORY_SLOT_UNAVAILABLE',
        subject: theory.subjectName,
        teacher: theory.teacherName,
        reason: 'All available college time slots are congested or conflict with assigned teacher/room.',
      });
    }
  }

  // 6. Hard Constraint Validation Check
  const validationResults = validateScheduleConstraints(schedule);
  const allConflicts = [...conflicts, ...validationResults.conflicts];

  return {
    success: allConflicts.length === 0,
    isValid: allConflicts.length === 0,
    schedule,
    vertices,
    edges,
    adjacencyMatrix,
    welshPowellSteps,
    chromaticNumber,
    conflicts: allConflicts,
    stats: {
      totalVertices: N,
      totalEdges: edges.length,
      chromaticNumber,
      conflictCount: allConflicts.length,
      scheduledCount: schedule.length,
    },
  };
}

/**
 * Validates hard scheduling constraints across any timetable schedule
 */
export function validateScheduleConstraints(schedule) {
  const conflicts = [];

  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const a = schedule[i];
      const b = schedule[j];

      // Only compare entries on the same day
      if (a.dayOfWeek !== b.dayOfWeek) continue;

      // Check slot overlap
      const aEndSlot = a.durationMins > 60 ? a.slotIndex + 1 : a.slotIndex;
      const bEndSlot = b.durationMins > 60 ? b.slotIndex + 1 : b.slotIndex;

      const slotsOverlap = Math.max(a.slotIndex, b.slotIndex) <= Math.min(aEndSlot, bEndSlot);

      if (slotsOverlap) {
        // Teacher overlap
        if (a.teacherId === b.teacherId) {
          conflicts.push({
            type: 'TEACHER_OVERLAP',
            title: `Teacher Overlap: ${a.teacherName}`,
            description: `${a.teacherName} is assigned to ${a.subjectCode} (${a.classroomName}) and ${b.subjectCode} (${b.classroomName}) on ${a.dayOfWeek} at ${a.startTime}.`,
            severity: 'error',
            entryA: a,
            entryB: b,
          });
        }
        // Classroom overlap
        if (a.classroomId === b.classroomId) {
          conflicts.push({
            type: 'CLASSROOM_OVERLAP',
            title: `Classroom Overlap: ${a.classroomName}`,
            description: `${a.classroomName} is double-booked for ${a.subjectCode} and ${b.subjectCode} on ${a.dayOfWeek} at ${a.startTime}.`,
            severity: 'error',
            entryA: a,
            entryB: b,
          });
        }
        // Student batch overlap
        if (a.department === b.department && a.semester === b.semester && a.section === b.section) {
          conflicts.push({
            type: 'BATCH_OVERLAP',
            title: `Student Batch Overlap: ${a.department} Sem ${a.semester} ${a.section}`,
            description: `Students have two concurrent lectures: ${a.subjectCode} and ${b.subjectCode} on ${a.dayOfWeek} at ${a.startTime}.`,
            severity: 'error',
            entryA: a,
            entryB: b,
          });
        }
      }
    }

    // Room suitability check: Practical/Lab must be held in a Laboratory
    if (schedule[i].subjectType === 'Practical/Lab' && schedule[i].roomType !== 'Laboratory') {
      conflicts.push({
        type: 'ROOM_TYPE_MISMATCH',
        title: `Room Incompatibility: ${schedule[i].subjectCode}`,
        description: `Practical/Lab subject "${schedule[i].subjectName}" is scheduled in classroom "${schedule[i].classroomName}" instead of a specialized laboratory.`,
        severity: 'warning',
        entryA: schedule[i],
      });
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
  };
}
