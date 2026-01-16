/**
 * Dotloop API Proxy
 * 
 * Proxies requests from frontend to Dotloop API to avoid CORS issues
 * and keep access tokens secure
 */

import express from 'express';

const router = express.Router();

const DOTLOOP_API_BASE = 'https://api-gateway.dotloop.com/public/v2';

/**
 * Proxy GET requests to Dotloop API
 */
router.get('/api/dotloop-proxy/*', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No access token provided' });
    }
    
    // Extract the path after /api/dotloop-proxy/
    const dotloopPath = req.path.replace('/api/dotloop-proxy', '');
    const dotloopUrl = `${DOTLOOP_API_BASE}${dotloopPath}`;
    
    console.log('[Dotloop Proxy] GET', dotloopUrl);
    
    const response = await fetch(dotloopUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Dotloop Proxy] Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Dotloop API error',
        details: errorText 
      });
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('[Dotloop Proxy] Exception:', error);
    res.status(500).json({ 
      error: 'Proxy error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Proxy POST requests to Dotloop API
 */
router.post('/api/dotloop-proxy/*', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No access token provided' });
    }
    
    const dotloopPath = req.path.replace('/api/dotloop-proxy', '');
    const dotloopUrl = `${DOTLOOP_API_BASE}${dotloopPath}`;
    
    console.log('[Dotloop Proxy] POST', dotloopUrl);
    
    const response = await fetch(dotloopUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Dotloop Proxy] Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Dotloop API error',
        details: errorText 
      });
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('[Dotloop Proxy] Exception:', error);
    res.status(500).json({ 
      error: 'Proxy error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Revoke Dotloop OAuth token
 * POST /api/dotloop-proxy/revoke
 * Body: { token: string }
 */
router.post('/api/dotloop-proxy/revoke', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }
    
    console.log('[Dotloop Proxy] Revoking token...');
    
    // Call Dotloop's token revocation endpoint
    const response = await fetch('https://auth.dotloop.com/oauth/token/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Dotloop Proxy] Revocation failed:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Token revocation failed',
        details: errorText 
      });
    }
    
    console.log('[Dotloop Proxy] Token revoked successfully');
    res.json({ success: true, message: 'Token revoked successfully' });
    
  } catch (error) {
    console.error('[Dotloop Proxy] Revocation exception:', error);
    res.status(500).json({ 
      error: 'Revocation error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
