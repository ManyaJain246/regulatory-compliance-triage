import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://127.0.0.1:4000';

type ActionItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  owner: string | null;
  dueDate: string | null;
  priority: string;
  flagged: boolean;
  flagReason: string | null;
};

type DirectiveRecord = {
  id: string;
  title: string;
  code: string;
  summary: string;
  status: string;
  severity: string;
  effectiveDate: string | null;
  rawText: string | null;
  authority: { name: string; jurisdiction: string };
  actionItems: ActionItem[];
};

function App() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [records, setRecords] = useState<DirectiveRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [draftStatus, setDraftStatus] = useState('Pending');
  const [draftSeverity, setDraftSeverity] = useState('Medium');
  const [draftOwner, setDraftOwner] = useState('');
  const [draftAuthority, setDraftAuthority] = useState('');
  const [draftCode, setDraftCode] = useState('');
  const [draftEffectiveDate, setDraftEffectiveDate] = useState('');
  const [draftRawText, setDraftRawText] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get<DirectiveRecord[]>(`${API_BASE_URL}/api/triage`);
        setRecords(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.toLowerCase();
    return records.filter((directive) => {
      const matchesStatus = statusFilter === 'all' || directive.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || directive.severity === severityFilter;
      const haystack = `${directive.title} ${directive.code} ${directive.summary} ${directive.rawText}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesStatus && matchesSeverity && matchesSearch;
    });
  }, [records, search, statusFilter, severityFilter]);

  const selectedRecord = filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? null;
  const activeFlagCount = useMemo(() => {
    return records.reduce((count, directive) => {
      return count + (!directive.effectiveDate ? 1 : 0);
    }, 0);
  }, [records]);

  useEffect(() => {
    if (!selectedId && filteredRecords[0]) {
      setSelectedId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedId]);

  useEffect(() => {
    if (selectedRecord) {
      setDraftTitle(selectedRecord.title);
      setDraftSummary(selectedRecord.summary);
      setDraftStatus(selectedRecord.status);
      setDraftSeverity(selectedRecord.severity);
      setDraftOwner(selectedRecord.actionItems[0]?.owner ?? '');
      setDraftAuthority(selectedRecord.authority.name);
      setDraftCode(selectedRecord.code);
      setDraftEffectiveDate(selectedRecord.effectiveDate ?? '');
      setDraftRawText(selectedRecord.rawText ?? '');
    }
  }, [selectedRecord]);

  const toggleStatus = async (itemId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pending' ? 'In Progress' : currentStatus === 'In Progress' ? 'Resolved' : 'Pending';
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/action-items/${itemId}`, { status: nextStatus });
      const updatedItem = response.data;
      setRecords((prev) => prev.map((directive) => ({
        ...directive,
        actionItems: directive.actionItems.map((item) => item.id === itemId ? { ...item, ...updatedItem } : item),
      })));
    } catch (error) {
      console.error(error);
    }
  };

  const saveDirectiveChanges = () => {
    if (!selectedRecord) return;

    setRecords((prev) => prev.map((directive) => {
      if (directive.id !== selectedRecord.id) return directive;
      return {
        ...directive,
        title: draftTitle.trim() || directive.title,
        summary: draftSummary.trim() || directive.summary,
        status: draftStatus,
        severity: draftSeverity,
        code: draftCode.trim() || directive.code,
        effectiveDate: draftEffectiveDate.trim() ? draftEffectiveDate.trim() : null,
        rawText: draftRawText.trim() ? draftRawText.trim() : null,
        authority: { ...directive.authority, name: draftAuthority.trim() || directive.authority.name },
        actionItems: directive.actionItems.map((item, index) => index === 0 ? { ...item, owner: draftOwner.trim() || item.owner } : item),
      };
    }));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#07111f', color: '#f4f7fb', fontFamily: 'Inter, Arial, sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: '#6f82a5' }}>Regulatory Decision Layer</div>
            <h1 style={{ margin: '0.2rem 0', fontSize: '1.7rem' }}>Compliance triage console</h1>
          </div>
          <div style={{ color: '#8da0bc' }}>Flags: {activeFlagCount}</div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: '#101b2f', border: '1px solid #20304d', borderRadius: '14px', padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search directives or codes" style={{ flex: 1, background: '#0b1424', border: '1px solid #24364e', color: '#fff', padding: '0.7rem 0.8rem', borderRadius: '8px' }} />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ background: '#0b1424', border: '1px solid #24364e', color: '#fff', padding: '0.7rem 0.8rem', borderRadius: '8px' }}>
                <option value="all">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Flagged">Flagged</option>
                <option value="Conflicted">Conflicted</option>
              </select>
              <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} style={{ background: '#0b1424', border: '1px solid #24364e', color: '#fff', padding: '0.7rem 0.8rem', borderRadius: '8px' }}>
                <option value="all">All severities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {loading ? <div>Loading triage queue…</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredRecords.map((directive) => (
                  <div key={directive.id} style={{ border: '1px solid #20304d', borderRadius: '10px', padding: '0.85rem', background: selectedRecord?.id === directive.id ? '#16253d' : '#0b1424' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{directive.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#8da0bc' }}>{directive.code} • {directive.authority.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#f6c76a' }}>{directive.status} / {directive.severity}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button type="button" aria-label={`Inspect ${directive.title}`} onClick={() => setSelectedId(directive.id)} style={{ border: 'none', borderRadius: '6px', padding: '0.45rem 0.7rem', background: '#5b7cff', color: 'white', cursor: 'pointer' }}>Inspect</button>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {directive.actionItems.map((item) => (
                        <div key={item.id} style={{ padding: '0.6rem', borderRadius: '8px', background: '#101b2f' }}>
                          <div style={{ fontWeight: 600 }}>{item.title}</div>
                          <div style={{ fontSize: '0.85rem', color: '#b6c0d2' }}>{item.description}</div>
                          {item.flagged && <div style={{ marginTop: '0.35rem', color: '#ff8a80', fontSize: '0.8rem' }}>⚠ {item.flagReason}</div>}
                          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>{item.owner ?? 'Unassigned'}</div>
                            <button type="button" onClick={() => toggleStatus(item.id, item.status)} style={{ border: 'none', borderRadius: '6px', padding: '0.4rem 0.65rem', background: item.status === 'Resolved' ? '#2b5d3f' : item.status === 'In Progress' ? '#b07a00' : '#5b7cff', color: 'white', cursor: 'pointer' }}>{item.status}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#101b2f', border: '1px solid #20304d', borderRadius: '14px', padding: '1rem' }}>
            {selectedRecord ? (
              <>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6f82a5' }}>Selected directive</div>
                <div style={{ background: '#0b1424', borderRadius: '10px', padding: '0.8rem', marginTop: '0.8rem', color: '#d7e3f7', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>Title</span>
                    <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} style={{ background: '#101b2f', border: '1px solid #24364e', color: '#fff', padding: '0.5rem', borderRadius: '6px' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>Summary</span>
                    <textarea value={draftSummary} onChange={(event) => setDraftSummary(event.target.value)} style={{ background: '#101b2f', border: '1px solid #24364e', color: '#fff', padding: '0.5rem', borderRadius: '6px', minHeight: '80px' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>Status</span>
                    <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)} style={{ background: '#101b2f', border: '1px solid #24364e', color: '#fff', padding: '0.5rem', borderRadius: '6px' }}>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Flagged">Flagged</option>
                      <option value="Conflicted">Conflicted</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>Severity</span>
                    <select value={draftSeverity} onChange={(event) => setDraftSeverity(event.target.value)} style={{ background: '#101b2f', border: '1px solid #24364e', color: '#fff', padding: '0.5rem', borderRadius: '6px' }}>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>Owner</span>
                    <input value={draftOwner} onChange={(event) => setDraftOwner(event.target.value)} style={{ background: '#101b2f', border: '1px solid #24364e', color: '#fff', padding: '0.5rem', borderRadius: '6px' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>Authority</span>
                    <input value={draftAuthority} onChange={(event) => setDraftAuthority(event.target.value)} style={{ background: '#101b2f', border: '1px solid #24364e', color: '#fff', padding: '0.5rem', borderRadius: '6px' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>Code</span>
                    <input value={draftCode} onChange={(event) => setDraftCode(event.target.value)} style={{ background: '#101b2f', border: '1px solid #24364e', color: '#fff', padding: '0.5rem', borderRadius: '6px' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>Effective date</span>
                    <input value={draftEffectiveDate} onChange={(event) => setDraftEffectiveDate(event.target.value)} style={{ background: '#101b2f', border: '1px solid #24364e', color: '#fff', padding: '0.5rem', borderRadius: '6px' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span>Raw warning</span>
                    <textarea value={draftRawText} onChange={(event) => setDraftRawText(event.target.value)} style={{ background: '#101b2f', border: '1px solid #24364e', color: '#fff', padding: '0.5rem', borderRadius: '6px', minHeight: '80px' }} />
                  </label>
                  <button type="button" onClick={saveDirectiveChanges} style={{ border: 'none', borderRadius: '6px', padding: '0.5rem 0.7rem', background: '#2b5d3f', color: 'white', cursor: 'pointer' }}>Save changes</button>
                </div>
              </>
            ) : <div>No selection</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
