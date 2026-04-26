const http = require('http');

const API_BASE = 'http://localhost:3001/api';
const AUTH_EMAIL = 'admin@seahawk.com';
const AUTH_PASS = 'Admin@12345';

async function request(method, path, body, token) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const url = `${API_BASE}${path}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const latency = Date.now() - start;
                resolve({ status: res.statusCode, data: JSON.parse(data || '{}'), latency });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runProof() {
    console.log('--- STARTING 3-ROUND PERFORMANCE PROOF ---');
    console.log('Environment: PERF_PROOF_MODE=true\n');

    // Step 1: Login
    console.log('Logging in...');
    const loginRes = await request('POST', '/auth/login', { email: AUTH_EMAIL, password: AUTH_PASS });
    const token = loginRes.data.data.accessToken;
    if (!token) {
        console.error('Login failed!', loginRes);
        process.exit(1);
    }
    console.log('Login successful.\n');

    const rounds = 3;
    const results = [];

    for (let r = 1; r <= rounds; r++) {
        console.log(`ROUND ${r}:`);
        
        // 1. Dashboard Stats
        const dashRes = await request('GET', '/shipments/stats/today', null, token);
        console.log(`  - Dashboard: ${dashRes.latency}ms (Status: ${dashRes.status})`);

        // 2. Import (Mock payload)
        const importPayload = {
            clientCode: 'SEA HAWK',
            shipments: [
                { awb: `PERFTEST${r}1`, courier: 'Trackon', consignee: 'Test', destination: 'Delhi', weight: 1.0 },
                { awb: `PERFTEST${r}2`, courier: 'DTDC', consignee: 'Test', destination: 'Mumbai', weight: 0.5 }
            ]
        };
        const importRes = await request('POST', '/shipments/import', importPayload, token);
        console.log(`  - Import:    ${importRes.latency}ms (Status: ${importRes.status})`);

        // 3. Tracking Refresh (Mock AWB)
        const trackRes = await request('POST', '/tracking/500602752638/sync', null, token);
        console.log(`  - Tracking:  ${trackRes.latency}ms (Status: ${trackRes.status})`);

        results.push({ round: r, dash: dashRes.latency, import: importRes.latency, track: trackRes.latency });
        console.log('');
    }

    console.log('--- SUMMARY ---');
    console.log('Round | Dash | Import | Track');
    results.forEach(res => {
        console.log(`${res.round}     | ${res.dash}ms | ${res.import}ms | ${res.track}ms`);
    });
}

runProof().catch(console.error);
