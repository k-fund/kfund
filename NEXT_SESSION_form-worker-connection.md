# 세션 핸드오프: K-자금컴퍼니 폼 연결 & Worker 배포

**프로젝트**: 15.26_1th_kimeunhee_kmoney
**경로**: F:\pola_homepage\15.26_1th_kimeunhee_kmoney
**날짜**: 2026-02-13 (세션3)
**세션 요약**: 텍스트 리라이팅 완료 → 입력폼-Worker 연결 착수 (미완)

## 복사해서 사용:
```
K-자금컴퍼니 홈페이지 작업 이어서 진행.
NEXT_SESSION_form-worker-connection.md 파일에 상세 컨텍스트 있음.
```

## 완료된 작업 (세션1~2)
- ✅ ibn 원본 → K-자금컴퍼니 브랜드 치환 (23개 HTML)
- ✅ CSS Navy Blue 테마 전환
- ✅ 헤더 로고 축소 + 브랜드명 텍스트 추가 (14개 HTML)
- ✅ JJK 파트너십 로고 복원
- ✅ IBN Worker API 완전 분리 (빈 문자열로)
- ✅ CEO 섹션 리디자인 (기업심사관 김은희)
- ✅ 개발서버 포트 3000→5000

## 완료된 작업 (세션3)
- ✅ **7개 HTML 본문 텍스트 리라이팅** (IBN 원본과 완전 다른 표현, 글자수 유지)
  - index.html: 히어로/프로세스/서비스탭/신뢰지표/리뷰/공지
  - about.html: 히어로/4단계/CEO인사말/전문가소개
  - service.html: 히어로/전문가네트워크 4카드/CTA
  - fund.html: 히어로/성공전략/자금탭4개/승인사례3개/통계
  - process.html: 히어로/서비스특징6개/FAQ6개/CTA
  - marketing.html: 히어로/마케팅서비스6개/통합마케팅/통계
  - post.html: 에러메시지/CTA/관련소식
- ✅ **.env 파일 생성** - 모든 API 크레덴셜 저장 완료
- ✅ **텔레그램 봇 정보 저장**

## 🔴 다음 세션 핵심 작업: 입력폼 → Worker 연결

### 현재 상태
- 프론트엔드 폼은 완성 상태 (index.html L3384~3830)
- `WORKER_URL = ''` 빈 문자열 → Worker 배포 후 연결 필요
- IBN Worker 구조 분석 완료 (F:\pola_homepage\7.20th_kimhyunjoon_ibn\scripts\worker.js)

### 필요한 작업 순서

#### 1. K-자금컴퍼니 전용 Worker 생성 (scripts/worker.js)
IBN worker.js (7.20th_kimhyunjoon_ibn\scripts\worker.js) 기반으로 K-자금컴퍼니 전용 Worker 작성.
핵심 기능 3가지:
- **Airtable 저장**: POST /api/submit → Airtable 레코드 생성
- **Telegram 알림**: 신규 상담 접수 시 텔레그램 메시지 발송
- **이메일 발송**: Gmail OAuth2로 고객확인 + 담당자알림 이메일

#### 2. Cloudflare Worker 배포
```bash
# Worker 배포 (Wrangler CLI 또는 Cloudflare API)
# 기존 Worker URL: https://kfund.t63755720.workers.dev
```

Worker 환경변수 설정 필요:
- AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID
- TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
- GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN

#### 3. 프론트엔드 WORKER_URL 연결
모든 HTML에서 WORKER_URL 업데이트:
```javascript
const WORKER_URL = 'https://kfund.t63755720.workers.dev';
```

대상 파일 (폼이 있는 모든 HTML):
- index.html (L3630)
- about.html
- service.html
- fund.html
- process.html
- marketing.html

