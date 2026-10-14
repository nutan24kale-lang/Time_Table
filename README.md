# SMART TIMETABLE SCHEDULER
## Final Year AIDS (Artificial Intelligence & Data Science) Project — Technical Documentation & Manual

**Official Website Name:** Smart Timetable Scheduler  
**Academic Degree:** Bachelor of Engineering in Artificial Intelligence & Data Science (AIDS)  
**Primary Theme:** Dark Green (`#0f5132`, `#14532d`) & White  
**Core Technologies:** Node.js (v24), Express, React 19, TypeScript, SQLite (`node:sqlite`), Graph Theory, Welsh-Powell Algorithm  

---

## 1. ABSTRACT

Automating collegiate timetable generation represents a classic NP-complete combinatorial scheduling problem. Manual scheduling in engineering colleges is notoriously labor-intensive, error-prone, and struggles to prevent instructor overlaps, room conflicts, and student schedule congestions. 

**Smart Timetable Scheduler** formulates academic timetable scheduling as a Graph Coloring problem. Each discrete lecture session is modeled as a vertex $V_i$ in an undirected graph $G = (V, E)$, with mutual resource constraints (shared teacher, room, or student batch) forming conflict edges $E$. Using an $N \times N$ binary Adjacency Matrix and the **Welsh-Powell Greedy Graph Coloring** algorithm, the system partitions lecture sessions into independent chromatic sets. A multi-constraint validation and time-slot mapping engine then maps these groups into weekly collegiate schedules (Monday–Friday, 09:00–16:00), accommodating 2-hour laboratory sessions, lunch breaks, and room suitability checks. Furthermore, the system incorporates an automated Teacher Absence & Replacement decision pipeline that ranks substitute instructors and discovers conflict-free rescheduled slots.

---

## 2. PROBLEM STATEMENT & OBJECTIVES

### 2.1 Problem Statement
Colleges and universities face critical logistical bottlenecks when allocating faculty members, specialized laboratories, and classrooms across multiple semesters and sections. Manual timetable preparation leads to:
1. **Faculty Overlaps:** Instructors mistakenly assigned to two rooms at the same time.
2. **Room Collisions:** Double-booking of lecture halls or specialized labs.
3. **Student Batch Clashes:** Multiple concurrent lectures for the same student cohort.
4. **Teacher Absence Disruptions:** Unpreparedness during faculty absence, leading to cancelled classes without qualified substitutes.
5. **Static Information Silos:** Paper or spreadsheet schedules that fail to synchronize changes across students and faculty in real-time.

### 2.2 Project Objectives
- Model academic scheduling constraints through Graph Theory and an $N \times N$ Adjacency Matrix.
- Implement the Welsh-Powell Greedy Graph Coloring algorithm to calculate the chromatic number $\chi(G)$ and allocate independent lecture sets.
- Implement discrete time-slot mapping respecting 1-hour theory lectures and 2-hour practical laboratory blocks.
- Build a persistent shared SQLite database with ACID guarantees, foreign keys, and unique constraints.
- Implement secure Role-Based Access Control (RBAC) with cryptographic JWT tokens for **Admin**, **Teacher**, and **Student** roles.
- Provide interactive graph analysis, conflict detection, and adjacency matrix inspection.
- Build an automated Teacher Absence & Replacement workflow with qualification matching and workload ranking.
- Provide workload telemetry, classroom utilization analytics, PDF/print exports, and version rollback auditing.

---

## 3. EXISTING SYSTEM LIMITATIONS VS. PROPOSED SYSTEM

| Feature | Existing Manual Systems | Proposed Smart Timetable Scheduler |
| :--- | :--- | :--- |
| **Generation Speed** | Weeks of manual trial-and-error | Instant algorithmic generation in seconds |
| **Conflict Detection** | Visual inspection (often misses subtle clashes) | Mathematical guarantee via Graph Coloring & Constraint Validation |
| **Lab Allocation** | Frequently placed in standard classrooms | Strict room type & equipment verification |
| **Faculty Absence** | Unplanned class cancellations | Automated substitute ranking & alternative slot discovery |
| **Data Propagation** | Paper noticeboards | Real-time synchronized dashboards for Admin, Teacher, & Student |
| **Auditing & History** | None | Full timetable version snapshots with 1-click restoration |

---

## 4. MATHEMATICAL FORMULATION & ALGORITHMS

### 4.1 Graph Representation & Adjacency Matrix
Let $G = (V, E)$ be an undirected graph where:
- **Vertices ($V$):** Each lecture session instance to be scheduled is a vertex $v_i \in V$.
  $$v_i = (\text{Subject}, \text{Faculty}, \text{Room}, \text{Batch}, \text{Duration})$$
