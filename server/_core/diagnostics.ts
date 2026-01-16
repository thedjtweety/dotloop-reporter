/**
 * Diagnostic endpoints for debugging OAuth configuration
 */

import { Express, Request, Response } from 'express';

export function setupDiagnostics(app: Express) {
  // Diagnostic endpoint to check OAuth configuration
  app.get('/api/diagnostics/oauth-config', (req: Request, res: Response) => {
    const config = {
      DOTLOOP_CLIENT_ID: process.env.DOTLOOP_CLIENT_ID ? '***' + process.env.DOTLOOP_CLIENT_ID.slice(-4) : 'NOT SET',
      DOTLOOP_CLIENT_SECRET: process.env.DOTLOOP_CLIENT_SECRET ? 'SET (hidden)' : 'NOT SET',
      DOTLOOP_REDIRECT_URI: process.env.DOTLOOP_REDIRECT_URI || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      requestUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      requestHost: req.get('host'),
    };

    res.json(config);
  });
}
