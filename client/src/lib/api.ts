import { configureApi } from '@rhino-dev/rhino-react';

// Configure the Rhino client once, before render. `tenancy: 'path'` builds
// /api/{org}/{model} URLs; the org slug is resolved from the signed-in user's
// account by AppOwnerProvider (flat routes carry no :baseOwnerId segment).
configureApi({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  tenancy: 'path',
});
