
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";

export type TrialRecord = {
  company: string;
  startAt: string;
  endAt: string;
};

// Redis 클라이언트는 필요할 때 생성합니다.
let redisClient: Redis | undefined;

export function getRedis(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error("Redis 환경변수가 설정되지 않았습니다.");
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

// 원본 토큰 대신 해시를 Redis 키로 사용합니다.
export function tokenKey(token: string): string {
  const hash = createHash("sha256")
    .update(token)
    .digest("hex");

  return `trial:${hash}`;
}

// 현재 시각 기준으로 유효한 업체 권한을 조회합니다.
export async function getActiveTrial(
  token: string
): Promise<TrialRecord | null> {
  const raw = await getRedis().get<unknown>(tokenKey(token));

  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Partial<TrialRecord>;

  if (
    typeof record.company !== "string" ||
    typeof record.startAt !== "string" ||
    typeof record.endAt !== "string"
  ) {
    return null;
  }

  const start = Date.parse(record.startAt);
  const end = Date.parse(record.endAt);
  const now = Date.now();

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start >= end ||
    now < start ||
    now >= end
  ) {
    return null;
  }

  return {
    company: record.company,
    startAt: record.startAt,
    endAt: record.endAt,
  };
}
