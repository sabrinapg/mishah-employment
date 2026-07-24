import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();

const VALID_STATUSES = ['submitted', 'reviewing', 'shortlisted', 'rejected', 'hired'];

// Seeker: view my own applications, with job info attached
router.get('/mine', requireAuth, requireRole('seeker'), async (req, res) => {
  await db.read();
  const apps = db.data.applications
    .filter(a => a.seekerId === req.user.sub)
    .map(a => {
      const job = db.data.jobs.find(j => j.id === a.jobId);
      return { ...a, job: job ? { id: job.id, title: job.title, location: job.location, status: job.status } : null };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ applications: apps });
});

// Employer (owner of the job) or admin: update an application's status
router.patch('/:id', requireAuth, requireRole('employer', 'admin'), async (req, res) => {
  await db.read();
  const application = db.data.applications.find(a => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });

  const job = db.data.jobs.find(j => j.id === application.jobId);
  if (!job) return res.status(404).json({ error: 'Related job not found' });
  if (req.user.role !== 'admin' && job.employerId !== req.user.sub) {
    return res.status(403).json({ error: 'You can only manage applications for your own job listings' });
  }

  const { status } = req.body || {};
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  application.status = status;
  await db.write();
  res.json({ application });
});

export default router;
