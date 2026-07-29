const express = require('express');
const cors = require('cors');
const { z } = require('zod');
const { createStore, filterDirectives, addDirective, deleteDirective } = require('./mockStore');

const app = express();
app.use(cors());
app.use(express.json());

const updateActionSchema = z.object({
  status: z.string().min(1),
  owner: z.string().optional(),
});

const createDirectiveSchema = z.object({
  title: z.string().min(1),
  code: z.string().min(1),
  summary: z.string().min(1),
  status: z.string().optional(),
  severity: z.string().optional(),
  effectiveDate: z.string().nullable().optional(),
  rawText: z.string().nullable().optional(),
  authority: z.object({
    name: z.string().min(1),
    jurisdiction: z.string().min(1),
  }).optional(),
  actionItems: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.string().optional(),
    owner: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    priority: z.string().optional(),
    flagged: z.boolean().optional(),
    flagReason: z.string().nullable().optional(),
  })).optional(),
});

let store = createStore();

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/triage', (req, res) => {
  const { status, severity, search } = req.query;
  const filtered = filterDirectives(store, { status, severity, search });
  res.json(filtered);
});

app.post('/api/triage', (req, res) => {
  const parsed = createDirectiveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid directive payload', details: parsed.error.flatten() });
  }

  const directive = parsed.data;
  store = addDirective(store, {
    ...directive,
    status: directive.status || 'Pending',
    severity: directive.severity || 'Medium',
    effectiveDate: directive.effectiveDate ?? null,
    rawText: directive.rawText ?? null,
    authority: directive.authority || { name: 'Unknown Authority', jurisdiction: 'Unknown' },
    actionItems: (directive.actionItems || []).map((item) => ({
      ...item,
      status: item.status || 'Pending',
      owner: item.owner ?? null,
      dueDate: item.dueDate ?? null,
      priority: item.priority || 'Medium',
      flagged: Boolean(item.flagged),
      flagReason: item.flagReason ?? null,
    })),
  });

  res.status(201).json(store[store.length - 1]);
});

app.delete('/api/triage/:id', (req, res) => {
  const nextStore = deleteDirective(store, req.params.id);
  if (nextStore.length === store.length) {
    return res.status(404).json({ error: 'Directive not found' });
  }

  store = nextStore;
  res.status(204).send();
});

app.patch('/api/action-items/:id', (req, res) => {
  const parsed = updateActionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid update payload', details: parsed.error.flatten() });
  }

  let updated = null;
  store = store.map((directive) => {
    const nextActionItems = directive.actionItems.map((item) => {
      if (item.id !== req.params.id) return item;
      const nextStatus = parsed.data.status;
      const nextFlagged = nextStatus === 'Resolved' ? false : Boolean(item.flagReason || item.flagged);
      updated = { ...item, status: nextStatus, owner: parsed.data.owner ?? item.owner, flagged: nextFlagged };
      return updated;
    });
    return { ...directive, actionItems: nextActionItems };
  });

  if (!updated) {
    return res.status(404).json({ error: 'Action item not found' });
  }

  res.json(updated);
});

if (require.main === module) {
  app.listen(process.env.PORT || 4000, () => {
    console.log('Compliance API listening on port 4000');
  });
}

module.exports = app;
