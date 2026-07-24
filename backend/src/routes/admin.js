import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

function publicUser(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

router.get('/overview', async (req, res) => {
  await db.read();
  res.json({
    counts: {
      users: db.data.users.length,
      employers: db.data.users.filter(u => u.role === 'employer').length,
      seekers: db.data.users.filter(u => u.role === 'seeker').length,
      jobs: db.data.jobs.length,
      openJobs: db.data.jobs.filter(j => j.status === 'open').length,
      applications: db.data.applications.length
    }
  });
});

router.get('/users', async (req, res) => {
  await db.read();
  res.json({ users: db.data.users.map(publicUser) });
});

router.get('/jobs', async (req, res) => {
  await db.read();
  const jobs = db.data.jobs.map(j => ({
    ...j,
    applicantCount: db.data.applications.filter(a => a.jobId === j.id).length
  }));
  res.json({ jobs });
});

router.get('/applications', async (req, res) => {
  await db.read();
  const apps = db.data.applications.map(a => {
    const job = db.data.jobs.find(j => j.id === a.jobId);
    const seeker = db.data.users.find(u => u.id === a.seekerId);
    return {
      ...a,
      job: job ? { id: job.id, title: job.title } : null,
      seeker: seeker ? { id: seeker.id, name: seeker.name, email: seeker.email } : null
    };
  });
  res.json({ applications: apps });
});

export default router;
