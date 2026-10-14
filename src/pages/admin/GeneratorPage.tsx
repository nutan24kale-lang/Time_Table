import React, { useState } from 'react';
import { api } from '../../api/client';
import { TimetableGrid } from '../../components/TimetableGrid';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  Save,
  Send,
  Eye,
  AlertTriangle,
  Network,
  ListOrdered,
  Grid,
  Info,
} from 'lucide-react';

export const GeneratorPage: React.FC = () => {
  const [department, setDepartment] = useState('AIDS');
  const [semester, setSemester] = useState('4th');
  const [section, setSection] = useState('Section A');

  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [generatedData, setGeneratedData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'algorithm' | 'matrix'>('calendar');

  const handleGenerate = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setValidationResult(null);
    setGenerating(true);

    try {
      const res = await api.generateTimetable({ department, semester, section });
      if (!res.success && res.error) {
        setErrorMsg(res.error);
        setGeneratedData(null);
      } else {
        setGeneratedData(res);
        setSuccessMsg(`Generated candidate timetable via Welsh-Powell algorithm. Chromatic number: ${res.chromaticNumber}. Total lectures scheduled: ${res.schedule.length}.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleValidate = async () => {
    if (!generatedData || !generatedData.schedule) return;
    setValidating(true);
    try {
      const res = await api.validateSchedule(generatedData.schedule);
      setValidationResult(res);
      if (res.isValid) {
        setSuccessMsg('Comprehensive multi-constraint validation passed! 0 resource collisions detected.');
      } else {
        setErrorMsg(`Validation detected ${res.conflicts.length} conflict(s). Review details below.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!generatedData || !generatedData.schedule) return;
    setSaving(true);
    try {
      const res = await api.saveDraftTimetable({
        department,
        semester,
        section,
        schedule: generatedData.schedule,
      });
      setSuccessMsg(`Draft timetable saved to database with ID #${res.timetableId}.`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedData || !generatedData.schedule) return;
    if (!window.confirm('Are you sure you want to publish this timetable? This will make it active across student and teacher portals and archive prior versions.')) return;

    setPublishing(true);
    try {
      const res = await api.publishTimetable({
        department,
        semester,
        section,
        schedule: generatedData.schedule,
      });
      setSuccessMsg(`Timetable published officially as Version ${res.version}! All student & teacher portals updated.`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Smart Timetable Generator</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Automated schedule generation powered by Graph Theory, Adjacency Matrix computation, and the Welsh-Powell Greedy Graph Coloring algorithm.
        </p>
      </div>

      {errorMsg && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} color="#dc2626" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#14532d', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} color="#15803d" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Target Batch Configuration & Execution Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label className="form-label required">Target Department</label>
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
            <label className="form-label required">Semester</label>
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
            <label className="form-label required">Class Section</label>
            <select
              className="form-control"
              value={section}
              onChange={e => setSection(e.target.value)}
            >
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? <RefreshCw size={18} className="animate-spin" /> : <Cpu size={18} />}
            <span>{generatedData ? 'Regenerate Candidate' : 'Generate Timetable'}</span>
          </button>

          {generatedData && (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleValidate}
                disabled={validating}
              >
                <CheckCircle2 size={18} color="#16a34a" />
                <span>{validating ? 'Validating...' : 'Validate Constraints'}</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleSaveDraft}
                disabled={saving}
              >
                <Save size={18} />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <button
                className="btn btn-success"
                onClick={handlePublish}
                disabled={publishing}
              >
                <Send size={18} />
                <span>{publishing ? 'Publishing...' : 'Publish Timetable'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Generated Timetable Candidate Display */}
      {generatedData && (
        <div>
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
            <button
              className={`btn ${activeTab === 'calendar' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveTab('calendar')}
            >
              Weekly Calendar Grid
            </button>
            <button
              className={`btn ${activeTab === 'algorithm' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveTab('algorithm')}
            >
              <ListOrdered size={15} />
              <span>Welsh-Powell Trace & Degrees</span>
            </button>
            <button
              className={`btn ${activeTab === 'matrix' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveTab('matrix')}
            >
              <Grid size={15} />
              <span>Adjacency Matrix (N×N)</span>
            </button>
          </div>

          {/* Tab 1: Calendar View */}
          {activeTab === 'calendar' && (
            <TimetableGrid
              entries={generatedData.schedule.map((s: any, idx: number) => ({
                id: idx,
                subject_name: s.subjectName,
                subject_code: s.subjectCode,
                subject_type: s.subjectType,
                department: s.department,
                semester: s.semester,
                section: s.section,
                teacher_name: s.teacherName,
                classroom_name: s.classroomName,
                day_of_week: s.dayOfWeek,
                start_time: s.startTime,
                end_time: s.endTime,
                slot_index: s.slotIndex,
                duration_mins: s.durationMins,
              }))}
              title={`Candidate Timetable: ${department} Sem ${semester} (${section})`}
              scope={`${department} / Semester ${semester} / ${section}`}
              statusBadge={generatedData.isValid ? 'Valid Candidate' : 'Has Conflicts'}
              versionNumber="Draft Candidate"
            />
          )}

          {/* Tab 2: Welsh-Powell Algorithm Steps */}
          {activeTab === 'algorithm' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Network size={20} color="#0f5132" />
                  <span>Welsh-Powell Step-by-Step Color Allocation</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700 }}>
                  Chromatic Number χ(G) = {generatedData.chromaticNumber}
                </div>
              </div>

              <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '10px', fontSize: '0.85rem', color: '#334155' }}>
                <p>
                  <strong>Welsh-Powell Ordering Criterion:</strong> The algorithm first counts the degree (number of conflicting edges) of every lecture vertex, sorts them in descending order: <em>d(v_1) ≥ d(v_2) ≥ ... ≥ d(v_n)</em>, and sequentially assigns non-conflicting colors to independent sets.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {generatedData.welshPowellSteps.map((step: any) => (
                  <div key={step.round} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: '#ffffff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0f5132', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          C{step.color}
                        </span>
                        <span style={{ fontWeight: 700, color: '#0f5132' }}>Color Group #{step.color} (Independent Set)</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{step.verticesColored.length} concurrent vertices</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                      {step.verticesColored.map((v: any) => (
                        <div key={v.id} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem' }}>
                          <div style={{ fontWeight: 700, color: '#14532d' }}>{v.code}: {v.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#475569' }}>Teacher: {v.teacher}</div>
                          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>Conflict Degree: {v.degree}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Adjacency Matrix */}
          {activeTab === 'matrix' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Grid size={20} color="#0f5132" />
                  <span>Adjacency Matrix A (N = {generatedData.vertices.length} Vertices)</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                Each cell represents mutual conflict incompatibility (1 = conflict edge, 0 = non-conflicting).
              </p>
              <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px', background: '#0f5132', color: 'white', border: '1px solid #cbd5e1' }}>V</th>
                      {generatedData.vertices.map((v: any) => (
                        <th key={v.id} style={{ padding: '6px', background: '#0f5132', color: 'white', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                          {v.subjectCode}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {generatedData.adjacencyMatrix.map((row: number[], rIdx: number) => (
                      <tr key={rIdx}>
                        <td style={{ padding: '6px', background: '#f1f8f4', fontWeight: 'bold', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                          {generatedData.vertices[rIdx]?.subjectCode} (v{rIdx})
                        </td>
                        {row.map((val: number, cIdx: number) => (
                          <td
                            key={cIdx}
                            style={{
                              padding: '6px 8px',
                              textAlign: 'center',
                              border: '1px solid #e2e8f0',
                              background: val === 1 ? '#fee2e2' : '#ffffff',
                              color: val === 1 ? '#b91c1c' : '#94a3b8',
                              fontWeight: val === 1 ? 'bold' : 'normal',
                            }}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
