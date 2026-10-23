# NEXORA — Smart City Self-Healing System

**An Intelligent Resilience Platform for Smart City Infrastructure**

NEXORA is a self-healing software project designed to simulate how smart city infrastructure systems can detect failures, recover automatically, monitor service health, and repair data quality issues with minimal manual intervention.

The platform provides a centralized dashboard for monitoring simulated city services, injecting controlled failures, tracking incidents, analyzing service dependencies, and evaluating system reliability.

## Overview

Modern smart city infrastructure depends on interconnected services such as electricity, water supply, communication networks, and healthcare resources. A failure in one service can affect dependent services and disrupt overall system availability.

NEXORA demonstrates a self-healing approach by detecting predefined failures, executing recovery mechanisms, validating service health, and recording incidents for analysis.

> **Project scope:** NEXORA is an academic simulation and demonstration platform. Its service readings and infrastructure scenarios are simulated, not connected to live city infrastructure.

## Key Features

- **Real-Time Service Monitoring** — Monitor the simulated health and operational status of city infrastructure services.
- **Automated Failure Detection** — Detect supported failure scenarios and track their recovery progress.
- **Self-Healing Mechanisms** — Demonstrate automatic recovery for supported failures without requiring a manual application restart.
- **Chaos Engineering Lab** — Inject controlled failures to evaluate system resilience.
- **Data Quality Monitoring** — Identify missing, invalid, duplicate, and malformed CSV data.
- **Automated Data Healing** — Repair supported data issues, generate corrected CSV output, and flag uncertain records for review.
- **Dependency Impact Analysis** — Visualize relationships between upstream and dependent services.
- **Incident Management** — Record incidents, detection outcomes, and recovery information.
- **Reliability Analytics** — Display metrics such as detection rate, recovery rate, and recovery duration.
- **Failure Risk Analysis** — Present risk indicators to support resilience monitoring.
- **Offline Snapshot Support** — Use cached dashboard data when the frontend cannot retrieve fresh API data.

## Simulated Infrastructure Services

| Service | Infrastructure Domain | Purpose |
|---|---|---|
| PowerGrid | Electricity | Simulated grid and power metrics |
| AquaFlow | Water Supply | Simulated water pressure and supply metrics |
| CityLink | Communication | Simulated network and connectivity metrics |
| MediCore | Healthcare | Simulated hospital resource and API metrics |

### Service Dependencies

- PowerGrid → AquaFlow
- CityLink → MediCore

These relationships demonstrate how an upstream service issue may affect a dependent service.

## Failure Scenarios

NEXORA demonstrates five predefined failure scenarios.

| Failure Type | Demonstration |
|---|---|
| `PROCESS_CRASH` | Simulates a process failure and supervisor-based restart |
| `DEPENDENCY_TIMEOUT` | Simulates a dependency timeout and retry-based recovery |
| `INVALID_RECORD` | Simulates invalid data, quarantine, and safe-data restoration |
| `REQUEST_OVERLOAD` | Simulates excessive requests and rate-limiting behavior |
| `UNOBSERVABLE_FAULT` | Demonstrates a detection blind spot that is reported as a detection failure rather than a successful recovery |

The first four scenarios are designed to demonstrate recovery mechanisms. The unobservable fault illustrates a limitation: a system cannot reliably recover from a failure it cannot detect.

## Self-Healing Workflow

The main resilience workflow is:

1. **Failure Injection** — Introduce a controlled failure through the Chaos Lab.
2. **Failure Detection** — Identify the failure using the application's monitoring and detection logic.
3. **Recovery Execution** — Run the appropriate recovery mechanism.
4. **Health Verification** — Check whether the affected service has returned to a healthy state.
5. **Incident Recording** — Store the outcome and recovery information for monitoring and analysis.

### Data Healing Workflow