- **Edges ($E$):** An undirected edge $(v_i, v_j) \in E$ denotes a mutual scheduling conflict:
  1. **Teacher Conflict:** $\text{Faculty}(v_i) = \text{Faculty}(v_j)$
  2. **Classroom Conflict:** $\text{Room}(v_i) = \text{Room}(v_j)$
  3. **Batch Conflict:** $\text{Batch}(v_i) = \text{Batch}(v_j)$

The **Adjacency Matrix** $A$ of size $N \times N$ is defined as:
$$A[i][j] = \begin{cases} 1 & \text{if } (v_i, v_j) \in E \text{ and } i \neq j \\ 0 & \text{otherwise} \end{cases}$$

The degree $d(v_i)$ of vertex $v_i$ represents its total number of conflicting neighbors:
$$d(v_i) = \sum_{j=1}^{N} A[i][j]$$

### 4.2 Welsh-Powell Greedy Graph Coloring Algorithm
The Welsh-Powell algorithm orders vertices by degree to minimize the total colors (chromatic number $\chi(G)$) needed:

1. **Step 1:** Calculate degree $d(v_i)$ for all vertices $v_i \in V$.
2. **Step 2:** Sort all vertices in descending order of degrees:
   $$d(v_{(1)}) \ge d(v_{(2)}) \ge \dots \ge d(v_{(n)})$$
3. **Step 3:** Select color $C_1$. Assign $C_1$ to the first uncolored vertex in the sorted list.
4. **Step 4:** Scan the remaining uncolored vertices in sorted order. If a vertex is not adjacent to any vertex already colored $C_1$, assign $C_1$ to it.
5. **Step 5:** Increment color index ($C_2, C_3, \dots$) and repeat Steps 3–4 until all vertices are colored.

> **Important Theoretical Note:** Graph Coloring guarantees that no two adjacent vertices share the same color (independent sets). However, complete timetable generation additionally requires time-slot mapping, duration handling (2-hour laboratory blocks), teacher availability windows, room capacity checks, and lunch break preservation.

---

## 5. TEACHER ABSENCE & REPLACEMENT PIPELINE (SECTION 13)

When a faculty member applies for leave:
1. **Affected Lecture Discovery:** Queries published timetable entries matching the teacher and absence date.
2. **Qualification Scoring:** Evaluates active colleagues specializing in the subject:
   $$\text{Score} = \text{Base}(50) + \text{SpecializationMatch}(35) + \text{WorkloadCushion}(20 - \text{WeeklyHours})$$
3. **Availability Verification:** Checks candidate teacher schedule and room availability in that exact time slot.
4. **Alternative Slot Recovery:** If no qualified substitute is available in the same slot, scans the week for alternative free slots where room, teacher, and students are all free.
5. **Unresolved Handling:** If neither is viable, marks lecture as **Unresolved** and issues urgent administrative alerts.
6. **Administrative Approval:** Head of Department approves recommendation; updates immediately propagate to Student and Teacher dashboards.

---

## 6. ROLE-BASED ACCESS CONTROL (RBAC)

| Feature | Admin (HOD) | Teacher | Student |
| :--- | :---: | :---: | :---: |
| **Manage Subjects (10 fields)** | Full CRUD | No | No |
| **Manage Teachers & Status** | Full CRUD | No | No |
| **Manage Classrooms & Labs** | Full CRUD | No | No |
| **Run Welsh-Powell Generator** | Yes | No | No |
| **Save Drafts & Publish** | Yes | No | No |
| **Approve Absences & Substitutes** | Yes | No | No |
| **View Timetable** | College-Wide | Own Schedule | Own Class (Read-Only) |
| **Download PDF / Export CSV** | College-Wide | Own Schedule | Own Class |
| **Interactive Graph Visualizations** | Full College Graph | Personal Graph | Class Graph |
| **Workload Reports** | All Faculty | Own Workload Only | No |
| **Version History & Restore** | Yes | No | No |

---

## 7. SYSTEM ARCHITECTURE & REPOSITORY STRUCTURE

