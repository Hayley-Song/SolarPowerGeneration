
import { rewrite } from "@vercel/functions";

export const config = {
  runtime: "nodejs",
  matcher: ["/", "/index.html", "/trial/:path*"],
};

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

  // 일반 주소와 index.html 직접 접속은 차단합니다.
  if (
    url.pathname === "/" ||
    url.pathname === "/index.html"
  ) {
    return denyAccess();
  }

  const match = url.pathname.match(
    /^\/trial\/([A-Za-z0-9_-]{43})\/?$/
  );

  if (!match) {
    return denyAccess();
  }

  try {
    // 실제 임시 URL을 검사할 때만 Redis 관련 코드를 로드합니다.
    const { getActiveTrial } = await import("./lib/trials.js");

    const trial = await getActiveTrial(match[1]);

    if (!trial) {
      return denyAccess(
        403,
        "접근 권한이 없거나 이용 기간이 종료되었습니다."
      );
    }

    // 유효한 URL에서만 React 앱을 제공합니다.
    return rewrite(new URL("/index.html", request.url));
  } catch (error) {
    console.error("Trial access verification failed:", error);

    return denyAccess(
      503,
      "접근 권한 확인에 실패했습니다. 잠시 후 다시 시도하세요."
    );
  }
}
