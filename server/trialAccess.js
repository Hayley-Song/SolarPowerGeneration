const TOKEN = /^[A-Za-z0-9_-]{43}$/;
export async function authorizeSiteArea(header, verify) {
  const match = typeof header === 'string' && /^Bearer ([A-Za-z0-9_-]{43})$/.exec(header);
  if (!match || !TOKEN.test(match[1])) return {status: 401, body: {error: '유효한 임시 URL로 접속해 주세요.'}};
  try {
    if (!(await verify(match[1]))) return {status: 403, body: {error: '접근 권한이 없거나 이용 기간이 종료되었습니다.'}};
    return null;
  } catch {
    return {status: 503, body: {error: '접근 권한 확인에 실패했습니다. 잠시 후 다시 시도하세요.'}};
  }
}
