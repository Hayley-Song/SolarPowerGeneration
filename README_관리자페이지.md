# 햇빛소득마을 수익 계산기 — 관리자 페이지 및 QR 코드

기준: `SolarPowerGeneration_clean_integrated.zip`. 기존 계산, 지도, PDF, 임시 URL 검증 및 Redis 레코드 형식은 유지했습니다. 관리자 화면만 별도로 추가하고 기존 발급/취소 API를 확장했습니다.

## 1. 배포 후 사용 방법

1. 브라우저에서 `https://본인-프로젝트.vercel.app/admin`에 접속합니다. (직접 주소 `/admin.html`도 동일한 로그인 화면입니다.)
2. Vercel의 환경변수 `ADMIN_SECRET`에 설정한 관리자 인증 문자열을 입력하고 인증합니다.
3. 업체명, 이용 시작일시, 종료일시를 입력합니다. **모든 입력 및 표시 시각은 한국시간(KST, UTC+09:00)** 입니다. 기본값은 지금부터 5일이며 빠른 설정 버튼으로 변경할 수 있습니다.
4. `임시 URL 발급`을 누르면 기존 `/trial/<token>` 링크와 동일한 링크가 발급되고 QR 코드가 나타납니다.
5. `복사`, `QR 이미지 저장`(PNG), `링크 열기`를 이용합니다. QR의 데이터는 발급된 URL 자체입니다. URL 또는 QR을 전달받은 사람은 허용 기간 동안 접근 가능합니다.
6. `발급 목록`에서 현재 이용 중이거나 시작 전인 업체별 권한을 확인합니다. 필요한 경우 목록을 새로고침하거나 다음 목록을 조회합니다. `취소`를 누르면 기존 URL과 QR 모두 다음 페이지 진입/서버 조회부터 차단됩니다.
7. 업무가 끝나면 로그아웃합니다. 새로고침해도 관리자 인증은 다시 필요합니다.

**원본 URL은 발급 시에만 제공됩니다.** Redis에는 기존과 동일하게 토큰의 SHA-256 해시만 키로 저장합니다. 따라서 발급 결과를 닫은 뒤에는 목록에서 원래 URL 및 QR을 다시 복구할 수 없습니다. 필요하면 기존 URL을 취소하고 재발급하세요. 만료된 레코드는 Redis TTL에 따라 삭제되며 취소된 레코드도 삭제됩니다. 목록은 영구 발급 이력이 아닙니다. QR 또는 링크는 발급 직후 안전한 곳에 저장하세요.

## 2. 변경 파일

- `public/admin.html`: 관리자 화면(계산기와 분리)
- `public/admin-assets/`: 관리자 화면 CSS/JS 및 브라우저 내부 QR 인코더. 외부 QR 생성 API, CDN, 외부 폰트 미사용. 제3자 코드 라이선스는 `public/admin-assets/qr/LICENSES.txt` 참조.
- `api/admin/trials.ts`: 기존 API 경로 유지, GET 목록 기능 및 해시 ID 취소 확장
- `server/adminTrials.js`: 서버 관리자 인증, 발급, 목록, 취소 처리
- `vercel.json`: `/admin`과 `/admin/`의 관리자 HTML 경로 연결 및 관리자 문서 보안 헤더
- `tests/admin-trials.test.js`: 신규 테스트

기존 `middleware.ts`, `lib/trials.ts`, `api/site-area.ts`, `server/trialAccess.js`, `src/` 및 `package.json`은 변경하지 않았습니다. 추가 npm 설치는 필요 없지만 기존 통합본의 lockfile에 반영되지 않은 Upstash 의존성을 설치하는 초기 절차는 그대로 필요합니다.

## 3. 기존 운영 GitHub 저장소에 반영하기

기존에 배포한 버전에서 다른 수정이 있을 수 있으므로 **전체를 무조건 덮어쓰기보다는 위 변경 파일만 반영**하는 것을 권장합니다. `public/admin-assets` 폴더는 QR 인코더까지 모두 복사해야 합니다. 특히 운영본 `vercel.json`에 이미 서울 리전(`icn1`) 또는 추가 헤더/rewrites가 있다면 해당 값을 유지하고 이번 패키지의 관리자 관련 `rewrites` 및 `headers`만 병합합니다. 기준 ZIP에는 서울 리전 변경이 들어 있지 않았으므로 자동으로 추가하지 않았습니다.

PowerShell에서 현재 운영 저장소를 최신 상태로 갱신한 다음 새 브랜치에서 작업합니다. (기존 로컬 미커밋 변경이 있다면 먼저 백업합니다.)

