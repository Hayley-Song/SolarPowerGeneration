import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getActiveTrial } from '../lib/trials.js';
import { authorizeSiteArea } from '../server/trialAccess.js';
import { siteAreaResponse } from '../server/siteArea.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const denied = await authorizeSiteArea(req.headers.authorization, getActiveTrial);
  if (denied) return res.status(denied.status).json(denied.body);
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  const result = await siteAreaResponse(req.method, body);
  return res.status(result.status).json(result.body);
}
