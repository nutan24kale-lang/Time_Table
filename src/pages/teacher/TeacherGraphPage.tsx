import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { ConflictGraph } from '../../components/ConflictGraph';
import { Share2, BarChart3, Clock, Calendar, CheckCircle2, Award } from 'lucide-react';

export const TeacherGraphPage: React.FC = () => {
  const { user } = useAuth();
  const [graphData, setGraphData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGraph() {
      try {
        setLoading(true);
        const res = await api.getGraphAnalysis();
        setGraphData(res);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadGraph();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Faculty Graph Visualizations</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Section 12 Analytics: Personal teaching conflict graph, day-wise distribution, subject load breakdown, and time-slot heatmap.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Synthesizing graph visualization...</div>
      ) : !graphData || graphData.nodes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No scheduled lectures found to model your conflict graph.
        </div>
      ) : (
        <div>
          {/* Main Conflict Graph */}
          <ConflictGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            adjacencyMatrix={graphData.adjacencyMatrix}
            title={`Personal Teaching Graph — ${user?.name}`}
            subtitle="Vertices represent your instructional sessions; constraint edges denote mutual resource bounds."
            showFilters={false}
          />

          {/* Daily & Subject Distribution Visualizations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px' }}>
            {/* Day-Wise Lecture Distribution */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Calendar size={18} color="#0f5132" />
                  <span>Day-Wise Lecture Frequency</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(graphData.dayDistribution || {}).map(([day, count]: any) => (
                  <div key={day}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{day}</span>
                      <span style={{ fontWeight: 700, color: '#0f5132' }}>{count} lecture(s)</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, count * 25)}%`, height: '100%', background: '#16a34a', borderRadius: '5px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Distribution */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <BarChart3 size={18} color="#0f5132" />
                  <span>Subject & Course Distribution</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(graphData.subjectDistribution || {}).map(([code, count]: any) => (
                  <div key={code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f5132', fontSize: '0.9rem' }}>{code}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned Curriculum Subject</div>
                    </div>
                    <span className="badge badge-active">{count} lecs/week</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
