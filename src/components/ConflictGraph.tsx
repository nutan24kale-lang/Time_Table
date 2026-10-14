import React, { useState } from 'react';
import { Share2, Info, CheckCircle2, AlertTriangle, Filter, Eye, Grid } from 'lucide-react';

export interface GraphNode {
  id: number;
  label: string;
  subjectName: string;
  subjectCode: string;
  subjectType: string;
  teacherName: string;
  teacherId: number;
  classroomName: string;
  classroomId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotIndex: number;
  department: string;
  semester: string;
  section: string;
  color: string;
  degree: number;
}

export interface GraphEdge {
  id: string;
  source: number;
  target: number;
  type: string;
  isActualClash: boolean;
  color: string;
  description: string;
}

interface ConflictGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  adjacencyMatrix?: number[][];
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
}

export const ConflictGraph: React.FC<ConflictGraphProps> = ({
  nodes,
  edges,
  adjacencyMatrix,
  title = 'Interactive Graph & Conflict Analysis',
  subtitle = 'Graph representation of lecture vertices and constraint edges',
  showFilters = true,
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showMatrixModal, setShowMatrixModal] = useState<boolean>(false);

  // Compute 2D circular/force layout coordinates for nodes
  const width = 800;
  const height = 450;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.38;

  const nodePositions = new Map<number, { x: number; y: number }>();
  nodes.forEach((node, idx) => {
    const angle = (idx / Math.max(1, nodes.length)) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    nodePositions.set(node.id, { x, y });
  });

  const filteredEdges = edges.filter(e => {
    if (filterType === 'all') return true;
    if (filterType === 'clash_only') return e.isActualClash;
    return e.type === filterType;
  });

  const actualClashes = edges.filter(e => e.isActualClash);

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="card-title">
            <Share2 size={20} color="#0f5132" />
            <span>{title}</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>{subtitle}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {showFilters && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={16} color="#64748b" />
              <select
                className="form-control"
                style={{ padding: '6px 12px', fontSize: '0.82rem', width: 'auto' }}
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="all">All Edges ({edges.length})</option>
                <option value="clash_only">Active Conflicts Only ({actualClashes.length})</option>
                <option value="TEACHER_CONFLICT">Teacher Constraints</option>
                <option value="ROOM_CONFLICT">Classroom Constraints</option>
                <option value="BATCH_CONFLICT">Student Batch Constraints</option>
              </select>
            </div>
          )}

          {adjacencyMatrix && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowMatrixModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Grid size={15} />
              <span>Adjacency Matrix</span>
            </button>
          )}
        </div>
      </div>

      {/* Conflict Status Banner */}
      <div
        style={{
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: actualClashes.length === 0 ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${actualClashes.length === 0 ? '#86efac' : '#fca5a5'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {actualClashes.length === 0 ? (
            <CheckCircle2 size={20} color="#15803d" />
          ) : (
            <AlertTriangle size={20} color="#b91c1c" />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: actualClashes.length === 0 ? '#14532d' : '#991b1b' }}>
              {actualClashes.length === 0
                ? 'No timetable conflicts detected'
                : `${actualClashes.length} Active Conflict(s) Detected`}
            </div>
            <div style={{ fontSize: '0.78rem', color: actualClashes.length === 0 ? '#166534' : '#7f1d1d' }}>
              {actualClashes.length === 0
                ? 'All lecture vertices are colored and assigned without shared resource collisions.'
                : 'Attention required: Review overlapping edges shown in red.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
          <span style={{ color: '#0f5132' }}>Vertices: {nodes.length}</span>
          <span style={{ color: '#0f5132' }}>Constraint Edges: {edges.length}</span>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="graph-canvas-container" style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', cursor: 'grab' }}
        >
          {/* Background Grid Pattern */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Conflict Edges */}
          {filteredEdges.map(edge => {
            const src = nodePositions.get(edge.source);
            const tgt = nodePositions.get(edge.target);
            if (!src || !tgt) return null;

            const isSelected = selectedEdge?.id === edge.id;
            const strokeColor = edge.isActualClash
              ? '#ef4444'
              : edge.type === 'TEACHER_CONFLICT'
              ? '#38bdf8'
              : edge.type === 'ROOM_CONFLICT'
              ? '#fbbf24'
              : '#34d399';

            return (
              <line
                key={edge.id}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={strokeColor}
                strokeWidth={isSelected ? 3.5 : edge.isActualClash ? 2.5 : 1.2}
                strokeDasharray={edge.isActualClash ? 'none' : '4,3'}
                strokeOpacity={isSelected ? 1 : 0.65}
                style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }}
                onClick={() => setSelectedEdge(edge)}
              />
            );
          })}

          {/* Lecture Nodes */}
          {nodes.map(node => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            const isSelected = selectedNode?.id === node.id;
            const isLab = node.subjectType === 'Practical/Lab';

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow ring on hover/select */}
                <circle
                  r={isSelected ? 26 : 20}
                  fill={isLab ? 'rgba(217, 119, 6, 0.25)' : 'rgba(34, 197, 94, 0.2)'}
                  stroke={isSelected ? '#ffffff' : isLab ? '#f59e0b' : '#4ade80'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                {/* Core Node */}
                <circle
                  r={isSelected ? 16 : 14}
                  fill={isLab ? '#b45309' : '#0f5132'}
                />
                {/* Node Degree Badge */}
                <circle
                  cx={12}
                  cy={-12}
                  r={7}
                  fill="#ffffff"
                  stroke="#0f5132"
                  strokeWidth={1}
                />
                <text
                  x={12}
                  y={-9}
                  fontSize="8"
                  textAnchor="middle"
                  fontWeight="bold"
                  fill="#0f5132"
                >
                  {node.degree}
                </text>
                {/* Node Label */}
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="700"
                >
                  {node.subjectCode.substring(0, 5)}
                </text>
                <text
                  textAnchor="middle"
                  dy="30"
                  fill="#86efac"
                  fontSize="8.5"
                  fontWeight="600"
                >
                  {node.dayOfWeek.substring(0, 3)} {node.startTime}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.75rem',
            color: '#e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>Graph Legend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0f5132', border: '1px solid #4ade80' }}></span>
            <span>Theory Lecture Vertex</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#b45309', border: '1px solid #f59e0b' }}></span>
            <span>Practical/Lab Vertex</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '20px', height: '2px', background: '#ef4444' }}></span>
            <span>Active Conflict Edge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '20px', height: '2px', background: '#34d399', borderBottom: '1px dashed #34d399' }}></span>
            <span>Resolved Constraint Edge</span>
          </div>
        </div>

        {/* Click-to-inspect Node Details Drawer */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '280px',
              background: '#ffffff',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              color: '#0f172a',
              fontSize: '0.85rem',
              border: '1px solid #cbd5e1',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              <span style={{ fontWeight: 800, color: '#0f5132', fontSize: '0.95rem' }}>{selectedNode.subjectCode}</span>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <div style={{ marginBottom: '6px' }}><strong>Name:</strong> {selectedNode.subjectName}</div>
            <div style={{ marginBottom: '6px' }}><strong>Type:</strong> {selectedNode.subjectType}</div>
            <div style={{ marginBottom: '6px' }}><strong>Teacher:</strong> {selectedNode.teacherName}</div>
            <div style={{ marginBottom: '6px' }}><strong>Classroom:</strong> {selectedNode.classroomName}</div>
            <div style={{ marginBottom: '6px' }}><strong>Schedule:</strong> {selectedNode.dayOfWeek} at {selectedNode.startTime}-{selectedNode.endTime}</div>
            <div style={{ marginBottom: '6px' }}><strong>Batch:</strong> {selectedNode.department} Sem {selectedNode.semester} ({selectedNode.section})</div>
            <div><strong>Graph Degree:</strong> {selectedNode.degree} adjacent conflicts</div>
          </div>
        )}
      </div>

      {/* Adjacency Matrix Modal */}
      {showMatrixModal && adjacencyMatrix && (
        <div className="modal-overlay" onClick={() => setShowMatrixModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div className="modal-title">Graph Adjacency Matrix (N × N)</div>
              <button onClick={() => setShowMatrixModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '14px' }}>
                Binary representation where <strong>A[i][j] = 1</strong> denotes a mutual constraint (shared teacher, room, or student batch) between vertex <em>v_i</em> and <em>v_j</em>, and <strong>0</strong> denotes conflict-free independent coexistence.
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '4px 6px', background: '#0f5132', color: 'white', border: '1px solid #cbd5e1' }}>V</th>
                      {nodes.map((n, idx) => (
                        <th key={idx} style={{ padding: '4px 6px', background: '#0f5132', color: 'white', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                          {n.subjectCode.substring(0, 5)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adjacencyMatrix.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td style={{ padding: '4px 6px', background: '#f1f8f4', fontWeight: 'bold', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                          {nodes[rIdx]?.subjectCode.substring(0, 5) || `v${rIdx}`}
                        </td>
                        {row.map((val, cIdx) => (
                          <td
                            key={cIdx}
                            style={{
                              padding: '4px 8px',
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
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowMatrixModal(false)}>
                Close Matrix View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
