import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '..', 'data', 'db.json');

const defaultData = { users: [], jobs: [], applications: [], leads: [] };

export const db = new Low(new JSONFile(file), defaultData);

export async function initDb() {
  await db.read();
  db.data ||= defaultData;

  // Seed a single admin account on first run so there's always a way in.
  const hasAdmin = db.data.users.some(u => u.role === 'admin');
  if (!hasAdmin) {
    db.data.users.push({
      id: nanoid(),
      name: 'Mishah Admin',
      email: 'admin@mishahemployment.bn',
      passwordHash: bcrypt.hashSync('ChangeMe123!', 10),
      role: 'admin',
      phone: null,
      createdAt: new Date().toISOString()
    });
    await db.write();
    console.log('Seeded default admin -> admin@mishahemployment.bn / ChangeMe123!  (change this immediately)');
  }
}
