import { Client } from '@microsoft/microsoft-graph-client';

export function getGraphClient() {
  const token = (process.env as any).GRAPH_ACCESS_TOKEN;
  if (!token) return null;

  return Client.init({
    authProvider: done => done(null, token)
  });
}
