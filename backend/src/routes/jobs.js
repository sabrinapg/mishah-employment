import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();

function withApplicantCount(job) {
  const count = db.data.applications.filter(a => a.jobId === job.id).length;
  return { ...job, applicantCount: count };
}

// Public: browse open jobs, with optional filters
router.get('/', async (req, res) => {
  await db.read();
  const { category, location, q } = req.query;
  let jobs = db.data.jobs.filter(j => j.status === 'open');

  if (category) jobs = jobs.filter(j => j.category.toLowerCase() === String(category).toLowerCase());
  if (location) jobs = jobs.filter(j => j.location.toLowerCase().includes(String(location).toLowerCase()));
  if (q) {
    const needle = String(q).toLowerCase();
    jobs = jobs.filter(j => j.title.toLowerCase().includes(needle) || j.description.toLowerCase().includes(needle));
  }

  jobs = jobs.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ jobs: jobs.map(({ employerId, ...rest }) => rest) });
});

// Employer: jobs they posted (with applicant counts) — must come before /:id
router.get('/mine', requireAuth, requireRole('employer'), async (req, res) => {
  await db.read();
  const jobs = db.data.jobs.filter(j => j.employerId === req.user.sub);
  res.json({ jobs: jobs.map(withApplicantCount) });
});

// Public: single job
router.get('/:id', async (req, res) => {
  await db.read();
  const job = db.data.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const { employerId, ...rest } = job;
  res.json({ job: rest });
});

// Employer: create a job listing
router.post('/', requireAuth, requireRole('employer'), async (req, res) => {
  const { title, category, location, type, description, requirements, salaryRange } = req.body || {};
  if (!title || !category || !location || !description) {
    return res.status(400).json({ error: 'title, category, location and description are required' });
  }

  await db.read();
  const job = {
    id: nanoid(),
    employerId: req.user.sub,
    title,
    category,
    location,
    type: type || 'Full-time',
    description,
    requirements: requirements || '',
    salaryRange: salaryRange || '',
    status: 'open', // open | closed
    createdAt: new Date().toISOString()
  };
  db.data.jobs.push(job);
  await db.write();
  res.status(201).json({ job });
});

// Employer (owner) or admin: update a job (edit fields or open/close it)
router.patch('/:id', requireAuth, requireRole('employer', 'admin'), async (req, res) => {
  await db.read();
  const job = db.data.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (req.user.role !== 'admin' && job.employerId !== req.user.sub) {
    return res.status(403).json({ error: 'You can only edit your own job listings' });
  }

  const editable = ['title', 'category', 'location', 'type', 'description', 'requirements', 'salaryRange', 'status'];
  for (const field of editable) {
    if (req.body[field] !== undefined) job[field] = req.body[field];
  }
  await db.write();
  res.json({ job });
});

// Employer (owner) or admin: delete a job
router.delete('/:id', requireAuth, requireRole('employer', 'admin'), async (req, res) => {
  await db.read();
  const job = db.data.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (req.user.role !== 'admin' && job.employerId !== req.user.sub) {
    return res.status(403).json({ error: 'You can only delete your own job listings' });
  }
  db.data.jobs = db.data.jobs.filter(j => j.id !== req.params.id);
  db.data.applications = db.data.applications.filter(a => a.jobId !== req.params.id);
  await db.write();
  res.json({ ok: true });
});

// Employer (owner) or admin: view applicants for a job
router.get('/:id/applications', requireAuth, requireRole('employer', 'admin'), async (req, res) => {
  await db.read();
  const job = db.data.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (req.user.role !== 'admin' && job.employerId !== req.user.sub) {
    return res.status(403).json({ error: 'You can only view applicants for your own job listings' });
  }

  const apps = db.data.applications
    .filter(a => a.jobId === req.params.id)
    .map(a => {
      const seeker = db.data.users.find(u => u.id === a.seekerId);
      return {
        ...a,
        seeker: seeker ? { id: seeker.id, name: seeker.name, email: seeker.email, phone: seeker.phone } : null
      };
    });
  res.json({ applications: apps });
});

// Job seeker: apply to a job
router.post('/:id/apply', requireAuth, requireRole('seeker'), async (req, res) => {
  await db.read();
  const job = db.data.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'open') return res.status(400).json({ error: 'This job is no longer accepting applications' });

  const already = db.data.applications.find(a => a.jobId === job.id && a.seekerId === req.user.sub);
  if (already) return res.status(409).json({ error: 'You have already applied to this job' });

  const application = {
    id: nanoid(),
    jobId: job.id,
    seekerId: req.user.sub,
    coverNote: (req.body && req.body.coverNote) || '',
    status: 'submitted', // submitted | reviewing | shortlisted | rejected | hired
    createdAt: new Date().toISOString()
  };
  db.data.applications.push(application);
  await db.write();
  res.status(201).json({ application });
});

export default router;