#### 4. Airtable 테이블 필드 확인
Base: app5d0aevBlybtHhg / Table: tblEYTqJwFYf5xc9a
필드 매핑 (프론트→Airtable):
| 프론트 필드 | Airtable 필드 |
|------------|---------------|
| 기업명 | Company |
| 사업자번호 | BizNo |
| 대표자명 | Name |
| 연락처 | Phone |
| 이메일 | Email |
| 지역 | Region |
| 업종 | Industry |
| 설립연도 | Founded |
| 직전년도매출 | Revenue |
| 통화가능시간 | CallTime |
| 필요자금규모 | Amount |
| 자금종류 | FundType |
| 문의사항 | Message |
| 접수일 | Date |
| 접수시간 | Time |

#### 5. 테스트
폼 테스트 데이터: 임혜진 / 01066246615 / imagime2002@naver.com

## API 크레덴셜 (.env 파일에 저장됨)

| 서비스 | 키 | 값 (일부) |
|--------|-----|-----------|
| Cloudflare Account | ID | c5eb7f24ae078dc9caede7e6d4fc3f41 |
| Cloudflare API Token | - | -qYQOI...3eMG |
| R2 Bucket | Name | kfund-r2 |
| R2 Public URL | - | https://pub-d4f7fa5a4cb648d48f34274fcba1d283.r2.dev |
| R2 Access Key | - | d1c538...dae2 |
| R2 Secret Key | - | 2d1830...16e |
| Worker URL | - | https://kfund.t63755720.workers.dev |
| Airtable Base | ID | app5d0aevBlybtHhg |
| Airtable Table | ID | tblEYTqJwFYf5xc9a |
| Airtable View | ID | viwKMrTmQsXC6FcPc |
| Airtable Token | - | patL6t...3568 |
| Telegram Bot | Token | 8053531001:AAHs...Bcjk |
| Telegram Chat | ID | -1003598253761 |
| Gmail Client | ID | 647924...com |
| Gmail Secret | - | GOCSPX-Z...43z |
| Gmail Refresh | Token | 1//04r9...pdA |

## 프론트엔드 폼 제출 로직 (index.html L3632~3830)
- handleIbnSubmit() 함수가 폼 데이터 수집
- airtableFields 객체로 필드 매핑
- customerEmailHTML / staffEmailHTML 이메일 템플릿 내장
- WORKER_URL로 POST 요청 (현재 빈 문자열)
- staffEmails: ['ni5720@daum.net', 'mkt@polarad.co.kr']

## IBN Worker 참고 구조 (7.20th_kimhyunjoon_ibn\scripts\worker.js)
- handleSubmit(request, env): POST /api/submit
  1. Airtable 저장 (필드 한→영 매핑)
  2. 고객 이메일 발송 (Resend API)
  3. 담당자 이메일 발송 (Resend API)
  4. Telegram 메시지 발송
- buildTelegramMessage(): 텔레그램 메시지 포맷

## 브랜드 정보
| 항목 | 내용 |
|------|------|
| 홈페이지 상호 | **K-자금컴퍼니** |
| 푸터 사업자상호 | **케이(k)-자금 컴퍼니** |
| 등록번호 | 533-08-03518 |
| 대표자 | 김은희 (직함: 기업심사관) |
| 대표번호 | 1844-0239 |
| 휴대전화 | 010-6375-5720 |
| 이메일 | ni5720@daum.net |
| 주소 | 경기도 의왕시 원골로 10, 1동 505호 |

## 개발 규칙
- 개발서버 포트: **5000번대만 사용**
- 원본 참조: F:\pola_homepage\7.20th_kimhyunjoon_ibn

## 남은 작업 (우선순위 순)
1. 🔴 Worker 생성 + 배포 + 폼 연결 (이번 핸드오프 핵심)
2. 🟡 Airtable 테이블 필드 구조 확인/생성
3. 🟡 이메일 발송 방식 결정 (Gmail OAuth2 vs Resend)
4. 🟢 서비스 섹션 카드 색상 변경
5. 🟢 OG 이미지 새로 생성
6. 🟢 Google Analytics ID 설정
7. 🟢 Naver Search Advisor 인증
8. 🟢 도메인 연결 + Vercel 배포
