const express = require('express');
const cors = require('cors');
const { createStore, filterDirectives, addDirective, deleteDirective } = require('./mockStore');

const app = express();
app.use(cors());
app.use(express.json());

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
  const directive = {
    ...req.body,
    id: req.body.id || `dir-${Date.now()}`,
    status: req.body.status || 'Pending',
    severity: req.body.severity || 'Medium',
    effectiveDate: req.body.effectiveDate ?? null,
    rawText: req.body.rawText ?? null,
    authority: req.body.authority || { name: 'Unknown Authority', jurisdiction: 'Unknown' },
    actionItems: (req.body.actionItems || []).map((item) => ({
      ...item,
      id: item.id || `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      status: item.status || 'Pending',
      owner: item.owner ?? null,
      dueDate: item.dueDate ?? null,
      priority: item.priority || 'Medium',
      flagged: Boolean(item.flagged),
      flagReason: item.flagReason ?? null,
    })),
  };

  store = addDirective(store, directive);
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
  const nextStatus = req.body.status;
  let updated = null;

  store = store.map((directive) => {
    const nextActionItems = directive.actionItems.map((item) => {
      if (item.id !== req.params.id) return item;
      updated = { ...item, status: nextStatus, owner: req.body.owner ?? item.owner, flagged: nextStatus === 'Resolved' ? false : Boolean(item.flagReason || item.flagged) };
      return updated;
    });
    return { ...directive, actionItems: nextActionItems };
  });

  if (!updated) {
    return res.status(404).json({ error: 'Action item not found' });
  }

  res.json(updated);
});

const port = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Compliance API listening on port ${port}`);
  });
}

module.exports = app;
