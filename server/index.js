/**
 * ITRS Hub - Cloud Database & API Backend Server Template
 * 
 * This server provides the REST API endpoints consumed by the ITRS Hub Cloud Service:
 * - GET  /api/hub/data   -> Returns entire workspace state
 * - POST /api/hub/sync   -> Commits updates to the cloud database
 * - POST /api/auth/login -> Cloud authentication
 * - GET  /api/health     -> Cloud ping & latency check
 * 
 * To run with Node.js:
 *   node server/index.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, 'cloud_database.json');

// In-memory or file-backed database storage
let databaseState = null;

function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      databaseState = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      console.log('Loaded existing cloud database from', DB_FILE);
      return;
    } catch (e) {
      console.warn('Failed to parse database file, reinitializing...');
    }
  }
  databaseState = {
    appTitle: "ITRS Hub Cloud Workspace",
    admins: [
      { username: "superadmin", password: "admin", role: "superadmin", status: "active", displayName: "System Superadmin" },
      { username: "admin", password: "admin1234", role: "admin", status: "active", displayName: "IT Administrator" },
      { username: "staff", password: "staff1234", role: "staff", status: "active", displayName: "IT Support Specialist" },
      { username: "viewer", password: "viewer1234", role: "viewer", status: "active", displayName: "Guest Technician" }
    ],
    categories: [],
    userTasks: {},
    notifications: [],
    auditLogs: [],
    credentials: [],
    branding: {}
  };
  saveDatabase();
}

function saveDatabase() {
  fs.writeFileSync(DB_FILE, JSON.stringify(databaseState, null, 2), 'utf8');
}

loadDatabase();

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (url.pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }

  // Get full hub data
  if (url.pathname === '/api/hub/data' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(databaseState));
    return;
  }

  // Sync data updates
  if (url.pathname === '/api/hub/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        const userId = req.headers['x-user-id'] || 'anonymous';
        databaseState = { ...databaseState, ...updates };
        saveDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, updatedBy: userId, time: new Date().toISOString() }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Auth login
  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { username, password } = JSON.parse(body);
        const user = databaseState.admins.find(a => 
          a.username.toLowerCase() === (username || '').trim().toLowerCase() && 
          a.password === password
        );
        if (user && user.status !== 'inactive') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(user));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid credentials or inactive account' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad Request' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`ITRS Hub Cloud Database Server running at http://localhost:${PORT}`);
});
