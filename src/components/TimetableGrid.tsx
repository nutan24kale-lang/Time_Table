import React from 'react';
import { COLLEGE_DAYS, COLLEGE_SLOTS } from '../../server/algorithms/welshPowell.js';
import { Calendar, Printer, Download, Clock, MapPin, User, Award, ShieldAlert } from 'lucide-react';

export interface TimetableEntry {
  id: number;
  subject_name: string;
  subject_code: string;
  subject_type: string;
  department: string;
  semester: string;
  section: string;
  teacher_name: string;
  classroom_name: string;
  room_type?: string;
  building?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_index: number;
  duration_mins: number;
  is_replacement?: number;
  replacement_teacher_name?: string;
  status?: string;
}

interface TimetableGridProps {
  entries: TimetableEntry[];
  title?: string;
  scope?: string;
  academicYear?: string;
  statusBadge?: string;
  versionNumber?: number | string;
  onPrint?: () => void;
  onExportCsv?: () => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  entries,
  title = 'Weekly Academic Schedule',
  scope = 'AIDS / Semester 4 / Section A',
  academicYear = '2026-2027',
  statusBadge = 'Published',
  versionNumber = '1.0',
  onPrint,
  onExportCsv,
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleDownloadCsv = () => {
    let csv = 'Day,Start Time,End Time,Subject Code,Subject Name,Subject Type,Teacher,Room\n';
    for (const e of entries) {
      const teacher = e.is_replacement && e.replacement_teacher_name ? `${e.replacement_teacher_name} (Substitute)` : e.teacher_name;
      csv += `"${e.day_of_week}","${e.start_time}","${e.end_time}","${e.subject_code}","${e.subject_name}","${e.subject_type}","${teacher}","${e.classroom_name}"\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Timetable_${scope.replace(/[\s\/]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Printable Header (Visible only when printing) */}
      <div className="print-header" style={{ display: 'none' }}>
        <h1>Smart Timetable Scheduler</h1>
        <p>Department of AIDS (Artificial Intelligence & Data Science) — Academic Year {academicYear}</p>
        <p><strong>Scope:</strong> {scope} | <strong>Status:</strong> {statusBadge} (v{versionNumber}) | <strong>Date:</strong> {new Date().toLocaleDateString()}</p>
      </div>

      {/* Screen Controls Header */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f5132', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={22} />
            <span>{title}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
            {scope} &bull; Academic Year {academicYear} &bull; Version {versionNumber}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`overview-badge ${statusBadge.toLowerCase() === 'published' ? 'published' : 'draft'}`}>
            {statusBadge}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadCsv} title="Download CSV">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint} title="Print or Save as PDF">
            <Printer size={15} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Timetable Weekly Grid */}
      <div className="timetable-grid-wrapper">
        <div className="timetable-grid">
          {/* Day / Time Corner Header */}
          <div className="timetable-header-cell" style={{ background: '#093320', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span>Day / Time</span>
          </div>

          {/* Time Slot Column Headers */}
          {COLLEGE_SLOTS.map(slot => (
            <div key={slot.index} className="timetable-header-cell">
              <div>{slot.start} - {slot.end}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85, fontWeight: 500 }}>
                {slot.isLabSlot ? 'Period ' + (slot.index + 1) + ' (Lab/Th)' : 'Period ' + (slot.index + 1)}
              </div>
            </div>
          ))}

          {/* Grid Rows for each College Day */}
          {COLLEGE_DAYS.map(day => (
            <React.Fragment key={day}>
              {/* Day Header */}
              <div className="timetable-day-cell">
                <span>{day}</span>
              </div>

              {/* Slot Cells */}
              {COLLEGE_SLOTS.map(slot => {
                // Find entry that starts at this slot
                const entry = entries.find(e => e.day_of_week === day && e.slot_index === slot.index);

                // Check if this slot is covered by a 2-hour lab that started in previous slot (slot 4)
                const isContinuation = slot.index === 5 && entries.some(e => e.day_of_week === day && e.slot_index === 4 && e.duration_mins > 60);

                if (isContinuation) {
                  return (
                    <div key={slot.index} className="timetable-slot-cell" style={{ background: '#fffbeb', borderLeft: 'none' }}>
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', fontSize: '0.75rem', fontWeight: 600 }}>
                        &larr; Lab Session Continued
                      </div>
                    </div>
                  );
                }

                if (!entry) {
                  return (
                    <div key={slot.index} className="timetable-slot-cell">
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '0.75rem' }}>
                        &mdash;
                      </div>
                    </div>
                  );
                }

                const isLab = entry.subject_type === 'Practical/Lab';
                const isReplacement = entry.is_replacement === 1 || entry.status === 'substituted';

                return (
                  <div key={slot.index} className="timetable-slot-cell">
                    <div className={`timetable-entry-card ${isLab ? 'lab-card' : ''} ${isReplacement ? 'replacement-card' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="entry-code">{entry.subject_code}</span>
                        {isReplacement ? (
                          <span style={{ fontSize: '0.65rem', background: '#7c3aed', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                            Sub
                          </span>
                        ) : isLab ? (
                          <span style={{ fontSize: '0.65rem', background: '#d97706', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                            Lab
                          </span>
                        ) : null}
                      </div>

                      <div className="entry-name" title={entry.subject_name}>
                        {entry.subject_name}
                      </div>

                      <div className="entry-meta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={11} />
                          {isReplacement && entry.replacement_teacher_name ? (
                            <strong style={{ color: '#6d28d9' }}>{entry.replacement_teacher_name}</strong>
                          ) : (
                            entry.teacher_name
                          )}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={11} /> {entry.classroom_name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
