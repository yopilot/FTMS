// Small fetch wrapper: timeout, JSON parsing, readable errors, abort support.

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function getJSON(url, { signal, timeout = 15000, headers } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException('Request timed out', 'TimeoutError')), timeout);
  const onAbort = () => ctrl.abort(signal.reason);
  if (signal) {
    if (signal.aborted) ctrl.abort(signal.reason);
    else signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
    if (!res.ok) throw new ApiError(`Request failed (${res.status})`, res.status);
    return await res.json();
  } catch (err) {
    if (err?.name === 'TimeoutError') throw new ApiError('The data source took too long to respond.', 0);
    if (err instanceof ApiError || err?.name === 'AbortError') throw err;
    throw new ApiError(navigator.onLine === false ? 'You appear to be offline.' : 'Could not reach the data source.', 0);
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}
