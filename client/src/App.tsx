import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import './index.css';

type Status = 'HEALTHY' | 'DEGRADED' | 'FAILED';
type FailureType = 'PROCESS_CRASH' | 'DEPENDENCY_TIMEOUT' | 'INVALID_RECORD' | 'REQUEST_OVERLOAD' | 'UNOBSERVABLE_FAULT';
type Service = { id: string; name: string; category: string; description: string; status: Status; workerRunning: boolean; dependencyAvailable: boolean; recordValid: boolean; queueDepth: number; monitorSignalAvailable: boolean; loadPct?: number; latencyMs?: number; metricLabel?: string; metricUnit?: string; riskScore?: number; riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'; riskReasons?: string[]; riskUpdatedAt?: string; updatedAt?: string };
type FailureOption = { type: FailureType; label: string; description: string; autoRecoverable: boolean };
type Incident = { incidentId: string; serviceId: string; serviceName: string; type: FailureType; status: string; diagnosis: string; recoveryAction: string; verification: string; injectedAt: string; detectedAt?: string | null; diagnosedAt?: string | null; actionTakenAt?: string | null; recoveredAt?: string | null; failedAt?: string | null; detectionMs?: number | null; recoveryMs?: number | null; totalMs?: number | null; healingEnabled: boolean; notes?: string };
type Metrics = { totalTests: number; detectedCount: number; recoveredCount: number; failedCount: number; detectionRate: number; recoveryRate: number; averageTotalRecoveryMs: number | null; averageRecoveryMs: number | null; healingEnabled: boolean };
type MonitorState = { running: boolean; lastCheckAt: string | null; totalChecks: number; healthyServices: number; degradedServices: number; failedServices: number; intervalMs: number };

type BackendService = {
  id: string;
  name: string;
  status: string;
  dependencyAvailable?: boolean;
};

type BackendIncident = {
  incidentId: string;
  serviceId: string;
  serviceName?: string;
  type: string;
  status: string;
  injectedAt?: string| null;
  detectedAt?: string | null;
  recoveredAt?: string| null;
  healingEnabled?: boolean;
  diagnosis?: string;
  recoveryAction?: string;
  verification?: string;
  detectionMs?: number | null;
  recoveryMs?: number | null;
    diagnosedAt?: string | null;
  actionTakenAt?: string | null;
  failedAt?: string | null;
  totalMs?: number | null;
};

function BackendHealingGraph({
  services,
  incidents,
}: {
  services: BackendService[];
  incidents:BackendIncident[];
}) {
  const latest = incidents[0];

  const links = [
    { source: 'powergrid', target: 'aquaflow' },
    { source: 'citylink', target: 'medicore' },
  ];

  const getService = (id: string) =>
    services.find((service) => service.id === id);

  const isUnhealthy = (id: string) => {
    const service = getService(id);
    return Boolean(
      service &&
        (service.status !== 'HEALTHY' ||
          service.dependencyAvailable === false)
    );
  };

  const recovered = latest?.status === 'RECOVERED';

  const failed = ['FAILED', 'DETECTION_FAILED'].includes(
    latest?.status || ''
  );

  const verificationPassed =
    latest?.verification?.startsWith('PASSED') ?? false;

  const verificationFailed =
    latest?.verification?.startsWith('FAILED') ?? false;

  const workflowStages = [
    {
      number: '01',
      title: 'Failure Injection',
      icon: '⚡',
      detail: latest
        ? `${latest.serviceName || latest.serviceId} · ${latest.type}`
        : 'Inject a fault from Chaos Lab',
      state: latest ? 'COMPLETED' : 'WAITING',
      done: Boolean(latest),
      error: false,
    },
    {
      number: '02',
      title: 'Fault Detection',
      icon: '◉',
      detail: latest?.detectedAt
        ? `Detected at ${new Date(
            latest.detectedAt
          ).toLocaleTimeString()}`
        : latest?.status === 'DETECTION_FAILED'
          ? 'Monitor could not detect the fault'
          : 'Waiting for detection result',
      state: latest?.detectedAt
        ? 'COMPLETED'
        : latest?.status === 'DETECTION_FAILED'
          ? 'FAILED'
          : 'WAITING',
      done: Boolean(latest?.detectedAt),
      error: latest?.status === 'DETECTION_FAILED',
    },
    {
      number: '03',
      title: 'Self-Healing',
      icon: '⟳',
      detail: !latest
        ? 'No recovery action recorded'
        : latest.healingEnabled === false
          ? 'Automatic healing disabled'
          : latest.recoveryAction ||
            (latest.recoveredAt
              ? 'Recovery completed'
              : 'Waiting for recovery result'),
      state: latest?.recoveredAt
        ? 'COMPLETED'
        : latest?.status === 'RECOVERING'
          ? 'IN PROGRESS'
          : latest?.status === 'FAILED'
            ? 'FAILED'
            : latest?.healingEnabled === false
              ? 'DISABLED'
              : 'WAITING',
      done: Boolean(latest?.recoveredAt),
      error: latest?.status === 'FAILED',
    },
    {
      number: '04',
      title: 'Health Verification',
      icon: '✓',
      detail: latest?.verification || 'Verification result pending',
      state: verificationPassed
        ? 'PASSED'
        : verificationFailed || failed
          ? 'FAILED'
          : 'WAITING',
      done: verificationPassed,
      error: verificationFailed || failed,
    },
    {
      number: '05',
      title: 'Incident Log',
      icon: '▤',
      detail: latest
        ? `Incident: ${latest.incidentId}`
        : 'No incident recorded yet',
      state: latest ? 'RECORDED' : 'WAITING',
      done: Boolean(latest),
      error: false,
    },
  ];

  return (
    <section className="backend-healing-panel">
      <div className="backend-healing-heading">
        <div>
          <p className="backend-healing-eyebrow">
            NEXORA / BACKEND MONITOR
          </p>
          <h2>Failure &amp; Self-Healing Workflow</h2>
          <p>
            Live service status, dependency impact and latest incident.
          </p>
        </div>

        <span
          className={`healing-result ${
            recovered ? 'result-ok' : failed ? 'result-failed' : ''
          }`}
        >
          {recovered
            ? 'RECOVERED'
            : failed
              ? latest?.status
              : latest?.status || 'NO INCIDENT'}
        </span>
      </div>

      {/* Graphical backend execution pipeline */}
      <div className="backend-live-graph">
        <div className="backend-live-heading">
          <div>
            <p className="backend-live-label">
              NEXORA / BACKEND EXECUTION PIPELINE
            </p>
            <h3>Live Self-Healing Process</h3>
            <p>
              Follow the latest recorded incident through the backend workflow.
            </p>
          </div>

          <span
            className={`backend-live-badge ${
              recovered
                ? 'live-success'
                : failed
                  ? 'live-failed'
                  : latest
                    ? 'live-progress'
                    : 'live-waiting'
            }`}
          >
            {recovered
              ? '● RECOVERED'
              : failed
                ? '● FAILED'
                : latest
                  ? '● INCIDENT FOUND'
                  : '● MONITORING'}
          </span>
        </div>

        <div className="backend-pipeline">
          {workflowStages.map((stage, index) => (
            <Fragment key={stage.number}>
              <div
                className={`backend-pipeline-stage ${
                  stage.done ? 'pipeline-done' : ''
                } ${stage.error ? 'pipeline-error' : ''} ${
                  stage.state === 'IN PROGRESS' ? 'pipeline-active' : ''
                }`}
              >
                <span className="pipeline-number">
                  {stage.number}
                </span>

                <span className="pipeline-icon">
                  {stage.icon}
                </span>

                <strong>{stage.title}</strong>

                <small>{stage.detail}</small>

                <span className="pipeline-state">
                  {stage.state}
                </span>
              </div>

              {index < workflowStages.length - 1 && (
                <div
                  className={`pipeline-connector ${
                    stage.done ? 'connector-done' : ''
                  }`}
                  aria-hidden="true"
                >
                  <span>→</span>
                </div>
              )}
            </Fragment>
          ))}
        </div>

        <div className="backend-pipeline-footer">
          <span>
            <i
              className={`pipeline-dot ${
                recovered
                  ? 'dot-green'
                  : failed
                    ? 'dot-red'
                    : ''
              }`}
            />
            {latest
              ? `Latest incident: ${latest.incidentId}`
              : 'Waiting for first incident'}
          </span>

          <span>
            {recovered
              ? 'Health verification successful'
              : failed
                ? 'Failure recorded — inspect the stage marked FAILED'
                : 'Stage indicators use the latest recorded backend data'}
          </span>
        </div>
      </div>

      <h3 className="dependency-graph-title">
        Service Dependency Impact
      </h3>

      <div className="dependency-graph-grid">
        {links.map((link) => {
          const source = getService(link.source);
          const target = getService(link.target);

          const impacted =
            isUnhealthy(link.source) ||
            isUnhealthy(link.target);

          return (
            <div className="dependency-pair" key={link.source}>
              <div className="dependency-node">
                <strong>{source?.name || link.source}</strong>
                <span>{source?.status || 'UNKNOWN'}</span>
              </div>

              <div
                className={`dependency-arrow ${
                  impacted ? 'arrow-alert' : ''
                }`}
                aria-label="depends on"
              >
                <span>→</span>
                <small>
                  {impacted ? 'IMPACT' : 'DEPENDENCY'}
                </small>
              </div>

              <div className="dependency-node">
                <strong>{target?.name || link.target}</strong>
                <span>{target?.status || 'UNKNOWN'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="healing-detail">
        <h3>Latest Incident Details</h3>

        {latest ? (
          <>
            <p>
              <strong>Diagnosis:</strong>{' '}
              {latest.diagnosis || 'Not available'}
            </p>

            <p>
              <strong>Recovery action:</strong>{' '}
              {latest.recoveryAction || 'Not available'}
            </p>

            <p>
              <strong>Verification:</strong>{' '}
              {latest.verification || 'Pending'}
            </p>

            <p>
              <strong>Detection time:</strong>{' '}
              {latest.detectionMs == null
                ? 'N/A'
                : `${latest.detectionMs} ms`}
            </p>

            <p>
              <strong>Recovery time:</strong>{' '}
              {latest.recoveryMs == null
                ? 'N/A'
                : `${latest.recoveryMs} ms`}
            </p>
          </>
        ) : (
          <p>
            Inject a failure from Chaos Lab to view backend results.
          </p>
        )}
      </div>
    </section>
  );
}

type HealingReport = {
  totalRecords: number;
  missingValues: number;
  invalidValues: number;
  duplicateRecords: number;
  malformedRows: number;
  repairedRecords: number;
  repairedValues?: number;
  needsReview: number;
  removedRecords: number;
  outputRecords: number;
};

type HealingResult = {
  report: HealingReport;
  downloadUrl: string;
  healingMode: string;
  preview: {
    original: Record<string, string>[];
    repaired: Record<string, string>[];
  };
};

function DataHealingFlowGraph({
  result,
  busy,
  error,
}: {
  result: HealingResult | null;
  busy: boolean;
  error: string;
}) {
  const hasResult = Boolean(result);
  const report = result?.report;
  const needsReview = (report?.needsReview ?? 0) > 0;
  const repaired = (report?.repairedValues ?? 0) + (report?.repairedRecords ?? 0) + (report?.removedRecords ?? 0) > 0;
  const failed = Boolean(error);
  const stages = [
    {
      number: '01', title: 'CSV Upload', icon: '▤',
      detail: busy ? 'Uploading dataset for processing' : hasResult ? `${report?.totalRecords ?? 0} input records received` : failed ? 'Upload or processing error' : 'Waiting for CSV upload',
      done: hasResult, error: failed, state: busy ? 'IN PROGRESS' : hasResult ? 'COMPLETED' : failed ? 'FAILED' : 'WAITING',
    },
    {
      number: '02', title: 'Data Validation', icon: '◉',
      detail: hasResult ? `${report?.missingValues ?? 0} missing · ${report?.invalidValues ?? 0} invalid` : failed ? error : 'Validation starts after upload',
      done: hasResult, error: failed, state: hasResult ? 'COMPLETED' : failed ? 'FAILED' : 'WAITING',
    },
    {
      number: '03', title: 'Data Healing', icon: '⟳',
      detail: hasResult ? repaired ? `${report?.repairedValues ?? 0} values repaired · ${report?.removedRecords ?? 0} duplicates removed` : 'No repairs needed for this dataset' : 'Waiting for validation result',
      done: hasResult && !needsReview, error: failed || (hasResult && needsReview), state: !hasResult ? 'WAITING' : needsReview ? 'REVIEW' : repaired ? 'REPAIRED' : 'NO CHANGES',
    },
    {
      number: '04', title: 'Output Verification', icon: '✓',
      detail: hasResult ? `${report?.outputRecords ?? 0} output records · ${report?.needsReview ?? 0} need review` : 'Output checked after healing',
      done: hasResult && !needsReview && !failed, error: failed || (hasResult && needsReview), state: !hasResult ? 'WAITING' : needsReview ? 'REVIEW REQUIRED' : 'VERIFIED',
    },
    {
      number: '05', title: 'Result Recorded', icon: '▣',
      detail: hasResult ? 'Healing report and repaired CSV are available' : failed ? 'Result was not recorded successfully' : 'No healing run recorded yet',
      done: hasResult, error: failed, state: hasResult ? 'RECORDED' : failed ? 'FAILED' : 'WAITING',
    },
  ];
  const badge = busy ? 'PROCESSING' : failed ? 'FAILED' : !hasResult ? 'AWAITING CSV' : needsReview ? 'REVIEW REQUIRED' : repaired ? 'HEALING COMPLETE' : 'NO REPAIR NEEDED';

  return (
    <section className="backend-live-graph data-healing-flow-graph">
      <div className="backend-live-heading">
        <div>
          <p className="backend-live-label">NEXORA / DATA HEALING PIPELINE</p>
          <h3>CSV Healing Workflow</h3>
          <p>Updates from the latest Data Healing run. Chaos Lab's failure workflow remains unchanged.</p>
        </div>
        <span className={`backend-live-badge ${failed ? 'live-failed' : hasResult && !needsReview ? 'live-success' : 'live-waiting'}`}>● {badge}</span>
      </div>
      <div className="backend-pipeline">
        {stages.map((stage, index) => (
          <Fragment key={stage.number}>
            <div className={`backend-pipeline-stage ${stage.done ? 'pipeline-done' : ''} ${stage.error ? 'pipeline-error' : ''} ${stage.state === 'IN PROGRESS' ? 'pipeline-active' : ''}`}>
              <span className="pipeline-number">{stage.number}</span>
              <span className="pipeline-icon">{stage.icon}</span>
              <strong>{stage.title}</strong>
              <small>{stage.detail}</small>
              <span className="pipeline-state">{stage.state}</span>
            </div>
            {index < stages.length - 1 && <div className={`pipeline-connector ${stage.done ? 'connector-done' : ''}`} aria-hidden="true"><span>→</span></div>}
          </Fragment>
        ))}
      </div>
      <div className="backend-pipeline-footer">
        <span><i className={`pipeline-dot ${failed ? 'dot-red' : hasResult && !needsReview ? 'dot-green' : ''}`} />{hasResult ? `Latest CSV run: ${report?.totalRecords ?? 0} input → ${report?.outputRecords ?? 0} output records` : 'Waiting for a CSV to be processed'}</span>
        <span>{failed ? error : !hasResult ? 'Upload a CSV in Data Healing to populate this workflow' : needsReview ? 'Some records need review; output is not marked fully verified' : repaired ? 'Healing results processed and output generated' : 'No repair was required; output generated without changing values'}</span>
      </div>
    </section>
  );
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const API = `${API_BASE}/api`;
const CACHE_KEY = 'nexora-offline-snapshot-v2';
const navItems = [
  { id: 'overview', label: 'Overview', icon: '◫' },
  { id: 'dependencies', label: 'Dependency Map', icon: '⌘' },
  { id: 'chaos', label: 'Chaos Lab', icon: 'ϟ' },
  { id: 'data-healing', label: 'Data Healing', icon: '✳' },
  { id: 'incidents', label: 'Incident History', icon: '◷' },
  { id: 'reliability', label: 'Reliability', icon: '▥' },
  { id: 'risk', label: 'Failure Risk', icon: '⌁' },
] as const;
type Page = typeof navItems[number]['id'];

const initialMetrics: Metrics = { totalTests: 0, detectedCount: 0, recoveredCount: 0, failedCount: 0, detectionRate: 0, recoveryRate: 0, averageTotalRecoveryMs: null, averageRecoveryMs: null, healingEnabled: true };
function timeLabel(value?: string | null) { return value ? new Date(value).toLocaleString() : '—'; }
function duration(value?: number | null) { return value == null ? '—' : value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(2)} s`; }
function statusLabel(status: string) { return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }
function loadSnapshot(): { services: Service[]; incidents: Incident[]; metrics: Metrics; failureTypes: FailureOption[]; healingEnabled: boolean; savedAt?: string } | null {
  try { const raw = localStorage.getItem(CACHE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export default function App() {
  const [page, setPage] = useState<Page>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
  return localStorage.getItem('nexora-theme') === 'light'
    ? 'light'
    : 'dark';
});

useEffect(() => {
  localStorage.setItem('nexora-theme', theme);
}, [theme]);
  const [services, setServices] = useState<Service[]>(() => loadSnapshot()?.services ?? []);
  const [incidents, setIncidents] = useState<Incident[]>(() => loadSnapshot()?.incidents ?? []);
  const [metrics, setMetrics] = useState<Metrics>(() => loadSnapshot()?.metrics ?? initialMetrics);
  const [monitorState, setMonitorState] = useState<MonitorState>({ running: false, lastCheckAt: null, totalChecks: 0, healthyServices: 0, degradedServices: 0, failedServices: 0, intervalMs: 2000 });
  const [failureTypes, setFailureTypes] = useState<FailureOption[]>(() => loadSnapshot()?.failureTypes ?? []);
  const [healingEnabled, setHealingEnabled] = useState(() => loadSnapshot()?.healingEnabled ?? true);
  const [backendStatus, setBackendStatus] = useState<'CONNECTING' | 'ONLINE' | 'OFFLINE'>(() => navigator.onLine ? 'CONNECTING' : 'OFFLINE');
  const [lastSynced, setLastSynced] = useState<string | null>(() => loadSnapshot()?.savedAt ?? null);
  const [selectedType, setSelectedType] = useState<FailureType>('PROCESS_CRASH');
  const [selectedService, setSelectedService] = useState('powergrid');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
  if (!notice) return;

  const timer = window.setTimeout(() => {
    setNotice('');
  }, 5000);

  return () => window.clearTimeout(timer);
}, [notice]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

const [healingResult, setHealingResult] = useState<HealingResult | null>(null);
const [healingBusy, setHealingBusy] = useState(false);
const [healingError, setHealingError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const endpoints = await Promise.all(['/services', '/incidents', '/metrics', '/failure-types', '/health', '/monitor', '/risk-scores'].map(path =>fetch(`${API}${path}`, {
  cache: 'no-store',
  signal: AbortSignal.timeout(8000)
})));
      if (endpoints.some(response => !response.ok)) throw new Error('One or more API requests failed.');
      const [s, i, m, f, _health, monitor, _risk] = await Promise.all(endpoints.map(response => response.json()));
      const syncTime = new Date().toISOString();
      const snapshot = { services: s.services as Service[], incidents: i.incidents as Incident[], metrics: m as Metrics, failureTypes: f.failureTypes as FailureOption[], healingEnabled: Boolean(s.healingEnabled), savedAt: syncTime };
      setServices(snapshot.services); setIncidents(snapshot.incidents); setMetrics(snapshot.metrics); setFailureTypes(snapshot.failureTypes); setHealingEnabled(snapshot.healingEnabled); setMonitorState(monitor as MonitorState);
      setBackendStatus('ONLINE');
setLastSynced(syncTime);
localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
setError('');

    } catch (e) {
      setBackendStatus('OFFLINE');
      setError(e instanceof Error ? e.message : 'Backend unavailable. Showing saved data.');
    }
  }, []);

  useEffect(() => {
    void refresh();
   const interval = window.setInterval(() => void refresh(), 5000);
    const online = () => { setBackendStatus('CONNECTING'); void refresh(); };
    const offline = () => setBackendStatus('OFFLINE');
    window.addEventListener('online', online); window.addEventListener('offline', offline);
    return () => { window.clearInterval(interval); window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, [refresh]);

  const healthyCount = services.filter(s => s.status === 'HEALTHY').length;
  const overallStatus = services.length === 0 ? 'UNKNOWN' : services.some(s => s.status === 'FAILED') ? 'CRITICAL' : services.some(s => s.status === 'DEGRADED') ? 'DEGRADED' : 'OPERATIONAL';
  const filteredIncidents = useMemo(() => incidents.filter(i => `${i.serviceName} ${i.type} ${i.status} ${i.diagnosis}`.toLowerCase().includes(search.toLowerCase())), [incidents, search]);
  const displayOrder = ['powergrid', 'aquaflow', 'citylink', 'medicore'];
const orderedServices = [...services].sort(
  (a, b) => displayOrder.indexOf(a.id) - displayOrder.indexOf(b.id)
);
  const dependencyLinks = [
    { source: 'powergrid', target: 'aquaflow' },
    { source: 'citylink', target: 'medicore' },
  ];

  const cascadeImpacts = dependencyLinks.map(link => {
    const source = services.find(s => s.id === link.source);
    const target = services.find(s => s.id === link.target);

    return {
      ...link,
      sourceName: source?.name ?? link.source,
      targetName: target?.name ?? link.target,
      sourceStatus: source?.status ?? 'UNKNOWN',
      targetStatus: target?.status ?? 'UNKNOWN',
    atRisk:
  (source !== undefined && source.status !== 'HEALTHY') ||
  (target !== undefined &&
    (target.status === 'DEGRADED' ||
      !target.dependencyAvailable)) ||
  incidents.some(
    incident =>
      incident.serviceId === link.source &&
      Date.now() - new Date(incident.injectedAt).getTime() < 10000
  ),
    };
  });

async function uploadHealingFile(file: File) {
  setHealingBusy(true);
  setHealingError('');
  setHealingResult(null);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API}/data-healing/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'CSV upload failed.');
    }

    const downloadUrl = data.downloadUrl.startsWith('http')
      ? data.downloadUrl
      : `http://localhost:5000${data.downloadUrl}`;

    setHealingResult({
      ...data,
      downloadUrl,
    });
  } catch (e) {
    setHealingError(
      e instanceof Error ? e.message : 'Could not process the CSV file.'
    );
  } finally {
    setHealingBusy(false);
  }
}

  async function apiPost(path: string, body?: unknown) {
    const response = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data as { message?: string; healingEnabled?: boolean };
  }
  async function injectFailure() {
    if (backendStatus !== 'ONLINE' || busy) return;
    setBusy(true); setNotice(''); setError('');
    try {
      const result = await apiPost(`/failures/${selectedService}`, { type: selectedType });
      setNotice(result.message || 'Failure test started. Results will appear in Incident History.');
      await refresh();
      window.setTimeout(() => { void refresh(); }, 1800);
      window.setTimeout(() => { void refresh(); }, 3200);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not run the failure test.'); }
    finally { window.setTimeout(() => setBusy(false), 1000); }
  }
  async function toggleHealing() {
    try { const result = await apiPost('/healing', { enabled: !healingEnabled }); setHealingEnabled(Boolean(result.healingEnabled)); setNotice(result.message || 'Healing setting updated.'); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update healing mode.'); }
  }
  async function resetDemo() {
    if (!window.confirm('Reset all simulated services and CLEAR incident history from MongoDB?')) return;
    setBusy(true);
    try { const result = await apiPost('/reset'); setNotice(result.message || 'Demo reset complete.'); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Reset failed.'); }
    finally { setBusy(false); }
  }
  async function recoverService(serviceId: string) {
    try { const result = await apiPost(`/recovery/${serviceId}`); setNotice(result.message || 'Health check finished.'); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Recovery request failed.'); }
  }
return (
  <div className={`app-shell theme-${theme}`}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">N<span>+</span></div><div><strong>NEXORA</strong><small>SMART CITY SYSTEMS</small></div></div>
      <div className="side-caption">CONTROL CENTER</div>
      <nav>{navItems.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{page === item.id && <i />}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="healing-card"><div className="healing-top"><span className="pulse-dot" /><span>SELF-HEALING</span></div><strong>{healingEnabled ? 'Automatic mode ON' : 'Manual test mode'}</strong><p>{healingEnabled ? 'Supported failures are handled automatically.' : 'Faults are logged without automatic recovery.'}</p><button className="subtle-button" disabled={backendStatus !== 'ONLINE'} onClick={() => void toggleHealing()}>{healingEnabled ? 'Disable healing' : 'Enable healing'}</button></div>
      <div className="side-footer"><span className={`connection-dot ${backendStatus.toLowerCase()}`} />{backendStatus === 'ONLINE' ? 'API connected' : backendStatus === 'OFFLINE' ? 'API offline' : 'Connecting to API'}<small>PHOENIX · DEMO ENVIRONMENT</small></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div><div className="eyebrow">PHOENIX RESILIENCE PROJECT</div><h1>{navItems.find(n => n.id === page)?.label}</h1></div><div className="top-actions"><div className={`api-pill ${backendStatus.toLowerCase()}`}><span />{backendStatus === 'ONLINE' ? 'API: ONLINE' : backendStatus === 'OFFLINE' ? 'API: OFFLINE' : 'API: CONNECTING'}</div><div className="avatar">NX</div><button
  className="theme-toggle"
  onClick={() =>
    setTheme(current =>
      current === 'dark' ? 'light' : 'dark'
    )
  }
  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
  title="Change theme"
>
  {theme === 'dark' ? '☀️' : '🌙'}
</button>
      </div>
  </header>
      {backendStatus !== 'ONLINE' && <div className="offline-banner"><span className="banner-icon">ⓘ</span><div><strong>OFFLINE — showing cached data</strong><p>Live monitoring and failure injection are unavailable until the backend reconnects.</p></div><span className="sync-time">Last sync: {lastSynced ? new Date(lastSynced).toLocaleTimeString() : 'No saved snapshot'}</span></div>}
      {notice && <div className="notice-banner"><span>✓</span>{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}
      {error && <div className="error-banner"><span>!</span>{error}<button aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}

      {page === 'overview' && <>
        <section className="hero-panel"><div className="hero-copy"><div className="live-label"><span className="pulse-dot" /> LIVE SERVICE MONITOR</div><h2>Resilience at the<br /><em>speed of the city.</em></h2><p>Detect. Diagnose. Recover. Verify. A safe simulation of autonomous service resilience across critical city systems.</p><div className="hero-foot"><span className={`status-badge ${overallStatus === 'OPERATIONAL' ? 'good' : overallStatus === 'DEGRADED' ? 'warn' : 'bad'}`}><i />{statusLabel(overallStatus)}</span><span className="hero-separator" /> <span>{healthyCount} of {services.length} services healthy</span></div></div><div className="hero-orbit"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core"><span>NX</span><small>CORE</small></div><span className="orbit-node node-one">⚡</span><span className="orbit-node node-two">⌁</span><span className="orbit-node node-three">✚</span><span className="orbit-node node-four">↗</span></div><div className="hero-code">SYSTEM / HEALTHCHECK<br />AUTO-REMEDIATION: {healingEnabled ? 'ENABLED' : 'DISABLED'}<br />ENVIRONMENT: SIMULATED</div></section>

        <section className="metric-grid overview-metric-grid">
          
<Metric label="Service health" value={`${healthyCount}/${services.length || 0}`} note="Services currently healthy" icon="◈" /><Metric label="Tests executed" value={String(metrics.totalTests)} note="Stored in MongoDB" icon="ϟ" /><Metric label="Verified recoveries" value={String(metrics.recoveredCount)} note={`${metrics.recoveryRate}% of all tests`} icon="↻" /><Metric label="Detection failures" value={String(incidents.filter(i => i.status === 'DETECTION_FAILED').length)} note="Known monitor blind spots" icon="!" /><Metric label="Live health monitor" value={backendStatus !== 'ONLINE' ? 'OFFLINE' : monitorState.running ? 'RUNNING' : 'STARTING'} note={backendStatus !== 'ONLINE' ? 'Backend connection unavailable' : `${monitorState.totalChecks} checks · Last: ${monitorState.lastCheckAt ? new Date(monitorState.lastCheckAt).toLocaleTimeString() : 'Waiting'}`} icon="◷" /></section>
        <section className="section-heading"><div><div className="eyebrow">CITY INFRASTRUCTURE</div><h2>Service health</h2></div><button className="text-button" onClick={() => setPage('dependencies')}>View dependency map ↗</button></section>
        <section className="service-grid">{services.map(s => <ServiceCard key={s.id} service={s} onRecover={() => void recoverService(s.id)} disabled={backendStatus !== 'ONLINE'} />)}</section>

        <section className="lower-grid"><div className="panel"><div className="panel-heading"><div><div className="eyebrow">LATEST EVENTS</div><h3>Recent incidents</h3></div><button className="text-button" onClick={() => setPage('incidents')}>View all →</button></div>{incidents.length ? incidents.slice(0, 4).map(i => <IncidentRow key={i.incidentId} incident={i} />) : <EmptyState title="No incidents yet" text="Run a failure scenario in Chaos Lab to create your first event." />}</div><div className="panel quick-panel"><div className="eyebrow">QUICK ACTION</div><h3>Run a resilience test</h3><p>Trigger a controlled fault and watch the system detect, attempt recovery and verify health.</p><button className="primary-button" disabled={backendStatus !== 'ONLINE'} onClick={() => setPage('chaos')}>Open Chaos Lab <span>↗</span></button><div className="quick-stats"><div><strong>{duration(metrics.averageTotalRecoveryMs)}</strong><span>AVG TOTAL RECOVERY</span></div><div><strong>{metrics.detectionRate}%</strong><span>DETECTION RATE*</span></div></div><small className="fine-print">*Includes monitor timeout tests in the total.</small></div></section>

<section className="data-health-overview panel">
  <div className="panel-heading">
    <div>
      <div className="eyebrow">DATA QUALITY MONITOR</div>
      <h3>Data Health & Healing</h3>
      <p>Before and after data repair comparison</p>
    </div>
    <span className={`mode-chip ${
      healingResult
        ? healingResult.report.needsReview === 0
          ? 'on'
          : 'off'
        : 'off'
    }`}>
      {healingResult
        ? healingResult.report.needsReview === 0
          ? 'PROCESSED'
          : 'REVIEW REQUIRED'
        : 'AWAITING DATA'}
    </span>
  </div>
  {!healingResult ? (
    <div className="empty-state">
      <span>✳</span>
      <strong>No dataset processed yet</strong>
      <p>Upload a CSV in Data Healing to view detected issues and repair results here.</p>
      <button
        className="primary-button"
        onClick={() => setPage('data-healing')}
      >
        Open Data Healing →
      </button>
    </div>
  ) : (
    <>
      <div className="data-health-columns">
        <div className="data-health-side before">
          <h4>⚠ Before Healing</h4>
          <div className="data-health-item">
            <span>Missing values</span>
            <strong>{healingResult.report.missingValues}</strong>
          </div>
          <div className="data-health-item">
            <span>Invalid values</span>
            <strong>{healingResult.report.invalidValues}</strong>
          </div>
          <div className="data-health-item">
            <span>Duplicate records</span>
            <strong>{healingResult.report.duplicateRecords}</strong>
          </div>
          <div className="data-health-item">
            <span>Malformed rows</span>
            <strong>{healingResult.report.malformedRows}</strong>
          </div>
        </div>

        <div className="data-health-side after">
          <h4>✓ After Healing</h4>
          <div className="data-health-item">
            <span>Values repaired</span>
            <strong>{healingResult.report.repairedValues ?? 0}</strong>
          </div>
          <div className="data-health-item">
            <span>Records repaired</span>
            <strong>{healingResult.report.repairedRecords}</strong>
          </div>
          <div className="data-health-item">
            <span>Duplicates removed</span>
            <strong>{healingResult.report.removedRecords}</strong>
          </div>
          <div className="data-health-item">
            <span>Records needing review</span>
            <strong>{healingResult.report.needsReview}</strong>
          </div>
        </div>
      </div>

      <DataHealingFlowGraph
  result={healingResult}
  busy={healingBusy}
  error={healingError}
/>

      <div className="data-health-footer">
        <div>
          <strong>{healingResult.report.outputRecords}</strong>
          <span>Output records</span>
        </div>
        <div>
          <strong>{healingResult.report.totalRecords}</strong>
          <span>Input records</span>
        </div>
        <button
          className="outline-button"
          onClick={() => setPage('data-healing')}
        >
          View full report →
        </button>
      </div>
    </>
  )}
</section>

</>}

      {page === 'dependencies' && <>
        <section className="page-intro">
          <div className="eyebrow">SERVICE RELATIONSHIPS</div>
          <h2>Dependency map</h2>
          <p>Illustrative relationships between simulated city services. This is a college demo, not a live city-control system.</p>
        </section>

        <div className="dependency-canvas">
          <div className="dependency-line line-a" />
          <div className="dependency-line line-b" />
          <div className="dependency-line line-c" />
          <div className="dependency-line line-d" />
          <div className="dependency-hub">
            <span>NX</span>
            <strong>Monitoring<br />Controller</strong>
            <small>HEALTH PROBES</small>
          </div>
          {orderedServices.map((s, index) => (
            <div className={`dependency-node dep-${index}`} key={s.id}>
              <div className={`dep-icon ${s.status.toLowerCase()}`}>
                {['ϟ', '≈', '⌁', '✚'][index]}
              </div>
              <div>
                <strong>{s.name}</strong>
                <small>{s.category}</small>
                <span className={`mini-status ${s.status.toLowerCase()}`}>
                  {statusLabel(s.status)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="panel cascade-panel">
          <div className="eyebrow">CASCADE FAILURE ANALYSIS</div>
          <h3>Dependency impact analyzer</h3>
          <p>Shows which connected service may be affected when its upstream simulated service is unhealthy.</p>
          {cascadeImpacts.map(link => (
            <div className="cascade-row" key={`${link.source}-${link.target}`}>
              <div>
                <strong>{link.sourceName}</strong>
                <small>Upstream service</small>
              </div>
              <span className="cascade-arrow">→</span>
              <div>
                <strong>{link.targetName}</strong>
                <small>Dependent service</small>
              </div>
              <span className={`cascade-status ${link.atRisk ? 'at-risk' : 'stable'}`}>
                {link.atRisk ? 'POTENTIAL IMPACT' : 'NO CURRENT ALERT'}
              </span>
            </div>
          ))}
        </div>

        <div className="note-panel">
          <strong>How to read this map</strong>
          <p>Service links are a conceptual model for the simulation. A red/amber card means a fault is active or the service is degraded; verify the associated incident before claiming recovery.</p>
        </div>
      </>}

      {page === 'chaos' && <><section className="page-intro"><div className="eyebrow">CONTROLLED FAILURE INJECTION</div><h2>Chaos Lab</h2><p>Introduce a safe simulated fault. The backend records injection, detection, recovery action and health verification timestamps.</p></section>
<section className="backend-healing-dashboard">
  <BackendHealingGraph
    services={services}
    incidents={incidents}
  />
</section>
<div className="chaos-layout"><div className="panel test-panel"><div className="panel-heading"><div><div className="eyebrow">TEST CONFIGURATION</div><h3>Configure failure</h3></div><span className="lab-icon">ϟ</span></div><label className="field-label" htmlFor="service-select">TARGET SERVICE</label><select id="service-select" value={selectedService} onChange={e => setSelectedService(e.target.value)} disabled={busy || backendStatus !== 'ONLINE'}>{services.map(s => <option key={s.id} value={s.id}>{s.name} — {s.category}</option>)}</select><label className="field-label" htmlFor="failure-select">FAILURE SCENARIO</label><select id="failure-select" value={selectedType} onChange={e => setSelectedType(e.target.value as FailureType)} disabled={busy || backendStatus !== 'ONLINE'}>{failureTypes.map(f => <option key={f.type} value={f.type}>{f.label}{f.autoRecoverable ? '' : ' — known limitation'}</option>)}{failureTypes.length === 0 && <option value="PROCESS_CRASH">Process Crash</option>}</select><div className="scenario-explain">{failureTypes.find(f => f.type === selectedType)?.description || 'Simulate a worker failure and attempt supervised recovery.'}</div>{selectedType === 'UNOBSERVABLE_FAULT' && <div className="warning-box"><strong>Expected limitation</strong><p>This test intentionally removes the monitor health signal. The expected outcome is DETECTION_FAILED, not successful automatic recovery.</p></div>}<div className="mode-row"><div><strong>Automatic healing</strong><small>{healingEnabled ? 'Recovery controller is enabled' : 'Healing OFF comparison run'}</small></div><span className={`mode-chip ${healingEnabled ? 'on' : 'off'}`}>{healingEnabled ? 'ON' : 'OFF'}</span></div><button className="primary-button run-button" disabled={backendStatus !== 'ONLINE' || busy || !services.length} onClick={() => void injectFailure()}>{busy ? <><span className="spinner"/> Running test…</> : <>Inject failure <span>→</span></>}</button><p className="safe-note">◉ Safe simulation only. This does not stop real utilities or kill the Express backend.</p></div><div className="panel test-guide"><div className="eyebrow">TEST LIFECYCLE</div><h3>What the system should do</h3><div className="lifecycle"><Lifecycle n="01" title="Inject" text="A controlled fault is introduced into the selected simulated service."/><Lifecycle n="02" title="Detect" text="The health monitor checks the service and records detection time."/><Lifecycle n="03" title="Diagnose & act" text="The recovery controller runs a type-specific action when healing is ON."/><Lifecycle n="04" title="Verify" text="A post-recovery health check decides RECOVERED or FAILED."/></div><div className="target-box"><span>PROJECT TARGET</span><strong>Under 30 seconds</strong><p>A target, not a guarantee. The dashboard records actual timings; no recovery time is invented.</p></div></div></div><section className="section-heading"><div><div className="eyebrow">RECENT TEST OUTPUT</div><h2>Latest test results</h2></div><button className="text-button" onClick={() => setPage('incidents')}>Incident history →</button></section><div className="panel">{incidents.length ? incidents.slice(0, 5).map(i => <IncidentRow key={i.incidentId} incident={i} />) : <EmptyState title="Awaiting first test" text="Select a service and scenario above to start." />}</div></>}
        
{page === 'data-healing' && <>
  <section className="page-intro">
    <div className="eyebrow">DATA QUALITY & RECOVERY</div>
    <h2>Data Healing Center</h2>
    <p>Upload a CSV, detect data-quality issues, review repaired values and export the result. This tool processes demo datasets only.</p>
  </section>

  <section className="panel healing-upload-panel">
    <div className="panel-heading">
      <div>
        <div className="eyebrow">CSV PROCESSOR</div>
        <h3>Upload your dataset</h3>
      </div>
      <span className="lab-icon">✳</span>
    </div>

    <label className="healing-file-label" htmlFor="healing-file">
      <span className="healing-file-icon">↑</span>
      <strong>Select a CSV file</strong>
      <small>PowerGrid, AquaFlow, CityLink or MediCore · Max 5 MB</small>
    </label>

    <input
      id="healing-file"
      type="file"
      accept=".csv,text/csv"
      disabled={healingBusy}
      onChange={e => {
        const file = e.target.files?.[0];
        if (file) void uploadHealingFile(file);
        e.currentTarget.value = '';
      }}
    />

    {healingBusy && <p className="healing-message">Processing and checking records…</p>}
    {healingError && <div className="error-banner">{healingError}</div>}
  </section>


  {healingResult && <>
    <section className="metric-grid healing-metrics">
      <Metric label="Input records" value={String(healingResult.report.totalRecords)} note="Rows received" icon="▤" />
      <Metric label="Missing values" value={String(healingResult.report.missingValues)} note="Missing fields detected" icon="!" />
      <Metric label="Invalid values" value={String(healingResult.report.invalidValues)} note="Out-of-range or invalid numbers" icon="⌁" />
      <Metric label="Repaired values" value={String(healingResult.report.repairedValues ?? 0)} note="Values actually replaced" icon="↻" />
      <Metric label="Needs review" value={String(healingResult.report.needsReview)} note="Records with unresolved issues" icon="◷" />
    </section>

    <section className="panel healing-report-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">PROCESSING REPORT</div>
          <h3>Healing summary</h3>
        </div>
        <span className="mode-chip on">PROCESSED</span>
      </div>

      <p>{healingResult.healingMode}</p>

      <div className="healing-summary-grid">
        <div><span>Duplicate records removed</span><strong>{healingResult.report.removedRecords}</strong></div>
        <div><span>Output records</span><strong>{healingResult.report.outputRecords}</strong></div>
        <div><span>Repaired records</span><strong>{healingResult.report.repairedRecords}</strong></div>
      </div>

      {healingResult.preview && (
        <div className="healing-preview">
          <h3>Before and after preview</h3>
          <p>Showing the first 10 records returned by the server.</p>

          {healingResult.preview.original.length > 0 &&
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {Object.keys(healingResult.preview.original[0]).map(key =>
                      <th key={key}>{key}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {healingResult.preview.original.map((row, index) =>
                    <tr key={index}>
                      {Object.keys(healingResult.preview.original[0]).map(key =>
                        <td key={key}>{row[key] ?? '—'}</td>
                      )}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          }

          <h3>Repaired data</h3>
          {healingResult.preview.repaired.length > 0 &&
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {Object.keys(healingResult.preview.repaired[0]).map(key =>
                      <th key={key}>{key}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {healingResult.preview.repaired.map((row, index) =>
                    <tr key={index}>
                      {Object.keys(healingResult.preview.repaired[0]).map(key =>
                        <td key={key}>{row[key] ?? '—'}</td>
                      )}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          }
        </div>
      )}

      <a className="primary-button healing-download" href={healingResult.downloadUrl} download>
        Download repaired CSV <span>↓</span>
      </a>
    </section>
  </>}
</>}

      {page === 'risk' && <>
        <section className="page-intro"><div className="eyebrow">PREDICTIVE RESILIENCE</div><h2>Failure Prediction & Risk Score</h2><p>Transparent rule-based risk estimate using current simulated health signals, telemetry and incident history. Scores are stored on each service document in MongoDB.</p></section>
        <div className="risk-disclaimer"><strong>Demo model · Not machine learning</strong><span>This heuristic highlights risk indicators; it does not guarantee that a failure will occur.</span></div>
        <section className="risk-grid">{services.map(service => { const score = service.riskScore ?? 0; const level = service.riskLevel ?? 'LOW'; return <article className="panel risk-card" key={service.id}><div className="risk-card-top"><div><div className="eyebrow">{service.category}</div><h3>{service.name}</h3></div><span className={`risk-level ${level.toLowerCase()}`}>{level} RISK</span></div><div className="risk-score-line"><strong>{score}</strong><span>/ 100 risk score</span></div><div className="risk-track"><i className={level.toLowerCase()} style={{ width: `${score}%` }} /></div><p className="risk-health">Current service state: <strong>{statusLabel(service.status)}</strong></p><div className="risk-reasons"><strong>Contributing indicators</strong><ul>{(service.riskReasons?.length ? service.riskReasons : ['No current risk indicators detected']).map((reason, index) => <li key={`${service.id}-${index}`}>{reason}</li>)}</ul></div><small className="risk-updated">Updated: {service.riskUpdatedAt ? timeLabel(service.riskUpdatedAt) : 'Waiting for first risk calculation'}</small></article>; })}</section>
        <div className="note-panel"><strong>How the score is calculated</strong><p>Worker failure, unavailable dependencies, invalid data, missing monitoring signals, high latency/load, queue depth, degraded/failed status and incidents from the last 24 hours add weighted points. Score is capped at 100: LOW 0–29, MEDIUM 30–59, HIGH 60–100. Refresh the dashboard to recalculate.</p></div>
      </>}

      {page === 'incidents' && <><section className="page-intro"><div className="eyebrow">AUDIT TRAIL</div><h2>Incident history</h2><p>Timestamped test records read from MongoDB. Recovery success is counted only after verification.</p></section><div className="history-toolbar"><div className="search-box"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search service, type or diagnosis…" aria-label="Search incidents" /></div><span className="result-count">{filteredIncidents.length} records</span><button
  className="outline-button"
  onClick={() => {
    setNotice('Refreshing incident history...');
    void refresh();
  }}
>
  ↻ Refresh
</button></div><div className="panel table-panel"><div className="table-wrap"><table><thead>
  <tr>
    <th>Incident / Time</th>
    <th>Service / Failure</th>
    <th>Status</th>
    <th>Detected At</th>
    <th>Diagnosed At</th>
    <th>Action Taken At</th>
    <th>Recovered At</th>
    <th>Detection</th>
    <th>Total Time</th>
    <th>Verification</th>
  </tr>
</thead>
<tbody>
  {filteredIncidents.map((i) => (
    <tr key={i.incidentId}>
      <td>
        <strong>{i.incidentId}</strong>
        <small>{timeLabel(i.injectedAt)}</small>
      </td>
      <td>
        <strong>{i.serviceName}</strong>
        <small>{statusLabel(i.type)}</small>
      </td>
      <td>
        <span className={`table-status ${i.status.toLowerCase()}`}>
          {statusLabel(i.status)}
        </span>
      </td>
      <td>{timeLabel(i.detectedAt)}</td>
      <td>{timeLabel(i.diagnosedAt)}</td>
      <td>{timeLabel(i.actionTakenAt)}</td>
      <td>{timeLabel(i.recoveredAt)}</td>
      <td>{duration(i.detectionMs)}</td>
      <td>{duration(i.totalMs)}</td>
      <td className="verification-cell">{i.verification || 'Pending'}</td>
    </tr>
  ))}
</tbody></table></div>{filteredIncidents.length === 0 && <EmptyState title="No matching incidents" text="Try a different search or run a test in Chaos Lab." />}</div><button className="danger-quiet" disabled={backendStatus !== 'ONLINE' || busy} onClick={() => void resetDemo()}>Reset demo data & clear incident history</button></>}

      {page === 'reliability' && <>
   <section className="metric-grid">
  <Metric
    label="Detection rate"
    value={`${metrics.detectionRate}%`}
    note="Recorded detection outcomes"
    icon="◎"
  />

  <Metric
    label="Verified recovery rate"
    value={`${metrics.recoveryRate}%`}
    note="Passed recovery verification"
    icon="✓"
  />

  <Metric
    label="Average total recovery"
    value={duration(metrics.averageTotalRecoveryMs)}
    note="Injection to verified recovery"
    icon="◷"
  />

  <Metric
    label="Failed outcomes"
    value={String(metrics.failedCount)}
    note="Includes detection timeouts"
    icon="!"
  />
</section>
{healingResult && (
  <section className="panel healing-report-panel">
    <div className="eyebrow">LATEST DATA HEALING RUN</div>
    <h3>Data quality recovery</h3>
    <p>Results from the most recently processed CSV file.</p>

    <div className="healing-summary-grid">
      <div>
        <span>Repaired values</span>
        <strong>{healingResult.report.repairedValues ?? 0}</strong>
      </div>
      <div>
        <span>Repaired records</span>
        <strong>{healingResult.report.repairedRecords}</strong>
      </div>
      <div>
        <span>Duplicates removed</span>
        <strong>{healingResult.report.removedRecords}</strong>
      </div>
      <div>
        <span>Needs review</span>
        <strong>{healingResult.report.needsReview}</strong>
      </div>
    </div>

    <button
      className="outline-button"
      onClick={() => setPage('data-healing')}
    >
      Open Data Healing →
    </button>
  </section>
)}
<section className="page-intro"><div className="eyebrow">MEASURED RESILIENCE</div><h2>Reliability report</h2><p>Metrics are calculated from persisted test results. Run tests with healing ON and OFF for a useful comparison.</p></section><section className="metric-grid"><Metric label="Detection rate" value={`${metrics.detectionRate}%`} note={`${metrics.detectedCount} recorded detection outcomes`} icon="⌁" /><Metric label="Verified recovery rate" value={`${metrics.recoveryRate}%`} note={`${metrics.recoveredCount} passed verification`} icon="↻" /><Metric label="Average total recovery" value={duration(metrics.averageTotalRecoveryMs)} note="Injection to verified recovery" icon="◷" /><Metric label="Failed outcomes" value={String(metrics.failedCount)} note="Includes detection timeouts" icon="!" /></section><div className="reliability-grid"><div className="panel"><div className="eyebrow">OUTCOME BREAKDOWN</div><h3>Recorded tests</h3><div className="bar-metric"><div><span>Verified recovered</span><strong>{metrics.recoveredCount}</strong></div><div className="bar-track"><i className="bar-green" style={{ width: `${metrics.totalTests ? metrics.recoveredCount / metrics.totalTests * 100 : 0}%` }} /></div></div><div className="bar-metric"><div><span>Detected but not recovered</span><strong>{incidents.filter(i => i.status === 'FAILED').length}</strong></div><div className="bar-track"><i className="bar-amber" style={{ width: `${metrics.totalTests ? incidents.filter(i => i.status === 'FAILED').length / metrics.totalTests * 100 : 0}%` }} /></div></div><div className="bar-metric"><div><span>Detection failed</span><strong>{incidents.filter(i => i.status === 'DETECTION_FAILED').length}</strong></div><div className="bar-track"><i className="bar-red" style={{ width: `${metrics.totalTests ? incidents.filter(i => i.status === 'DETECTION_FAILED').length / metrics.totalTests * 100 : 0}%` }} /></div></div></div><div className="panel"><div className="eyebrow">INTERPRETATION</div><h3>What the data means</h3><ul className="report-list"><li><strong>RECOVERED</strong><span>Health verification passed after automated action.</span></li><li><strong>FAILED</strong><span>Fault was observed but no successful verified recovery was recorded.</span></li><li><strong>DETECTION_FAILED</strong><span>Monitor lacked a usable signal; this is a known limitation, not a successful detection.</span></li></ul><div className="warning-box"><strong>Evidence integrity</strong><p>Do not claim every failure heals. Keep Healing OFF and ON runs, actual timestamps and unresolved outcomes in your report.</p></div></div></div><div className="note-panel"><strong>How to compare Healing OFF vs ON</strong><p>Run the same service and failure type once with healing disabled, then again with healing enabled. Compare the recorded status and timing for each run. Reset clears all incident records, so export or capture your evidence first.</p><button className="outline-button" onClick={() => setPage('chaos')}>Run comparison tests ↗</button></div></>}
      <footer className="page-footer"><span>© NEXORA · PROJECT PHOENIX</span><span>SIMULATED ENVIRONMENT · NOT FOR REAL INFRASTRUCTURE CONTROL</span></footer>
    </main>
    </div>
);
}

function Metric({ label, value, note, icon }: { label: string; value: string; note: string; icon: string }) { return <div className="metric-card"><div className="metric-top"><span>{label}</span><i>{icon}</i></div><strong className="metric-value">{value}</strong><small>{note}</small></div>; }
function ServiceCard({ service, onRecover, disabled }: { service: Service; onRecover: () => void; disabled: boolean }) {
  const primaryMetric = service.metricLabel === 'API Response'
    ? `${service.latencyMs ?? 0} ${service.metricUnit ?? 'ms'}`
    : service.metricLabel === 'Water Pressure'
      ? `${service.loadPct ?? 0} ${service.metricUnit ?? '%'}`
      : `${service.loadPct ?? 0}${service.metricUnit ?? '%'}`;
  return <article className="service-card">
    <div className="service-top"><div className={`service-symbol ${service.status.toLowerCase()}`}>{service.name === 'PowerGrid' ? 'ϟ' : service.name === 'AquaFlow' ? '≈' : service.name === 'CityLink' ? '⌁' : '✚'}</div><span className={`status-badge ${service.status === 'HEALTHY' ? 'good' : service.status === 'DEGRADED' ? 'warn' : 'bad'}`}><i />{statusLabel(service.status)}</span></div>
    <h3>{service.name}</h3><div className="service-category">{service.category}</div><p>{service.description}</p>
    <div className="service-telemetry"><div><span>{service.metricLabel ?? 'Service Load'}</span><strong>{primaryMetric}</strong></div><div><span>Response Time</span><strong>{service.latencyMs ?? 0} ms</strong></div></div>
    <div className="service-checks"><span><i className={service.workerRunning ? 'check-ok' : 'check-bad'} />Worker</span><span><i className={service.dependencyAvailable ? 'check-ok' : 'check-bad'} />Dependency</span><span><i className={service.recordValid ? 'check-ok' : 'check-bad'} />Data</span></div>
    {(!service.monitorSignalAvailable || service.status !== 'HEALTHY' || service.queueDepth > 0) && <button className="recover-link" disabled={disabled} onClick={onRecover}>Run health-verified reset ↗</button>}
  </article>;
}
function IncidentRow({ incident }: { incident: Incident }) { return <div className="incident-row"><div className={`incident-mark ${incident.status.toLowerCase()}`}>{incident.status === 'RECOVERED' ? '✓' : incident.status === 'DETECTION_FAILED' || incident.status === 'FAILED' ? '!' : '↻'}</div><div className="incident-main"><strong>{incident.serviceName} · {statusLabel(incident.type)}</strong><p>{incident.diagnosis}</p><small>{timeLabel(incident.injectedAt)} · {incident.incidentId}</small>{incident.notes && <small className="incident-note">{incident.notes}</small>}</div><div className="incident-result"><span className={`table-status ${incident.status.toLowerCase()}`}>{statusLabel(incident.status)}</span><small>{incident.totalMs != null ? duration(incident.totalMs) : incident.status === 'DETECTION_FAILED' ? 'No detection' : 'In progress / —'}</small></div></div>; }
function Lifecycle({ n, title, text }: { n: string; title: string; text: string }) { return <div className="lifecycle-step"><span>{n}</span><div><strong>{title}</strong><p>{text}</p></div></div>; }
function EmptyState({ title, text }: { title: string; text: string }) { return <div className="empty-state"><span>◌</span><strong>{title}</strong><p>{text}</p></div>; }