1. Upload a CSV dataset.
2. Analyze data quality issues.
3. Identify missing, invalid, duplicate, or malformed records.
4. Repair supported values and remove duplicate records where applicable.
5. Flag uncertain data for manual review.
6. Generate a repaired CSV file and display a before-and-after report.

## Technology Stack

**Frontend**
- React
- TypeScript
- Vite
- CSS

**Backend**
- Node.js
- Express.js
- REST API

**Database**
- MongoDB
- Mongoose

**Data Processing**
- Python was part of the planned technology stack; the primary implementation described here uses the React and Node.js/Express application with MongoDB and CSV-processing libraries.

**Additional Libraries**
- `express-rate-limit`
- `multer`
- `csv-parse`
- `csv-stringify`

## Architecture

```text
                 NEXORA Dashboard
                  React + TypeScript
                          |
                          v
                    Express REST API
                          |
            +-------------+-------------+
            |             |             |
            v             v             v
       Monitoring      Chaos Lab    Data Healing
            |             |             |
            +-------------+-------------+
                          |
                          v
                       MongoDB
                          |
                          v
                 Incidents & Records
```

The frontend communicates with the backend through REST API endpoints. The backend manages simulated service monitoring, controlled failure scenarios, recovery workflows, data processing, and persistence of supported records.

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB
- Git

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Identity2026/client
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with your actual GitHub repository URL.

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

If the backend does not have a complete `package.json` containing its required dependencies, configure the dependency list before running it.

### 4. Configure MongoDB

Ensure MongoDB is running locally. The backend's default connection string is:

```text
mongodb://127.0.0.1:27017/phoenix
```

If your environment uses a different database connection string, configure `MONGO_URI` accordingly.

### 5. Start the Backend

From the `server` directory, run:

```bash
node index.js
```

The backend is configured to run on port `5000` by default.

Health endpoint:

```text
http://localhost:5000/api/health
```

### 6. Start the Frontend

Open a second terminal:

```bash
cd D:\Identity2026\client
npm run dev
```

Open the local URL printed by Vite in your terminal, typically:

```text
http://localhost:5174
```

If Vite selects another port, use the URL it displays.

## Demonstration and Testing

Use the dashboard to demonstrate the following capabilities:

- Check the health status of the simulated infrastructure services.
- Trigger supported failure scenarios in the Chaos Lab.
- Observe detection, recovery, and health verification.
- Review incident history and reliability metrics.
- Upload a CSV file to identify and repair supported data-quality issues.
- Download and compare the original and repaired dataset.
- Review dependency relationships and risk indicators.
- Trigger the unobservable fault to demonstrate the limitations of failure detection.

For an academic demonstration, capture the failure before recovery, the recovery workflow, the final service status, and the recorded incident or metrics.

## Project Objectives

- Demonstrate self-healing software principles.
- Reduce manual intervention in supported failure scenarios.
- Improve visibility into service health and dependency impact.
- Demonstrate automated handling of selected data-quality issues.
- Measure resilience through detection and recovery metrics.
- Illustrate the importance of observability in reliable software systems.

## Limitations

- Infrastructure telemetry is simulated and is not sourced from live smart city systems.
- Recovery behavior is implemented for predefined demonstration scenarios.
- Data repair is limited to supported rules; uncertain records may require manual review.
- The platform is an academic prototype and has not been established as a production-ready infrastructure control system.

## Future Enhancements

- Integrate live telemetry from authorized infrastructure APIs.
- Add authentication and role-based access control.
- Introduce configurable recovery policies and circuit breakers.
- Improve dependency-aware recovery orchestration.
- Add persistent historical analytics and exportable reports.
- Expand automated testing and deployment support.

## Academic Project

**Project Name:** NEXORA — Smart City Self-Healing System  
**Domain:** Self-Healing Software, Reliability Engineering, Smart City Simulation  
**Purpose:** Academic project and software resilience demonstration

---

*Building more resilient software through monitoring, automated recovery, and data quality management.*
