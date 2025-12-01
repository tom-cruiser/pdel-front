// Supabase removed: rely on backend dev token or `VITE_API_BASE`.

export async function apiFetch(path: string, opts: RequestInit = {}) {
  // Default to `/api` so calls like `apiPost('/messages')` target `/api/messages`
  // which is proxied by Vite to the backend during development. If you need
  // a different base, set `VITE_API_BASE` in your environment.
  // Determine API base URL:
  // - Use `VITE_API_BASE` when provided (recommended for deploys)
  // - Fallback to `/api` for local dev (Vite proxy)
  // - If running in production (not localhost) and no VITE_API_BASE set,
  //   default to the hosted backend URL so the frontend still talks to the right server.
  let base = import.meta.env.VITE_API_BASE ?? '/api';
  try {
    if (base === '/api' && typeof window !== 'undefined') {
      const host = window.location.hostname || '';
      const isLocal = host.includes('localhost') || host.startsWith('127.') || host === '';
      if (!isLocal) {
        // Replace with your production backend URL
        base = 'https://pdel-backend.onrender.com/api';
      }
    }
  } catch (e) {
    // ignore and use default
  }
  const url = base + path;
  // Normalize headers to a Headers object so casing and input types are handled
  const hdrs = new Headers(opts.headers as any || {});
  // If body is FormData, do not set a default Content-Type so the browser
  // can add the multipart boundary. Otherwise default to JSON.
  const isFormData = typeof (opts as any).body !== 'undefined' && (opts as any).body instanceof FormData;
  if (!isFormData && !hdrs.get('content-type')) hdrs.set('Content-Type', 'application/json');

  // Attach Authorization header from developer token (format: "dev:<userId>").
  // The app uses backend-issued dev tokens for auth (no Supabase in production).
  try {
    const dev = (typeof window !== 'undefined') ? localStorage.getItem('dev_token') : null;
    if (dev && !hdrs.get('authorization')) hdrs.set('Authorization', `Bearer ${dev}`);
  } catch (e) {
    // ignore localStorage failures
  }

  // Debug-only: allow forcing the Authorization header from localStorage.dev_token
  // Set `localStorage.setItem('force_dev_auth','true')` in the browser to enable.
  if (import.meta.env.DEV) {
    try {
      const force = localStorage.getItem('force_dev_auth');
      const devToken = localStorage.getItem('dev_token');
      if (force === 'true' && devToken) {
        hdrs.set('Authorization', `Bearer ${devToken}`);
        // eslint-disable-next-line no-console
        console.debug('[api] DEV: forced Authorization header from localStorage.dev_token');
      }
    } catch (e) {
      // ignore
    }
  }
  // Dev-only: print outgoing headers (masked) to aid debugging
  try {
    if (import.meta.env.DEV) {
      const out: Record<string,string|null> = {};
      hdrs.forEach((v, k) => {
        if (k.toLowerCase() === 'authorization') {
          const token = v ? (v.startsWith('Bearer ') ? v.substring(7) : v) : '';
          out[k] = token ? (token.length > 8 ? token.substring(0,8) + '...' : token) : null;
        } else {
          out[k] = v;
        }
      });
      // eslint-disable-next-line no-console
      console.debug('[api] outgoing headers (masked):', out);
    }
  } catch (e) {}

  const res = await fetch(url, {
    ...opts,
    headers: hdrs,
    credentials: 'include',
  });
  // Debug: report whether an Authorization header will be sent (avoids logging tokens)
  try {
    const method = (opts.method || 'GET').toUpperCase();
    const authVal = hdrs.get('authorization');
    const hasAuth = !!authVal;
    let sample = null;
    if (hasAuth) {
      try {
        const raw = (authVal as string) || '';
        const token = raw.startsWith('Bearer ') ? raw.substring(7) : raw;
        sample = token ? (token.length > 8 ? token.substring(0, 8) + '...' : token) : null;
      } catch (e) {
        sample = null;
      }
    }
    // eslint-disable-next-line no-console
    console.debug(`[api] ${method} ${url} - Authorization present: ${hasAuth}` + (sample ? ` (token sample: ${sample})` : ''));
  } catch (e) {
    // ignore debug errors
  }
  // Broadcast an event for the UI when requests are unauthorized so the app
  // can show a clearer message and help the developer open the dev-token input.
  if (typeof window !== 'undefined' && res && res.status === 401) {
    try {
      window.dispatchEvent(new CustomEvent('api:unauthorized', { detail: { path } }));
    } catch (e) {
      // ignore environment issues
    }
  }

  return res;
}

export function apiGet(path: string) {
  return apiFetch(path, { method: 'GET' });
}

export function apiPost(path: string, body: any) {
  return apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPut(path: string, body: any) {
  return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function apiDelete(path: string) {
  return apiFetch(path, { method: 'DELETE' });
}
