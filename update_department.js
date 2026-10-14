import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'timetable.sqlite');

const db = new DatabaseSync(dbPath);

console.log('Migrating database from Computer Engineering to AIDS...');

db.exec(`
  UPDATE users SET department = 'AIDS' WHERE department = 'Computer Engineering';
  UPDATE teachers SET department = 'AIDS' WHERE department = 'Computer Engineering';
  UPDATE classrooms SET department = 'AIDS' WHERE department = 'Computer Engineering';
  UPDATE subjects SET department = 'AIDS' WHERE department = 'Computer Engineering';
  UPDATE timetables SET department = 'AIDS' WHERE department = 'Computer Engineering';
  UPDATE timetables SET title = REPLACE(title, 'Computer Engineering', 'AIDS');
  UPDATE timetable_versions SET title = REPLACE(title, 'Computer Engineering', 'AIDS');
  UPDATE timetable_versions SET scope = REPLACE(scope, 'Computer Engineering', 'AIDS');
  UPDATE timetable_versions SET data_json = REPLACE(data_json, 'Computer Engineering', 'AIDS');
`);

console.log('Database updated successfully!');

const userCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE department = 'AIDS'").get().c;
const subCount = db.prepare("SELECT COUNT(*) as c FROM subjects WHERE department = 'AIDS'").get().c;
const ttCount = db.prepare("SELECT COUNT(*) as c FROM timetables WHERE department = 'AIDS'").get().c;

console.log(`Verified in DB: Users=${userCount}, Subjects=${subCount}, Timetables=${ttCount}`);