```
Time_Table/
├── package.json               # Full-stack dependencies & concurrent scripts
├── vite.config.ts             # Vite configuration with /api reverse proxy
├── index.html                 # HTML entry with Outfit & Inter typography
├── timetable.sqlite           # Persistent SQLite database file
├── server/
│   ├── index.js               # Express REST API, CORS, RBAC, endpoints
│   ├── db.js                  # node:sqlite schema definition & initial seed data
│   ├── auth.js                # JWT sign, verify, requireRole middleware
│   └── algorithms/
│       ├── welshPowell.js     # Adjacency matrix, Welsh-Powell graph coloring, constraints
│       └── replacement.js     # Multi-stage teacher absence & replacement engine
├── public/
│   └── images/                # Local carousel image assets (no external breakage)
│       ├── carousel-1.jpg     # Image 1: Better Time Management
│       ├── carousel-2.jpg     # Image 2: Organized Academic Life
│       ├── carousel-3.jpg     # Image 3: Increased Productivity
│       └── carousel-4.jpg     # Image 4: Conflict-Free Scheduling
└── src/
    ├── main.tsx               # React 19 root
    ├── App.tsx                # Role-based React Router configuration
    ├── index.css              # Dark green & white styling design system
    ├── api/client.ts          # Central fetch API client with token injection
    ├── context/AuthContext.tsx# Authentication state & examiner demo switcher
    ├── components/
    │   ├── Sidebar.tsx        # Role-based sidebar matching Section 7 exactly
    │   ├── Topbar.tsx         # Top navigation bar with notifications & role badge
    │   ├── Carousel.tsx       # Exact 4-card, 3000ms auto-advancing carousel
    │   ├── TimetableGrid.tsx  # Weekly calendar schedule with print styling
    │   └── ConflictGraph.tsx  # Interactive SVG conflict graph & matrix viewer
    └── pages/
        ├── Login.tsx          # Login page with demo examiner shortcuts
        ├── DocumentationPage.tsx # In-app academic project report
        ├── NotificationsPage.tsx # Notices & Bulletins center
        ├── admin/             # 11 dedicated Admin pages
        ├── teacher/           # 7 dedicated Teacher pages
        └── student/           # 5 dedicated Student pages
```

---

## 8. DEMO CREDENTIALS FOR PROJECT EVALUATION

The database is pre-seeded with realistic Computer Engineering academic data:

| Role | Name | Email | Password | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Head of Department | `admin@college.edu` | `Admin@123` | College-Wide Management |
| **Teacher** | Dr. Rajesh Sharma | `sharma@college.edu` | `Teacher@123` | Personal Teaching Schedule |
| **Teacher** | Dr. Ananya Mehta | `mehta@college.edu` | `Teacher@123` | Personal Teaching Schedule |
| **Student** | Rahul Verma | `student1@college.edu` | `Student@123` | Sem 4, Section A (Read-Only) |
| **Student** | Pooja Patel | `student2@college.edu` | `Student@123` | Sem 4, Section B (Read-Only) |

*(Quick 1-click evaluation buttons are also available directly on the Login page and the Topbar for seamless examiner testing!)*

---

## 9. SETUP & EXECUTION INSTRUCTIONS

### Prerequisites
- Node.js v18+ (tested on Node v24.12.0)
- npm v10+

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Full-Stack Application
```bash
npm run dev
```
This runs both the Express backend (`http://localhost:5000`) and the Vite React frontend (`http://localhost:5173`) concurrently.

### Step 3: Open in Browser
Open `http://localhost:5173` in your browser.

---

## 10. VERIFICATION CHECKLIST (SECTION 24)

- [x] **Login & Logout:** Admin, Teacher, and Student authentication tested.
- [x] **Admin Dashboard:** EXACTLY FOUR overview cards and FOUR quick action buttons.
- [x] **Carousel:** Exactly 4 image cards, auto-advances every 3000ms, pause on hover, resume on leave, navigation arrows & dots.
- [x] **About Section:** Explains Graph Theory, Adjacency Matrix, and Welsh-Powell algorithm.
- [x] **Subject Management:** Form contains EXACTLY the 10 required fields (no scheduling days field). Safe archive preserves historical integrity.
- [x] **Teacher Management:** Faculty credentials, workload summary, activate/deactivate.
- [x] **Classroom Management & Availability Grid:** Available/Occupied/Unavailable legend with time-slot filters.
- [x] **Timetable Generator:** Welsh-Powell algorithm, adjacency matrix, degrees, candidate schedule, conflict detection.
- [x] **Interactive Conflict Graph:** SVG nodes, conflict edges (Teacher, Room, Batch), click-to-inspect drawer, adjacency matrix modal.
- [x] **Teacher Absence & Replacement:** Qualification matching, substitute ranking, alternative slot recovery, admin approval.
- [x] **Workload & Utilization Reports:** Teacher teaching hours, room utilization %, CSV export, PDF print.
- [x] **Timetable Version History:** Version snapshots, change summary, 1-click restore.
- [x] **Responsive Layout:** Works smoothly on desktop, laptop, tablet, and mobile.
