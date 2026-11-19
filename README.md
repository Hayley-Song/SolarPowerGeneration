# 태양광 발전 수익 시뮬레이터 — 통합 정리본

GitHub main 다운로드본(bda7bfb1a7f610417ef4d19ee694f98129065842)을 기준으로 정리했습니다. 기존 수익 계산, 그래프, 브이월드 지도 및 PDF 보고서는 유지하고, Upstash 임시 URL 접근제어를 통합했습니다.

## 변경 사항

- 프로젝트 루트에 잘못 올라간 동일 파일 29개 삭제. 실제 소스는 `src`, `public`, `server`, `api`, `tests`에 유지.
- `download`(중복 ignore 내용) 삭제, `env.example`을 `.env.example`으로 복원, 깨진 README 파일명 복원.
- `middleware.ts`, `lib/trials.ts`, `api/admin/trials.ts` 유지. 기존 Redis 키 `trial:<SHA256(token)>`, 레코드, 관리자 인증 및 URL 형식 유지.
- `@upstash/redis`, `@vercel/functions`, `@vercel/node` 의존성 복구.
- 주소 API를 `api/site-area.ts`로 변경하고 Vercel 함수 설정도 일치시킴. 요청 URL은 여전히 `/api/site-area`.
- Vercel 주소 API는 임시 URL의 토큰을 Authorization 헤더로 받아 Redis에서 유효기간을 검증. 유효하지 않은 요청은 VWorld에 전달하지 않음.
- 로컬 `pnpm dev`는 기존 Vite 미들웨어를 사용해 토큰 없이 테스트 가능. 실제 Vercel 배포에는 접근제어가 적용됨.
- 토큰이 지도 이미지 요청의 Referer에 포함되지 않도록 `strict-origin` 정책 적용. 임시 URL HTML에는 캐시 방지 헤더 설정.

## 1. 로컬 실행 (Windows PowerShell)

Node.js 22 최신 패치(22.12 이상), pnpm이 필요합니다. 압축을 해제하고 `package.json`이 있는 폴더에서 실행합니다.

```powershell
pnpm install --no-frozen-lockfile
pnpm test
pnpm build
Copy-Item .env.example .env.local
notepad .env.local
pnpm dev
```

이미 `.env.local`이 있으면 덮어쓰지 않습니다. 브이월드 키를 입력해야 주소 조회가 가능합니다. 로컬 Vite 실행에서는 Upstash 관리자 API와 임시 URL 검증을 테스트하지 않습니다.

**lockfile:** 포함된 `pnpm-lock.yaml`은 기존 프런트엔드 lockfile을 보존한 것으로, 복구한 3개 의존성이 아직 반영되지 않았습니다. 이 작업 환경에서 npm 레지스트리에 접속하지 못했으므로 위 `pnpm install --no-frozen-lockfile`을 최초 1회 반드시 실행하고 갱신된 lockfile을 커밋하세요. `vercel.json`에도 같은 설치 명령을 설정했습니다. 갱신 후에는 필요시 frozen 설치로 되돌릴 수 있습니다.

## 2. GitHub 저장소 파일 교체 (새 브랜치 권장)

새 폴더에서 기존 저장소를 clone하고 별도 브랜치에서 작업하세요. ZIP 자체를 GitHub에 올리지 않고 내부 파일을 저장소 루트에 복사합니다. `.git`은 기존 저장소의 이력이므로 삭제하면 안 됩니다.

```powershell
git clone https://github.com/Hayley-Song/SolarPowerGeneration.git SolarPowerGeneration-clean-repo
cd SolarPowerGeneration-clean-repo
git switch -c cleanup-vworld-upstash
git rm -r -- .
# 실제 압축 해제 위치에 맞게 수정 (package.json이 바로 들어 있는 폴더)
$source = "C:\실제경로\SolarPowerGeneration-clean"
Get-ChildItem -LiteralPath $source -Force | Copy-Item -Destination . -Recurse -Force
pnpm install --no-frozen-lockfile
pnpm test
pnpm build
git add -A
git status
# .env.local, 인증키, node_modules, dist 등이 staged 되지 않았는지 확인
git commit -m "Clean project structure and restore trial access"
git push -u origin cleanup-vworld-upstash
```

기존 브랜치와 Vercel 프로젝트/Upstash 데이터베이스를 삭제하지 마세요. Preview에서 테스트하고 Pull Request로 main에 병합하세요. Preview에서 접근하려면 해당 환경에 환경변수가 설정되어 있어야 하며 Vercel 배포 보호와 APP_ORIGIN 설정도 별도로 확인합니다. 기존 운영 배포는 main 병합 전까지 변경되지 않는 것이 일반적입니다(프로젝트의 배포 설정에 따름).

## 3. Vercel 설정

- Framework: Vite, Root Directory: 저장소 최상위, Build Command: `pnpm build`, Output Directory: `dist`, Node.js: 22.x
- 기존 `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `ADMIN_SECRET`, `APP_ORIGIN` 값 유지. Production/Preview의 범위 확인.
- 추가: `VWORLD_API_KEY`, `VWORLD_DOMAIN`(필요 시), `VITE_VWORLD_MAP_KEY`. 지도 키는 브라우저에 공개되므로 도메인 제한을 적용합니다. 서버용 키는 공개하지 않습니다.
- 기존 발급 URL은 Redis 데이터와 유효기간 및 도메인이 같으면 코드상 계속 호환됩니다.
- 기존 발급 경로: `POST /api/admin/trials` (관리자 Bearer 인증, company/startAt/endAt), 기존 취소 경로: `DELETE /api/admin/trials` (관리자 Bearer 인증, token).

## 4. 배포 전 테스트

1. 일반 `/`, `/index.html` 직접 접근 거부.
2. 유효한 `/trial/<token>` 접속 및 기존 계산·PDF 작동.
3. 유효 URL에서 주소 조회 및 지도 표시.
4. 인증 헤더 없는 `/api/site-area` 요청 401, 만료·삭제된 토큰 403.
5. 관리자 인증 및 신규 임시 URL 발급/취소.
6. 만료 URL 새로고침 차단.

검증 범위: Node 단위 테스트 10개 통과 및 TS 문법 검사. npm 설치, 전체 Vite 빌드, Vercel 실제 배포, 실제 Redis/VWorld 연동은 미검증입니다. 기존 계산식은 변경하지 않았습니다.

주의: 기존 접근제어는 페이지 진입 및 주소 API 요청을 검증합니다. 이미 열린 브라우저 탭에서 클라이언트 계산을 계속 하는 것을 강제로 막거나 정적 JS 번들 자체를 숨기지는 않습니다. 이런 수준까지 필요하면 별도의 서버 중심 접근제어가 필요합니다.

## 5. 관리자 웹페이지 및 QR 발급 (신규)

운영 홈페이지의 `/admin` 경로에서 `ADMIN_SECRET`으로 인증하고 업체별 접속 URL을 발급·복사하거나 QR PNG로 저장할 수 있습니다. 현재 유효하거나 시작 전인 권한의 목록 및 취소도 지원합니다. 기존 PowerShell API, Redis 저장 형식과 기존 발급 URL은 유지됩니다. 원본 URL은 발급 시에만 제공되므로 즉시 보관하세요. 환경변수와 서비스는 추가할 필요가 없습니다. 자세한 적용 방법과 검증 범위는 [관리자 페이지 안내서](README_관리자페이지.md)를 참고하세요.
