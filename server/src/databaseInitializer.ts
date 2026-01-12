import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { hashPassword } from './Utils/hash';
import { ObjectHandler } from './ObjectHandler';
import { DatabaseSerializableFactory } from './Serializer/DatabaseSerializableFactory';
import { User } from './Models/User';
import { DatabaseWriter } from './Serializer/DatabaseWriter';
import { Email } from './ValueTypes/Email';
import { DEFAULT_USER } from './Config/database';

export async function initializeDB(filename: string, createAdmin = true) {
  const db = await open({
    filename: filename,
    driver: sqlite3.Database,
  });

  const oh = new ObjectHandler();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      githubUsername TEXT,
      email TEXT UNIQUE,
      status TEXT DEFAULT "unconfirmed" NOT NULL,
      password TEXT,
      resetPasswordToken TEXT,
      resetPasswordExpire INTEGER,
      confirmEmailToken TEXT,
      confirmEmailExpire INTEGER,
      userRole TEXT DEFAULT "USER" NOT NULL
    )
  `);

  const userCount = await oh.getUserCount(db);
  if ((!userCount || userCount === 0) && createAdmin) {
    const { name, email, password } = DEFAULT_USER;
    const dbsf = new DatabaseSerializableFactory(db);
    const writer = new DatabaseWriter(db);
    const admin = await dbsf.create("User") as User;
    admin.setName(name);
    admin.setEmail(new Email(email));
    admin.setPassword(await hashPassword(password));
    admin.setStatus('confirmed');
    admin.setRole("ADMIN");
    await writer.writeRoot(admin);
    console.log(`Default admin user created: (email: '${email}', password: '${password}')`);
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      termName TEXT UNIQUE,
      displayName TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseName TEXT UNIQUE,
      termId INTEGER NOT NULL,
      FOREIGN KEY (termId) REFERENCES terms(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectName TEXT UNIQUE,
      courseId INTEGER,
      FOREIGN KEY (courseId) REFERENCES courses(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_projects (
      userId INTEGER,
      projectId INTEGER,
      role TEXT,
      url TEXT,
      PRIMARY KEY (userId, projectId),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (projectId) REFERENCES projects(id)
    )
    `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS happiness (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER,
      userId INTEGER,
      happiness INTEGER,
      submissionDateId INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (submissionDateId) REFERENCES submissions(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY,
      startDate Integer,
      endDate Integer
    )`);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY,
      scheduleId INTEGER,
      submissionDate INTEGER,
      FOREIGN KEY (scheduleId) REFERENCES schedules(id) ON DELETE CASCADE,
      UNIQUE (scheduleId, submissionDate)
    )`);

  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS submissions_insert_trigger
    BEFORE INSERT ON submissions
    FOR EACH ROW
    BEGIN
      SELECT RAISE(ABORT, 'submissionDate must be between startDate and endDate')
      WHERE NEW.submissionDate < (SELECT startDate FROM schedules WHERE id = NEW.scheduleId)
        OR NEW.submissionDate > (SELECT endDate FROM schedules WHERE id = NEW.scheduleId);
    END;
    `);

  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS submissions_update_trigger
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    BEGIN
      SELECT RAISE(ABORT, 'submissionDate must be between startDate and endDate')
      WHERE NEW.submissionDate < (SELECT startDate FROM schedules WHERE id = NEW.scheduleId)
        OR NEW.submissionDate > (SELECT endDate FROM schedules WHERE id = NEW.scheduleId);
    END;
    `);
  
  return db;
}