import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis, tokenKey } from '../../lib/trials.js';
import { adminTrialResponse } from '../../server/adminTrials.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const result = await adminTrialResponse(req, {getRedis, tokenKey});
  if (result.status === 405) res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(result.status).json(result.body);
}
