import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const ID = /^[a-f0-9]{64}$/;
const PREFIX = 'trial:';
const digest = value => createHash('sha256').update(value).digest();
export function isAdmin(authorization, secret) {
  return typeof secret === 'string' && secret.length > 0 &&
    typeof authorization === 'string' &&
    timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`));
}
function parseBody(body) {
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return null; } }
  return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
}
const hasTimezone = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
function getOrigin(value) {
  try {
    const origin = new URL(value);
    if (origin.protocol === 'https:' && origin.pathname === '/' && !origin.search && !origin.hash && !origin.username && !origin.password) return origin.origin;
  } catch { /* invalid configuration */ }
  return null;
}
function publicRecord(key, record, now) {
  if (!record || typeof record.company !== 'string' || typeof record.startAt !== 'string' || typeof record.endAt !== 'string') return null;
  const start = Date.parse(record.startAt), end = Date.parse(record.endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end || end <= now) return null;
  return {id:key.slice(PREFIX.length), company:record.company, startAt:record.startAt, endAt:record.endAt, status:now < start ? 'scheduled' : 'active'};
}
// Dependency injection allows testing without real Redis or secrets.
export async function adminTrialResponse(req, {getRedis, tokenKey, env = process.env, now = Date.now, makeToken = () => randomBytes(32).toString('base64url')}) {
  const reply = (status, body) => ({status, body});
  if (!isAdmin(req.headers?.authorization, env.ADMIN_SECRET)) return reply(401, {error:'관리자 인증에 실패했습니다.'});
  if (!['GET','POST','DELETE'].includes(req.method)) return reply(405, {error:'지원하지 않는 요청 방식입니다.'});
  try {
    const redis = getRedis();
    const body = parseBody(req.body);
    if (req.method === 'GET') {
      const cursor = req.query?.cursor ?? '0';
      if (typeof cursor !== 'string' || !/^\d{1,20}$/.test(cursor)) return reply(400, {error:'목록 조회 위치가 올바르지 않습니다.'});
      const [nextCursor, keys] = await redis.scan(cursor, {match:'trial:*', count:50});
      const valid = [...new Set(keys)].filter(key => key.startsWith(PREFIX) && ID.test(key.slice(PREFIX.length)));
      const trials = [];
      // SCAN count is a hint. Batch reads to avoid unbounded parallel requests.
      for (let i=0; i<valid.length; i+=50) {
        const batch = valid.slice(i,i+50);
        const records = await redis.mget(...batch);
        batch.forEach((key,j) => {const record=publicRecord(key,records[j],now()); if(record) trials.push(record);});
      }
      trials.sort((a,b) => Date.parse(a.endAt)-Date.parse(b.endAt));
      return reply(200, {trials, nextCursor:String(nextCursor)});
    }
    if (req.method === 'POST') {
      if (!body) return reply(400,{error:'JSON 요청 본문이 필요합니다.'});
      const company = typeof body.company === 'string' ? body.company.trim() : '';
      const {startAt:startInput, endAt:endInput} = body;
      if (!company || company.length>120 || !hasTimezone(startInput) || !hasTimezone(endInput)) return reply(400,{error:'업체명과 시간대가 포함된 날짜를 입력하세요.'});
      const startMs=Date.parse(startInput), endMs=Date.parse(endInput);
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs>=endMs || endMs<=now()) return reply(400,{error:'이용 기간이 올바르지 않습니다.'});
      if (!env.APP_ORIGIN) return reply(500,{error:'APP_ORIGIN 환경변수가 설정되지 않았습니다.'});
      const origin=getOrigin(env.APP_ORIGIN);
      if (!origin) return reply(500,{error:'APP_ORIGIN에는 경로가 없는 HTTPS 주소를 입력하세요.'});
      const token=makeToken();
      const startAt=new Date(startMs).toISOString(), endAt=new Date(endMs).toISOString();
      const ttlSeconds=Math.ceil((endMs-now())/1000);
      if(ttlSeconds<=0) return reply(400,{error:'이용 종료 시간이 지났습니다.'});
      await redis.set(tokenKey(token),{company,startAt,endAt},{ex:ttlSeconds});
      return reply(201,{company,startAt,endAt,url:`${origin}/trial/${token}`});
    }
    // Backwards compatible token cancellation, or cancellation by hashed ID from the list.
    const token=body?.token, id=body?.id;
    let key;
    if (typeof token==='string' && TOKEN.test(token) && id===undefined) key=tokenKey(token);
    else if (typeof id==='string' && ID.test(id) && token===undefined) key=PREFIX+id;
    else return reply(400,{error:'유효한 URL 토큰 또는 발급 ID가 필요합니다.'});
    const deleted=await redis.del(key);
    return reply(200,{message:deleted ? '이용 권한을 취소했습니다.' : '이미 만료되었거나 취소된 이용 권한입니다.'});
  } catch {
    // Do not log headers, tokens, or URLs from upstream errors.
    console.error('Trial administration failed');
    return reply(500,{error:'처리 중 오류가 발생했습니다. Redis 설정 및 연결 상태를 확인하세요.'});
  }
}
