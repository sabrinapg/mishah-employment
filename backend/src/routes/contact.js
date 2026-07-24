import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();

// Public: submit the general contact form
router.post('/', async (req, res) => {
  const { name, phone, email, position, message, role } = req.body || {};
  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: 'name, email, phone and message are required' });
  }

  await db.read();
  const lead = {
    id: nanoid(),
    name, phone, email,
    role: role || 'employer',
    position: position || '',
    message,
    status: 'new', // new | contacted | closed
    createdAt: new Date().toISOString()
  };
  db.data.leads.push(lead);
  await db.write();
  res.status(201).json({ ok: true });
});

// Admin: view submitted enquiries
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  await db.read();
  const leads = db.data.leads.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ leads });
});

export default router;
