const sanitizeStatus = (value) => ['Pending', 'In Progress', 'Resolved', 'Flagged', 'Conflicted'].includes(value) ? value : 'Pending';
const sanitizeSeverity = (value) => ['High', 'Medium', 'Low'].includes(value) ? value : 'Medium';

function sanitizeDirective(directive) {
  return {
    ...directive,
    status: sanitizeStatus(directive.status),
    severity: sanitizeSeverity(directive.severity),
    effectiveDate: directive.effectiveDate || null,
    rawText: typeof directive.rawText === 'string' && directive.rawText.trim() ? directive.rawText : 'No warning captured',
    actionItems: directive.actionItems.map((item) => ({
      ...item,
      status: sanitizeStatus(item.status),
      flagged: Boolean(item.flagged || item.flagReason),
      flagReason: item.flagReason || null,
    })),
  };
}

function buildSeedData() {
  return sanitizeDirective({
    id: 'dir-eu-001',
    title: 'EMIR Reconciliation Update',
    code: 'EU-EMIR-17',
    summary: 'Mandatory reconciliation schedule revised after audit findings.',
    status: 'Pending',
    severity: 'High',
    effectiveDate: '2026-07-01T00:00:00.000Z',
    rawText: 'Revised guidance published with ambiguous annex reference',
    authority: { name: 'EU Market Surveillance Office', jurisdiction: 'EU' },
    actionItems: [
      {
        id: 'item-eu-001',
        title: 'Validate publication timestamp',
        description: 'The directive text contains a suspicious status code and needs manual review.',
        status: 'Pending',
        owner: null,
        dueDate: null,
        priority: 'High',
        flagged: true,
        flagReason: 'Malformed status field and missing due date',
      },
      {
        id: 'item-eu-002',
        title: 'Archive legacy policy references',
        description: 'Cross-reference the latest directive against archived policies and remove stale links.',
        status: 'Resolved',
        owner: 'M. Alvarez',
        dueDate: '2026-08-02T00:00:00.000Z',
        priority: 'Low',
        flagged: false,
        flagReason: null,
      },
    ],
  });
}

function createStore() {
  return [
    sanitizeDirective({
      id: 'dir-eu-001',
      title: 'EMIR Reconciliation Update',
      code: 'EU-EMIR-17',
      summary: 'Mandatory reconciliation schedule revised after audit findings.',
      status: 'Pending',
      severity: 'High',
      effectiveDate: '2026-07-01T00:00:00.000Z',
      rawText: 'Revised guidance published with ambiguous annex reference',
      authority: { name: 'EU Market Surveillance Office', jurisdiction: 'EU' },
      actionItems: [
        {
          id: 'item-eu-001',
          title: 'Validate publication timestamp',
          description: 'The directive text contains a suspicious status code and needs manual review.',
          status: 'Pending',
          owner: null,
          dueDate: null,
          priority: 'High',
          flagged: true,
          flagReason: 'Malformed status field and missing due date',
        },
        {
          id: 'item-eu-002',
          title: 'Archive legacy policy references',
          description: 'Cross-reference the latest directive against archived policies and remove stale links.',
          status: 'Resolved',
          owner: 'M. Alvarez',
          dueDate: '2026-08-02T00:00:00.000Z',
          priority: 'Low',
          flagged: false,
          flagReason: null,
        },
      ],
    }),
    sanitizeDirective({
      id: 'dir-us-002',
      title: 'Cross-Border Disclosure Rule',
      code: 'SEC-CLS-41',
      summary: 'Disclosure threshold was amended without a published appendix.',
      status: 'Conflicted',
      severity: 'Medium',
      effectiveDate: null,
      rawText: 'Conflicting status code; missing date; malformed text',
      authority: { name: 'US Securities and Exchange Commission', jurisdiction: 'US' },
      actionItems: [
        {
          id: 'item-us-001',
          title: 'Confirm implementation owner',
          description: 'Assign an accountable owner for the rollout plan.',
          status: 'Pending',
          owner: 'R. Patel',
          dueDate: '2026-07-30T00:00:00.000Z',
          priority: 'Medium',
          flagged: false,
          flagReason: null,
        },
      ],
    }),
    sanitizeDirective({
      id: 'dir-apac-003',
      title: 'AML Transaction Monitoring Review',
      code: 'APAC-AML-09',
      summary: 'Monitoring thresholds have diverged from previous guidance.',
      status: 'Flagged',
      severity: 'Low',
      effectiveDate: null,
      rawText: 'missing effective date and inconsistent status',
      authority: { name: 'APAC Financial Integrity Board', jurisdiction: 'APAC' },
      actionItems: [
        {
          id: 'item-apac-001',
          title: 'Reconcile evidence log',
          description: 'Gather the deadline evidence and attach the latest memo.',
          status: 'Pending',
          owner: 'L. Chen',
          dueDate: null,
          priority: 'High',
          flagged: true,
          flagReason: 'Missing due date and conflicting status',
        },
      ],
    }),
  ];
}

function filterDirectives(store, { status, severity, search }) {
  return store.filter((directive) => {
    const matchesStatus = !status || status === 'all' ? true : directive.status === status;
    const matchesSeverity = !severity || severity === 'all' ? true : directive.severity === severity;
    const haystack = `${directive.title} ${directive.code} ${directive.summary} ${directive.rawText}`.toLowerCase();
    const matchesSearch = !search ? true : haystack.includes(search.toLowerCase());
    return matchesStatus && matchesSeverity && matchesSearch;
  });
}

function addDirective(store, directive) {
  const sanitized = sanitizeDirective({
    ...directive,
    id: directive.id || `dir-${Date.now()}`,
    actionItems: (directive.actionItems || []).map((item) => ({
      ...item,
      id: item.id || `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    })),
  });
  return [...store, sanitized];
}

function deleteDirective(store, id) {
  return store.filter((directive) => directive.id !== id);
}

function updateActionItem(store, id, payload) {
  return store.flatMap((directive) => directive.actionItems.map((item) => ({ directive, item })));
}

module.exports = { buildSeedData, createStore, filterDirectives, sanitizeDirective, addDirective, deleteDirective, updateActionItem };
