// Entry point for the no-backend mock layer.
//
// installMocks() attaches the custom axios adapter to the generated SDK client (so every
// request is served from the localStorage store, with no network), seeds the store on first
// run, and exposes window.__resetDemo() to reset the prototype to its seeded state.

import { client } from '../sdk/client.gen';
import { mockAdapter } from './adapter';
import { db } from './db';
import { MOCK_ENABLED } from './config';

export function installMocks(): void {
  if (!MOCK_ENABLED) return;

  // setConfig merges into the client's axios instance defaults → applies to all operations.
  const config = { adapter: mockAdapter };
  client.setConfig(config);

  // Initialize / seed the store eagerly so the first reads are instant.
  db.all();

  // Demo convenience: reset to the seeded state from the browser console.
  (window as unknown as { __resetDemo?: () => void }).__resetDemo = () => {
    db.reset();
    window.location.reload();
  };
}

export { db } from './db';
