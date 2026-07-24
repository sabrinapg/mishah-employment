import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { signToken, requireAuth } from '../auth.js';

const router = Router();

function publicUser(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

router.post('/register', async (req, res) => {
  const { name, email, password, role, phone } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are required' });
  }
  if (!['employer', 'seeker'].includes(role)) {
    return res.status(400).json({ error: 'role must be "employer" or "seeker"' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  await db.read();
  const exists = db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'An account with that email already exists' });

  const user = {
    id: nanoid(),
    name,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    phone: phone || null,
    createdAt: new Date().toISOString()
  };
  db.data.users.push(user);
  await db.write();

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  await db.read();
  const user = db.data.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

export default router;
