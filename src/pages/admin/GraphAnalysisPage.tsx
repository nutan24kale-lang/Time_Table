import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ConflictGraph } from '../../components/ConflictGraph';
import { Share2, Filter, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const GraphAnalysisPage: React.FC = () => {
  const [graphData, setGraphData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [department, setDepartment] = useState('AIDS');
  const [semester, setSemester] = useState('4th');
  const [section, setSection] = useState('Section A');
  const [conflictType, setConflictType] = useState('');

  const loadGraph = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (department) params.department = department;
      if (semester) params.semester = semester;
      if (section) params.section = section;
      if (conflictType) params.conflict_type = conflictType;

      const res = await api.getGraphAnalysis(params);
      setGraphData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [department, semester, section, conflictType]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Interactive Graph & Conflict Analysis</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Graph-theoretic visualization modeling lecture sessions as vertices and resource collisions as conflict edges.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-label">Department</label>
            <select
              className="form-control"
              value={department}
              onChange={e => setDepartment(e.target.value)}
            >
              <option value="AIDS">AIDS (Artificial Intelligence & Data Science)</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </div>

          <div>
            <label className="form-label">Semester</label>
            <select
              className="form-control"
              value={semester}
              onChange={e => setSemester(e.target.value)}
            >
              {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(s => (
                <option key={s} value={s}>{s} Semester</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Section</label>
            <select
              className="form-control"
              value={section}
              onChange={e => setSection(e.target.value)}
            >
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
            </select>
          </div>

          <div>
            <label className="form-label">Conflict Constraint Type</label>
            <select
              className="form-control"
              value={conflictType}
              onChange={e => setConflictType(e.target.value)}
            >
              <option value="">All Constraints</option>
              <option value="TEACHER_CONFLICT">Faculty Scheduling Constraints</option>
              <option value="ROOM_CONFLICT">Classroom / Lab Constraints</option>
              <option value="BATCH_CONFLICT">Student Batch Constraints</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Constructing Graph & Adjacency Matrix...</div>
      ) : !graphData || graphData.nodes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No published timetable entries found for graph modeling.
        </div>
      ) : (
        <ConflictGraph
          nodes={graphData.nodes}
          edges={graphData.edges}
          adjacencyMatrix={graphData.adjacencyMatrix}
          title={`Conflict Graph: ${department} Sem ${semester} (${section})`}
          subtitle="Graph vertices represent scheduled lectures; edges represent simultaneous constraints resolved by Welsh-Powell coloring."
        />
      )}
    </div>
  );
};
