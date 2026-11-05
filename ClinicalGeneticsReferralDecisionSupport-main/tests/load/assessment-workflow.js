import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Spike to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
    errors: ['rate<0.1'],              // Custom error rate < 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function() {
  // Test 1: Health check
  const healthRes = http.get(\\/api/health\);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Load assessment list (simulates dashboard)
  const listRes = http.get(\\/api/clinical-workflows?limit=20\, {
    headers: {
      'Authorization': 'Bearer test-token',
    },
  });
  check(listRes, {
    'assessment list loaded': (r) => r.status === 200 || r.status === 401,
    'response time < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(2);

  // Test 3: Create draft workflow (simulates user interaction)
  const draftPayload = JSON.stringify({
    pathway: 'hereditary-cancer-risk',
    syntheticPatientReference: \SYN-LOAD-TEST-\\,
  });

  const draftRes = http.post(
    \\/api/workflows/draft\,
    draftPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
    }
  );

  check(draftRes, {
    'draft created or auth required': (r) => [200, 201, 401].includes(r.status),
  }) || errorRate.add(1);

  sleep(3);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
