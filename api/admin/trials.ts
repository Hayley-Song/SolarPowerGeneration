import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import { randomBytes } from "node:crypto";
import { getRedis, tokenKey } from "../../lib/trials.js";

function parseBody(
  body: unknown
): Record<string, unknown> | null {
  let value = body;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

function hasTimezone(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(
    value
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("Cache-Control", "no-store");

  const adminSecret = process.env.ADMIN_SECRET;

  if (
    !adminSecret ||
    req.headers.authorization !== `Bearer ${adminSecret}`
  ) {
    return res.status(401).json({
      error: "관리자 인증에 실패했습니다.",
    });
  }

  try {
    const redis = getRedis();
    const body = parseBody(req.body);

    if (req.method === "POST") {
      if (!body) {
        return res.status(400).json({
          error: "JSON 요청 본문이 필요합니다.",
        });
      }

      const company =
        typeof body.company === "string"
          ? body.company.trim()
          : "";

      const startInput =
        typeof body.startAt === "string" ? body.startAt : "";

      const endInput =
        typeof body.endAt === "string" ? body.endAt : "";

      if (
        !company ||
        company.length > 120 ||
        !hasTimezone(startInput) ||
        !hasTimezone(endInput)
      ) {
        return res.status(400).json({
          error: "업체명과 시간대가 포함된 날짜를 입력하세요.",
        });
      }

      const startMs = Date.parse(startInput);
      const endMs = Date.parse(endInput);
      const now = Date.now();

      if (
        !Number.isFinite(startMs) ||
        !Number.isFinite(endMs) ||
        startMs >= endMs ||
        endMs <= now
      ) {
        return res.status(400).json({
          error: "이용 기간이 올바르지 않습니다.",
        });
      }

      const originValue = process.env.APP_ORIGIN;

      if (!originValue) {
        return res.status(500).json({
          error: "APP_ORIGIN 환경변수가 설정되지 않았습니다.",
        });
      }

      let origin: URL;

      try {
        origin = new URL(originValue);
      } catch {
        return res.status(500).json({
          error: "APP_ORIGIN 주소가 올바르지 않습니다.",
        });
      }

      if (
        origin.protocol !== "https:" ||
        origin.pathname !== "/" ||
        origin.search ||
        origin.hash ||
        origin.username ||
        origin.password
      ) {
        return res.status(500).json({
          error: "APP_ORIGIN에는 경로가 없는 HTTPS 주소를 입력하세요.",
        });
      }

      const token = randomBytes(32).toString("base64url");

      const startAt = new Date(startMs).toISOString();
      const endAt = new Date(endMs).toISOString();

      const ttlSeconds = Math.ceil(
        (endMs - Date.now()) / 1000
      );

      await redis.set(
        tokenKey(token),
        { company, startAt, endAt },
        { ex: ttlSeconds }
      );

      return res.status(201).json({
        company,
        startAt,
        endAt,
        url: `${origin.origin}/trial/${token}`,
      });
    }

    if (req.method === "DELETE") {
      const token =
        typeof body?.token === "string" ? body.token : "";

      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
        return res.status(400).json({
          error: "유효한 URL 토큰이 필요합니다.",
        });
      }

      await redis.del(tokenKey(token));

      return res.status(200).json({
        message: "이용 권한을 취소했습니다.",
      });
    }

    res.setHeader("Allow", "POST, DELETE");

    return res.status(405).json({
      error: "지원하지 않는 요청 방식입니다.",
    });
  } catch (error) {
    console.error("Trial administration failed:", error);

    return res.status(500).json({
      error: "처리 중 오류가 발생했습니다.",
    });
  }
}