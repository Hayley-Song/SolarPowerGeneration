
import { next, rewrite } from "@vercel/functions";
import { getActiveTrial } from "./lib/trials";

export const config = {
  runtime: "nodejs",
};

// randomBytes(32).toString("base64url")로 생성한
// 43자리 토큰만 허용합니다.
const TRIAL_PATH = /^\/trial\/([A-Za-z0-9_-]{43})\/?$/;

// Vite 정적 리소스는 페이지 접근 제어와 분리합니다.
// .html은 의도적으로 제외하여 /index.html 직접 접속을 차단합니다.
const STATIC_ASSET_PATH =
  /\.(?:avif|css|eot|gif|ico|jpe?g|js|json|mjs|otf|png|svg|ttf|wasm|webmanifest|webp|woff2?)$/i;

function denyAccess(
  status = 404,
  message = "페이지를 찾을 수 없습니다."
): Response {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export default async function middleware(
  request: Request
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 관리자 API는 해당 API 내부에서 인증합니다.
  // 다른 API 경로는 별도 인증 없이 통과시키지 않습니다.
  if (/^\/api\/admin\/trials\/?$/.test(pathname)) {
    return next();
  }

  if (pathname.startsWith("/api/")) {
    return denyAccess();
  }

  // JS, CSS, 이미지 등의 정적 파일은 정상적으로 제공합니다.
  // 단, index.html과 같은 HTML 파일은 여기에 포함되지 않습니다.
  if (STATIC_ASSET_PATH.test(pathname)) {
    return next();
  }

  // 유효한 형식의 임시 URL인지 확인합니다.
  const match = pathname.match(TRIAL_PATH);

  if (!match) {
    return denyAccess();
  }

  const token = match[1];

  try {
    const trial = await getActiveTrial(token);

    // 등록되지 않았거나 아직 시작 전이거나 만료된 URL
    if (!trial) {
      return denyAccess(
        403,
        "접근 권한이 없거나 이용 기간이 종료되었습니다."
      );
    }

    // 주소창의 임시 URL은 유지하면서 React 앱을 제공합니다.
    // 쿼리 문자열은 전달하지 않습니다.
    return rewrite(new URL("/index.html", request.url));
  } catch (error) {
    console.error("Trial access verification failed:", error);

    // Redis 장애 시 접근을 허용하지 않습니다.
    return denyAccess(
      503,
      "접근 권한 확인에 실패했습니다. 잠시 후 다시 시도하세요."
    );
  }
}
