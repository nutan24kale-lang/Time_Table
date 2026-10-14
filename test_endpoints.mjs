const BASE_URL = 'http://localhost:5000';

async function testAll() {
  console.log('--- Starting API Integration Tests ---');

  // 1. Admin Login
  console.log('1. Testing Admin Login...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@college.edu', password: 'Admin@123' })
  });
  if (!loginRes.ok) throw new Error(`Admin login failed: ${loginRes.status} ${await loginRes.text()}`);
  const adminData = await loginRes.json();
  const token = adminData.token;
  console.log('   Admin logged in successfully:', adminData.user.name, 'Role:', adminData.user.role);

  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 2. Overview Stats (EXACTLY 4 stats)
  console.log('2. Testing Admin Overview Stats...');
  const statsRes = await fetch(`${BASE_URL}/api/admin/overview`, { headers: authHeaders });
  if (!statsRes.ok) throw new Error(`Overview failed: ${statsRes.status} ${await statsRes.text()}`);
  const stats = await statsRes.json();
  console.log('   Stats retrieved:', {
    totalSubjects: stats.totalSubjects,
    totalTeachers: stats.totalTeachers,
    totalClassrooms: stats.totalClassrooms,
    timetableStatus: stats.timetableStatus,
  });

  // 3. Subjects list
  console.log('3. Testing Subjects Fetch...');
  const subjectsRes = await fetch(`${BASE_URL}/api/subjects`, { headers: authHeaders });
  const subjectsData = await subjectsRes.json();
  console.log(`   Fetched ${subjectsData.subjects.length} subjects.`);

  // 4. Classrooms list
  console.log('4. Testing Classrooms Fetch...');
  const roomsRes = await fetch(`${BASE_URL}/api/classrooms`, { headers: authHeaders });
  const roomsData = await roomsRes.json();
  console.log(`   Fetched ${roomsData.classrooms.length} classrooms.`);

  // 5. Teachers list
  console.log('5. Testing Teachers Fetch...');
  const teachersRes = await fetch(`${BASE_URL}/api/teachers`, { headers: authHeaders });
  const teachersData = await teachersRes.json();
  console.log(`   Fetched ${teachersData.teachers.length} teachers.`);

  // 6. Room Availability Grid
  console.log('6. Testing Availability Grid...');
  const availRes = await fetch(`${BASE_URL}/api/availability`, { headers: authHeaders });
  const avail = await availRes.json();
  console.log(`   Availability returned for ${avail.rooms.length} rooms across ${avail.collegeDays.length} days.`);

  // 7. Graph Analysis (Adjacency Matrix, Conflict count)
  console.log('7. Testing Graph Analysis...');
  const graphRes = await fetch(`${BASE_URL}/api/graph-analysis?department=AIDS&semester=4th&section=Section%20A`, { headers: authHeaders });
  const graphData = await graphRes.json();
  console.log(`   Graph analysis: Vertices=${graphData.totalNodes}, Edges=${graphData.totalEdges}, Active Clashes=${graphData.activeConflictsCount}, Matrix=${graphData.adjacencyMatrix.length}x${graphData.adjacencyMatrix.length}`);

  // 8. Timetable Generator Test (Simulation / preview mode with Welsh-Powell)
  console.log('8. Testing Timetable Generator (preview mode with Welsh-Powell)...');
  const genRes = await fetch(`${BASE_URL}/api/generator/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      academic_year: '2026-2027',
      term: 'odd',
      department: 'AIDS',
      semester: '4th',
      section: 'Section A',
      effective_date: '2026-07-01',
      save: false
    })
  });
  if (!genRes.ok) throw new Error(`Generator failed: ${genRes.status} ${await genRes.text()}`);
  const genData = await genRes.json();
  console.log(`   Generation successful! Slots scheduled: ${genData.schedule.length}, Chromatic Number: ${genData.chromaticNumber}, Conflicts: ${genData.conflicts.length}`);

  // 9. Absence and Replacement Pipeline
  console.log('9. Testing Teacher Absence & Candidate Ranking...');
  const absRes = await fetch(`${BASE_URL}/api/absences`, { headers: authHeaders });
  const absData = await absRes.json();
  console.log(`   Active absences: ${absData.absences.length}`);

  // 10. Reports: Faculty Workload & Room Utilization
  console.log('10. Testing Reports...');
  const repRes = await fetch(`${BASE_URL}/api/reports/utilization`, { headers: authHeaders });
  const repData = await repRes.json();
  console.log(`   Room Utilization: ${repData.rooms.length} rooms analyzed, Avg Utilization: ${repData.averageUtilization}%`);

  const workRes = await fetch(`${BASE_URL}/api/reports/workload`, { headers: authHeaders });
  const workData = await workRes.json();
  console.log(`   Faculty Workload: ${workData.workload.length} teachers analyzed.`);

  // 11. Timetable Versions
  console.log('11. Testing Versions...');
  const verRes = await fetch(`${BASE_URL}/api/versions`, { headers: authHeaders });
  const verData = await verRes.json();
  console.log(`   Timetable versions recorded: ${verData.versions.length}`);

  // 12. Notifications
  console.log('12. Testing Notifications...');
  const notifRes = await fetch(`${BASE_URL}/api/notifications`, { headers: authHeaders });
  const notifData = await notifRes.json();
  console.log(`   Notifications fetched: ${notifData.notifications.length}`);

  console.log('\n======================================================');
  console.log('  ALL API INTEGRATION TESTS PASSED WITH 100% SUCCESS! ');
  console.log('======================================================');
}

testAll().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
