import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeSiteArea } from '../server/trialAccess.js';
const token = 'A'.repeat(43);
test('토큰이 없거나 잘못된 경우 조회 차단', async () => {
  const verify = () => { throw new Error('호출되지 않아야 함'); };
  for (const input of [undefined, '', 'Bearer bad', [token]]) assert.equal((await authorizeSiteArea(input, verify)).status, 401);
});
test('유효한 토큰만 조회 허용', async () => {
  assert.equal(await authorizeSiteArea(`Bearer ${token}`, async t => {assert.equal(t,token); return {company:'test'};}), null);
});
test('만료 또는 삭제된 토큰 및 Redis 장애 차단', async () => {
  assert.equal((await authorizeSiteArea(`Bearer ${token}`, async () => null)).status, 403);
  assert.equal((await authorizeSiteArea(`Bearer ${token}`, async () => {throw Error('offline');})).status, 503);
});
