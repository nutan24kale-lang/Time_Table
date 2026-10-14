import React from 'react';
import { BookOpen, FileText, Network, CheckCircle2, ShieldCheck, Database, Cpu } from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Final Year Project Academic Documentation</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Smart Timetable Scheduler &bull; Final Year AIDS (Artificial Intelligence & Data Science) Project Report and Technical Specifications.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Abstract & Problem Statement */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <FileText size={20} color="#0f5132" />
              <span>1. Project Overview, Abstract & Problem Statement</span>
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7 }}>
            <p style={{ marginBottom: '12px' }}>
              <strong>Official Project Title:</strong> Smart Timetable Scheduler<br />
              <strong>Degree / Academic Discipline:</strong> Bachelor of Engineering (B.E.) in Artificial Intelligence & Data Science (AIDS)
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>Abstract:</strong> Scheduling university academic timetables is an NP-complete combinatorial optimization challenge. Traditional manual methods lead to frequent faculty clashes, double-booked classrooms, overloaded student schedules, and chaotic ad-hoc substitution handling during teacher absences. The <em>Smart Timetable Scheduler</em> formulates academic scheduling as a Graph Coloring problem. Lecture sessions are modeled as vertices in an undirected graph <em>G = (V, E)</em>, with mutual resource collisions represented as conflict edges. The Welsh-Powell Greedy Graph Coloring algorithm partitions lectures into independent, non-conflicting chromatic classes, followed by multi-constraint satisfaction mapping to discrete collegiate time slots.
            </p>
            <p>
              <strong>Existing System Limitations:</strong>
              <ul style={{ paddingLeft: '24px', marginTop: '6px' }}>
                <li>Manual spreadsheet generation taking days or weeks of trial-and-error.</li>
                <li>Undetected resource overlaps (instructor scheduled in two rooms simultaneously).</li>
                <li>Failure to optimize specialized laboratory facilities versus theoretical lecture halls.</li>
                <li>No automated replacement engine during sudden teacher absence or planned leave.</li>
                <li>Static paper timetables that fail to propagate schedule alterations in real-time.</li>
              </ul>
            </p>
          </div>
        </div>

        {/* Section 2: Mathematical Graph Theory & Welsh-Powell Formulation */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Network size={20} color="#0f5132" />
              <span>2. Graph Representation, Adjacency Matrix & Welsh-Powell Algorithm</span>
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7 }}>
            <p style={{ marginBottom: '12px' }}>
              <strong>1. Vertex Formulation:</strong><br />
              Let <em>V = {'{v_1, v_2, ..., v_n}'}</em> be the set of lecture instances to be scheduled. Each vertex <em>v_i = (Subject, Faculty, Room, Batch, Duration)</em>.
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>2. Conflict Edge Formulation:</strong><br />
              An undirected edge <em>(v_i, v_j) ∈ E</em> exists if and only if two lectures cannot occur simultaneously due to:
              <ul style={{ paddingLeft: '24px', marginTop: '4px' }}>
                <li><strong>Teacher Clash:</strong> <em>Faculty(v_i) = Faculty(v_j)</em></li>
                <li><strong>Classroom Clash:</strong> <em>Room(v_i) = Room(v_j)</em></li>
                <li><strong>Student Batch Clash:</strong> <em>Batch(v_i) = Batch(v_j)</em></li>
              </ul>
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>3. Adjacency Matrix A:</strong><br />
              A binary symmetric matrix of size <em>N × N</em> where <em>A[i][j] = 1</em> if an edge exists between <em>v_i</em> and <em>v_j</em>, and <em>A[i][j] = 0</em> otherwise. The degree of vertex <em>v_i</em> is:
              <br />
              <code>d(v_i) = ∑_{'{j=1}'}^{'{N}'} A[i][j]</code>
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>4. Welsh-Powell Greedy Graph Coloring Algorithm:</strong>
              <ol style={{ paddingLeft: '24px', marginTop: '4px' }}>
                <li>Compute the degree <em>d(v_i)</em> for all vertices <em>v_i ∈ V</em>.</li>
                <li>Sort all vertices in non-increasing order of their degrees: <em>d(v_1) ≥ d(v_2) ≥ ... ≥ d(v_n)</em>.</li>
                <li>Initialize color index <em>k = 1</em>. Assign color <em>C_k</em> to the first uncolored vertex in the sorted list.</li>
                <li>Iterate through the remaining uncolored vertices in sorted order. If an uncolored vertex has no edge to any vertex already colored with <em>C_k</em>, assign color <em>C_k</em> to it.</li>
                <li>Repeat steps 3–4 with <em>k = k + 1</em> until all vertices in <em>V</em> are colored.</li>
                <li>The minimum number of colors used represents the chromatic number <em>χ(G)</em>.</li>
              </ol>
            </p>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #0f5132' }}>
              <strong>Important Architectural Distinction:</strong> Graph Coloring groups lectures into conflict-free concurrent independent sets. Full collegiate timetable generation subsequently maps these color classes to discrete weekly periods (Monday–Friday, 09:00–16:00), accommodating 2-hour laboratory blocks, lunch breaks, and room suitability checks.
            </div>
          </div>
        </div>

        {/* Section 3: Teacher Absence & Replacement Pipeline */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Cpu size={20} color="#0f5132" />
              <span>3. Section 13 Teacher Absence & Replacement Multi-Stage Pipeline</span>
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7 }}>
            <ol style={{ paddingLeft: '24px' }}>
              <li><strong>Detection:</strong> When faculty submits an absence request, identify all scheduled published lectures in the affected date/period window.</li>
              <li><strong>Qualification Matching:</strong> Query active teachers specializing in the subject matter.</li>
              <li><strong>Slot Availability:</strong> Verify candidate is not on leave and has no conflicting lecture in that period.</li>
              <li><strong>Workload Balancing:</strong> Compute a ranking score prioritizing teachers with lower cumulative weekly hours: <em>Score = BaseAffinity(50) + SpecializationMatch(35) + WorkloadCushion(20 - Hours)</em>.</li>
              <li><strong>Alternative Slot Recovery:</strong> If no substitute is free in the original time slot, scan the remaining collegiate week for alternative conflict-free slots.</li>
              <li><strong>Unresolved Handling:</strong> If neither solution is viable, flag lecture as "Unresolved" and trigger high-priority alerts to the Head of Department.</li>
              <li><strong>Approval & Propagation:</strong> Admin approves replacement; changes propagate in real-time to teacher and student portals.</li>
            </ol>
          </div>
        </div>

        {/* Section 4: Security & Database Design */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Database size={20} color="#0f5132" />
              <span>4. Database Architecture & Role-Based Security Matrix</span>
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7 }}>
            <p style={{ marginBottom: '10px' }}>
              The application uses an embedded relational SQLite database with foreign key constraints, unique indexes, and ACID transactional guarantees.
            </p>
            <div className="table-container">
              <table className="data-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>System Role</th>
                    <th>Authentication</th>
                    <th>Permissions & Access Control</th>
                    <th>Bound Data Scope</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Admin (HOD)</strong></td>
                    <td>JWT + bcrypt</td>
                    <td>Full CRUD: Subjects, Teachers, Rooms, Generator, Drafts, Publish, Absence Approval, Rollback</td>
                    <td>College-Wide Scope</td>
                  </tr>
                  <tr>
                    <td><strong>Teacher</strong></td>
                    <td>JWT + bcrypt</td>
                    <td>View Personal Timetable, Submit Absence, View Personal Workload & Graphs, Substitution Notices</td>
                    <td>Own Faculty Profile Only</td>
                  </tr>
                  <tr>
                    <td><strong>Student</strong></td>
                    <td>JWT + bcrypt</td>
                    <td>Read-Only: View Class Timetable, Download/Print, View Class Graphs, Notices</td>
                    <td>Assigned Class / Semester Only</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
