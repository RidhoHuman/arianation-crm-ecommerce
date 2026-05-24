#!/usr/bin/env node

const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:3001';
const EMAIL = process.env.TEST_EMAIL || 'owner@arianation.com';
const PASSWORD = process.env.TEST_PASSWORD || 'owner123';
const TIMEOUT_MS = Number(process.env.TEST_TIMEOUT_MS || 10000);
const JSON_MODE = process.argv.includes('--json');

const state = {
  token: null,
  user: null,
  steps: [],
};

function now() {
  return Date.now();
}

function printSection(title) {
  if (!JSON_MODE) {
    console.log(`\n== ${title} ==`);
  }
}

function recordStep(name, ok, detail, startedAt) {
  const durationMs = now() - startedAt;
  state.steps.push({ name, ok, detail, durationMs });
  if (!JSON_MODE) {
    const icon = ok ? '[OK]' : '[FAIL]';
    const suffix = detail ? ` - ${detail}` : '';
    console.log(`${icon} ${name} (${durationMs}ms)${suffix}`);
  }
}

async function requestJson(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    let json = null;

    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }
    }

    return { response, json };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function assertOk(name, fn) {
  const startedAt = now();
  try {
    const detail = await fn();
    recordStep(name, true, detail, startedAt);
    return true;
  } catch (error) {
    recordStep(name, false, error.message, startedAt);
    return false;
  }
}

async function checkHealth() {
  const { response, json } = await requestJson('/api/health');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (!json?.success) {
    throw new Error('health payload missing success flag');
  }

  return `status=${response.status}`;
}

async function login() {
  const { response, json } = await requestJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!response.ok) {
    const message = json?.message || json?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  const token = json?.data?.token || json?.token;
  const user = json?.data?.user || json?.user;

  if (!token) {
    throw new Error('login response did not include a token');
  }

  state.token = token;
  state.user = user || null;

  if (user?.role && !['ADMIN', 'OWNER'].includes(user.role)) {
    throw new Error(`unexpected role ${user.role}`);
  }

  return `logged in as ${user?.email || EMAIL}${user?.role ? ` (${user.role})` : ''}`;
}

async function checkAuthContext() {
  if (!state.token) {
    throw new Error('missing token');
  }

  const { response, json } = await requestJson('/api/users/me', {
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const role = json?.data?.role;
  if (!['ADMIN', 'OWNER'].includes(role)) {
    throw new Error(`unexpected /me role ${role || 'unknown'}`);
  }

  return `me=${json?.data?.email || 'unknown'} role=${role}`;
}

async function checkAdminEndpoint(name, path, validator) {
  if (!state.token) {
    throw new Error('missing token');
  }

  const { response, json } = await requestJson(path, {
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    const message = json?.message || json?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (validator) {
    validator(json);
  }

  return `status=${response.status}`;
}

async function run() {
  printSection('Arianation Admin Smoke Test');
  if (!JSON_MODE) {
    console.log(`Backend: ${BACKEND}`);
    console.log(`User: ${EMAIL}`);
  }

  const pass = [];

  pass.push(await assertOk('Health check', checkHealth));
  pass.push(await assertOk('Login as owner/admin', login));
  pass.push(await assertOk('Verify /api/users/me', checkAuthContext));
  pass.push(
    await assertOk('Admin dashboard', () =>
      checkAdminEndpoint('Admin dashboard', '/api/admin/dashboard', (json) => {
        if (!json?.data?.orders || !json?.data?.revenue) {
          throw new Error('dashboard payload missing expected sections');
        }
      })
    )
  );
  pass.push(
    await assertOk('Admin products', () =>
      checkAdminEndpoint('Admin products', '/api/admin/products?limit=1', (json) => {
        if (!Array.isArray(json?.data)) {
          throw new Error('products payload missing array data');
        }
      })
    )
  );
  pass.push(
    await assertOk('Admin orders', () =>
      checkAdminEndpoint('Admin orders', '/api/admin/orders?limit=1', (json) => {
        if (!Array.isArray(json?.data)) {
          throw new Error('orders payload missing array data');
        }
      })
    )
  );
  pass.push(
    await assertOk('Admin design requests', () =>
      checkAdminEndpoint('Admin design requests', '/api/admin/design-requests?limit=1', (json) => {
        if (!Array.isArray(json?.data)) {
          throw new Error('design requests payload missing array data');
        }
      })
    )
  );
  pass.push(
    await assertOk('Admin users', () =>
      checkAdminEndpoint('Admin users', '/api/admin/users?limit=1', (json) => {
        if (!Array.isArray(json?.data)) {
          throw new Error('users payload missing array data');
        }
      })
    )
  );
  pass.push(
    await assertOk('Admin payments', () =>
      checkAdminEndpoint('Admin payments', '/api/admin/payments?limit=1', (json) => {
        if (!Array.isArray(json?.data)) {
          throw new Error('payments payload missing array data');
        }
      })
    )
  );
  pass.push(
    await assertOk('Admin analytics', () =>
      checkAdminEndpoint('Admin analytics', '/api/admin/analytics/sales?days=7', (json) => {
        if (!json?.data?.summary) {
          throw new Error('analytics payload missing summary');
        }
      })
    )
  );
  pass.push(
    await assertOk('Admin audit logs', () =>
      checkAdminEndpoint('Admin audit logs', '/api/admin/audit-logs?limit=1', (json) => {
        if (!Array.isArray(json?.data)) {
          throw new Error('audit logs payload missing array data');
        }
      })
    )
  );

  printSection('Summary');
  const passed = state.steps.filter((step) => step.ok).length;
  const failed = state.steps.length - passed;

  if (JSON_MODE) {
    console.log(
      JSON.stringify(
        {
          ok: failed === 0,
          backend: BACKEND,
          user: EMAIL,
          passed,
          failed,
          steps: state.steps,
        },
        null,
        2
      )
    );
  } else {
    for (const step of state.steps) {
      console.log(`${step.ok ? '[OK]' : '[FAIL]'} ${step.name} - ${step.durationMs}ms${step.detail ? ` - ${step.detail}` : ''}`);
    }

    console.log(`\nResult: ${passed} passed, ${failed} failed`);
  }

  if (failed > 0) {
    process.exitCode = 1;
    return;
  }

  process.exitCode = 0;
}

run().catch((error) => {
  console.error('[FATAL]', error);
  process.exitCode = 1;
});
