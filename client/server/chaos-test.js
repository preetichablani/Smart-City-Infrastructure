const API = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }

  return data;
}

async function setHealing(enabled) {
  return request('/healing', {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  });
}

async function recoverService(serviceId) {
  return request(`/recovery/${serviceId}`, {
    method: 'POST',
  });
}

async function runFailure(serviceId, type) {
  console.log(`\nTesting ${type} on ${serviceId}...`);

  const started = Date.now();

  const result = await request(`/failures/${serviceId}`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  });

  console.log('Test result:', result.status);
  console.log('Message:', result.message);

  const allIncidents = await request('/incidents');

  const incident = allIncidents.incidents.find(
    (item) => item.incidentId === result.incidentId,
  );

  if (incident) {
    console.log('Incident ID:', incident.incidentId);
    console.log('Detection:', incident.detectionMs ?? 'Not detected');
    console.log('Recovery:', incident.recoveryMs ?? 'Not recovered');
    console.log('Total time:', incident.totalMs ?? 'Not recovered');
    console.log('Verification:', incident.verification);
  } else {
    console.log('Check Incident History for the saved record.');
  }

  console.log(
    'Client request duration:',
    `${Date.now() - started} ms`,
  );

  return result;
}

async function main() {
  console.log('================================');
  console.log('NEXORA AUTOMATED CHAOS TESTS');
  console.log('================================');

  const health = await request('/health');

  console.log('Backend:', health.status);
  console.log('Database:', health.database);

  if (health.database !== 'CONNECTED') {
    throw new Error('MongoDB is not connected. Start MongoDB first.');
  }

  console.log('\n--- Healing OFF comparison ---');

  await setHealing(false);
  await runFailure('aquaflow', 'DEPENDENCY_TIMEOUT');

  // Restore AquaFlow before the ON comparison.
  await recoverService('aquaflow');

  console.log('\n--- Healing ON comparison ---');

  await setHealing(true);
  await runFailure('aquaflow', 'DEPENDENCY_TIMEOUT');

  console.log('\n--- Four main failure tests ---');

  const tests = [
    ['powergrid', 'PROCESS_CRASH'],
    ['aquaflow', 'DEPENDENCY_TIMEOUT'],
    ['citylink', 'INVALID_RECORD'],
    ['medicore', 'REQUEST_OVERLOAD'],
  ];

  for (const [serviceId, type] of tests) {
    await setHealing(true);
    await runFailure(serviceId, type);
  }

  console.log('\n--- Detection blind spot test ---');

  await setHealing(true);
  await runFailure('citylink', 'UNOBSERVABLE_FAULT');

  // Intentionally do not reset CityLink.
  // It should remain FAILED for the demo.
  // Restore it manually after recording the results.

  console.log('\n================================');
  console.log('CHAOS TESTS FINISHED');
  console.log('Open Incident History and check the results.');
  console.log('CityLink is intentionally left failed.');
  console.log('================================');
}

main().catch((error) => {
  console.error('\nChaos tests stopped:', error.message);
  console.error('Check that MongoDB and the backend are running.');
  process.exitCode = 1;
});