```powershell
git switch main
git pull origin main
git switch -c add-admin-qr
# 변경 파일 복사/병합 후
pnpm install --no-frozen-lockfile
pnpm test
pnpm build
git add public/admin.html public/admin-assets api/admin/trials.ts server/adminTrials.js vercel.json tests/admin-trials.test.js README_관리자페이지.md README.md
# lockfile이 변경된 경우 함께 등록
git add pnpm-lock.yaml
git status
git commit -m "Add web admin and QR trial links"
git push -u origin add-admin-qr
```

Preview 배포를 테스트한 후 main으로 병합합니다. Preview에서 `APP_ORIGIN`은 Preview에서 시험하려는 HTTPS 도메인(경로 없는 origin)이어야 합니다. Production Redis와 테스트 Redis를 분리하면 기존 운영 권한을 실수로 취소하는 일을 방지할 수 있습니다. 실제 운영 도메인으로 발급하려면 Production에 설정된 `APP_ORIGIN`이 운영 도메인과 일치해야 합니다.

## 4. 환경변수 / Redis

기존 설정을 그대로 사용합니다. 신규 환경변수 및 신규 데이터베이스가 필요하지 않습니다.

| 이름 | 용도 |
|---|---|
| `KV_REST_API_URL` | Upstash REST 주소 |
| `KV_REST_API_TOKEN` | Upstash 읽기/쓰기 토큰 |
| `ADMIN_SECRET` | 관리자 인증 문자열(서버 전용) |
| `APP_ORIGIN` | 발급 링크의 도메인(예: `https://example.vercel.app`) |

브이월드 설정은 별도로 기존 환경변수를 유지합니다. `ADMIN_SECRET` 등 서버 비밀값은 절대 `VITE_` 접두사를 사용하거나 GitHub에 등록하지 않습니다. 추측이 어려운 긴 무작위 문자열을 사용하고 공유가 필요한 경우 기관에서 허용하는 보안 방법으로 인계하세요.

관리자 화면 자체의 로그인 폼은 공개 경로이지만, API는 서버에서 매 요청마다 Bearer 인증을 검사합니다. 인증 문자열은 관리자 화면의 메모리에만 저장하며 localStorage/쿠키 등에 기록하지 않습니다. URL/QR은 외부 QR 서비스로 전송하지 않습니다. 개별 관리자 계정, 다중 인증(MFA), 영구 발급 로그는 이번 범위에 포함하지 않았습니다. 로그인 접근을 추가로 제한하려면 별도 인증·접근제어 설계가 필요합니다. 기존 계산기는 이미 열린 탭에서 계속 계산할 수 있다는 제한도 유지됩니다.

## 5. 호환성 및 검증

기존 PowerShell `POST /api/admin/trials` (company/startAt/endAt) 및 `DELETE /api/admin/trials` (token)는 그대로 사용 가능합니다. 추가 API `GET /api/admin/trials?cursor=0`은 인증된 관리자에게 유효/시작 전 레코드 목록과 다음 커서를 반환합니다. `DELETE`의 `id`는 목록에서 반환한 해시 ID로, 원본 URL을 Redis에 저장하지 않고도 취소할 수 있습니다. 이미 발급된 링크는 원래 유효기간/도메인/데이터가 유지되면 계속 사용 가능하며 목록에서 조회 가능합니다.

검증: 기존 및 신규 단위 테스트 16개 통과, 관리자 API 및 JS 문법 검사, QR 인코더의 테스트용 URL 2개를 이미지로 렌더링하여 디코딩 결과 일치 확인. 작업 환경에서 Chromium의 페이지 탐색이 차단되었고 npm 레지스트리도 접속되지 않아 브라우저 전체 동작, pnpm 빌드, 실제 Vercel 및 Redis 호출은 검증하지 못했습니다.

### 배포 후 확인

- `/` 및 `/index.html` 직접 접속은 계속 차단되는지 확인
- `/admin` 접속 후 잘못된 인증 문자열로 접근이 거부되는지 확인
- 정상 인증, 한국시간 시작/종료 선택, 테스트 URL 발급
- URL 복사, QR 이미지 저장, 스마트폰 QR 스캔 및 실제 접속
- 발급 목록, 기존 유효 권한 조회, 목록에서 테스트 권한 취소 및 차단 확인
- 로그아웃, 새로고침 후 재인증 요구 확인
- 기존 계산, 그래프, 브이월드 주소 조회, PDF 내보내기 검증

`pnpm dev`의 Vite 개발 서버에는 기존과 동일하게 실제 관리자 API를 연결하지 않았습니다. 관리자 HTML은 `/admin.html`로 열 수 있으나 발급 기능 테스트는 Vercel Preview 또는 Production에서 진행합니다.
