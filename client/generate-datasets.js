
import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.join(process.cwd(), 'datasets');

fs.mkdirSync(outputDir, { recursive: true });

const TOTAL_RECORDS = 1000;

function timestamp(index) {
  const date = new Date(Date.UTC(2026, 9, 15, 0, index));
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

function csvValue(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function writeCsv(filename, headers, rows) {
  const content = [
    headers.map(csvValue).join(','),
    ...rows.map(row => headers.map(key => csvValue(row[key])).join(','))
  ].join('\n');

  fs.writeFileSync(path.join(outputDir, filename), content, 'utf8');
  console.log(`Created ${filename}: ${rows.length} records`);
}

// 1. PowerGrid: electricity sensor readings
function generatePowerGrid() {
  const rows = [];

  for (let i = 1; i <= TOTAL_RECORDS; i++) {
    rows.push({
      record_id: `PG${String(i).padStart(4, '0')}`,
      timestamp: timestamp(i),
      sensor_id: `PWR-${String((i % 25) + 1).padStart(3, '0')}`,
      area: `Zone-${(i % 10) + 1}`,
      voltage: i % 50 === 0 ? '999' : 220 + (i % 21),
      current: i % 37 === 0 ? '' : 5 + (i % 26),
      power_load_kw: (1.2 + (i % 100) / 10).toFixed(2),
      frequency_hz: '50',
      transformer_temp_c: 35 + (i % 30),
      status: 'NORMAL'
    });
  }

  // Deliberately inserted test failures
  rows[9].voltage = '999';
  rows[19].current = '';
  rows[29].transformer_temp_c = 'ERROR';

  writeCsv('powergrid.csv', Object.keys(rows[0]), rows);
}

// 2. AquaFlow: water pipeline readings
function generateAquaFlow() {
  const rows = [];

  for (let i = 1; i <= TOTAL_RECORDS; i++) {
    rows.push({
      record_id: `WF${String(i).padStart(4, '0')}`,
      timestamp: timestamp(i),
      pipeline_id: `PIPE-${(i % 40) + 1}`,
      area: `Zone-${(i % 10) + 1}`,
      pressure_psi: (25 + (i % 50)).toFixed(1),
      flow_rate_lpm: i % 30 === 0 ? '' : 100 + (i % 200),
      tank_level_percent: 30 + (i % 71),
      leakage_status: i % 17 === 0 ? 'CHECK' : 'NORMAL',
      sensor_status: 'ACTIVE'
    });
  }

  rows[14].pressure_psi = '';
  rows[24].flow_rate_lpm = 'UNKNOWN';
  rows[34].tank_level_percent = '150';

  writeCsv('aquaflow.csv', Object.keys(rows[0]), rows);
}

// 3. CityLink: traffic and signal readings
function generateCityLink() {
  const rows = [];

  for (let i = 1; i <= TOTAL_RECORDS; i++) {
    rows.push({
      record_id: `TR${String(i).padStart(4, '0')}`,
      timestamp: timestamp(i),
      road_id: `ROAD-${(i % 60) + 1}`,
      area: `Zone-${(i % 10) + 1}`,
      vehicle_count: 10 + (i % 190),
      signal_status: ['GREEN', 'RED', 'YELLOW'][i % 3],
      traffic_density: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
      sensor_latency_ms: i % 40 === 0 ? '-5' : 20 + (i % 180),
      sensor_status: 'ACTIVE'
    });
  }

  // Duplicate record
  rows[100] = { ...rows[99] };
  rows[19].vehicle_count = 'MANY';
  rows[29].signal_status = '';

  writeCsv('citylink.csv', Object.keys(rows[0]), rows);
}

// 4. MediCore: hospital resource readings
function generateMediCore() {
  const rows = [];

  for (let i = 1; i <= TOTAL_RECORDS; i++) {
    rows.push({
      record_id: `MC${String(i).padStart(4, '0')}`,
      timestamp: timestamp(i),
      hospital_id: `HOSP-${(i % 12) + 1}`,
      area: `Zone-${(i % 10) + 1}`,
      available_beds: 20 + (i % 81),
      equipment_status: ['OPERATIONAL', 'MAINTENANCE', 'OFFLINE'][i % 3],
      resource_count: 10 + (i % 90),
      emergency_units_available: i % 25 === 0 ? '' : 1 + (i % 10),
      record_status: 'NORMAL'
    });
  }

  rows[11].available_beds = '-20';
  rows[21].resource_count = 'BROKEN';
  rows[31].equipment_status = 'UNKNOWN';

  writeCsv('medicore.csv', Object.keys(rows[0]), rows);
}

generatePowerGrid();
generateAquaFlow();
generateCityLink();
generateMediCore();

console.log('\nAll four simulated datasets generated successfully.');
