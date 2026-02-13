// 게시글 6개 일괄 등록 스크립트
const WORKER_URL = 'https://kfund.t63755720.workers.dev';

const posts = [
  // ───────── 1. 2026년 중소기업 정책자금 총정리 ─────────
  {
    제목: '2026년 중소기업 정책자금 총정리 — 올해 달라진 지원 규모·금리·대상 한눈에',
    요약: '2026년 중소기업 정책자금의 주요 변경사항, 지원 규모, 금리 조건을 한눈에 비교 정리합니다.',
    카테고리: '정책자금',
    태그: '정책자금, 중소기업, 2026, 금리, 지원규모',
    작성일: '2026-02-13',
    게시여부: true,
    내용: `## 2026년 중소기업 정책자금, 무엇이 달라졌나

2026년 중소벤처기업부는 중소기업 정책자금 총 규모를 **4조 8,500억 원**으로 편성했습니다. 이는 2025년 대비 **약 5.2% 증가**한 수치로, 경기 불확실성에 대응하기 위한 정부의 적극적 지원 의지가 반영된 결과입니다.

올해 가장 눈에 띄는 변화는 **정책자금 금리 인하**입니다. 기준금리 인하 기조에 맞춰 중소기업 정책자금 기본금리가 **연 2.7%대**까지 낮아졌으며, 일부 특별 프로그램은 **연 1.9%**의 초저금리를 적용합니다.

### 핵심 수치 한눈에 보기

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0;">
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#60A5FA;">4.85조원</div>
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">총 정책자금 규모</div>
</div>
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#60A5FA;">연 2.7%</div>
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">기본 정책금리</div>
</div>
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#60A5FA;">+5.2%</div>
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">전년 대비 증가율</div>
</div>
</div>

### 2026년 주요 정책자금 프로그램 비교

<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<thead>
<tr style="background:rgba(59,130,246,0.2);">
<th style="padding:12px;text-align:left;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">프로그램</th>
<th style="padding:12px;text-align:right;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">지원한도</th>
<th style="padding:12px;text-align:right;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">금리</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">대출기간</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">혁신성장자금</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">100억원</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">연 2.7%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">10년(3년 거치)</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">긴급경영안정자금</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">10억원</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">연 2.4%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">5년(2년 거치)</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">신시장진출지원</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">70억원</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">연 2.9%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">8년(3년 거치)</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">재창업자금</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">30억원</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">연 2.5%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">8년(3년 거치)</td></tr>
<tr><td style="padding:10px;color:rgba(255,255,255,0.8);">소공인특화자금</td><td style="padding:10px;text-align:right;color:#60A5FA;font-weight:600;">5억원</td><td style="padding:10px;text-align:right;color:rgba(255,255,255,0.8);">연 2.2%</td><td style="padding:10px;text-align:center;color:rgba(255,255,255,0.8);">5년(2년 거치)</td></tr>
</tbody>
</table>

### 프로그램별 예산 배분 비중

<div style="margin:20px 0;">
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:130px;font-size:13px;color:rgba(255,255,255,0.7);">혁신성장</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:38%;height:100%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;">1.84조 (38%)</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:130px;font-size:13px;color:rgba(255,255,255,0.7);">긴급경영안정</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:22%;height:100%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;">1.07조 (22%)</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:130px;font-size:13px;color:rgba(255,255,255,0.7);">신시장진출</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:18%;height:100%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;">0.87조 (18%)</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:130px;font-size:13px;color:rgba(255,255,255,0.7);">재창업</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:12%;height:100%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;">0.58조 (12%)</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:130px;font-size:13px;color:rgba(255,255,255,0.7);">기타</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:10%;height:100%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;">10%</div>
</div>
</div>
</div>

### 2025년 대비 주요 변경사항

**1. 금리 인하**
2025년 기본금리 3.17%에서 2026년 2.7%로 약 0.47%p 인하되었습니다. 이는 한국은행 기준금리 인하 기조와 중소기업 자금 부담 완화 정책이 맞물린 결과입니다.

**2. 지원 대상 확대**
기존 매출액 기준(연 120억 원 이하)이 **150억 원 이하**로 상향 조정되어 더 많은 중소기업이 정책자금을 이용할 수 있게 되었습니다.

**3. AI·디지털 전환 가산 지원**
AI, 빅데이터, 클라우드 등 디지털 전환 투자 기업에 **금리 0.3%p 추가 우대**가 신설되었습니다. 제조업 스마트팩토리 도입 기업도 동일한 혜택을 받습니다.

**4. 심사 절차 간소화**
기존 평균 4~6주 소요되던 심사 기간이 **3주 이내**로 단축되었습니다. 온라인 접수 시스템 개편과 서류 간소화가 핵심입니다.

> 정책자금은 매년 상반기에 집중 배정됩니다. 2026년 상반기 접수는 **3월 4일부터** 시작되므로, 필요 서류를 미리 준비하시기 바랍니다.

### 신청 시 준비 서류

- 사업자등록증 사본
- 최근 3개년 재무제표
- 사업계획서 (중진공 양식)
- 부가가치세 과세표준증명원
- 국세·지방세 납세증명서
- 4대 보험 완납증명서

**K-자금컴퍼니**는 중소기업 정책자금 신청 전 과정을 전문적으로 지원합니다. 사업체 상황에 맞는 최적의 정책자금 프로그램 선택부터 서류 준비, 심사 대비까지 원스톱 컨설팅을 제공합니다.

문의: **1844-0239** | 1차 무료심사 가능`
  },

  // ───────── 2. 소상공인 긴급경영안정자금 ─────────
  {
    제목: '소상공인 긴급경영안정자금 신청 가이드 — 자격요건부터 승인 전략까지',
    요약: '2026년 소상공인 긴급경영안정자금의 자격요건, 신청절차, 지원금액, 승인률 통계를 상세히 안내합니다.',
    카테고리: '정책자금',
    태그: '소상공인, 긴급경영안정자금, 신청가이드, 자격요건',
    작성일: '2026-02-12',
    게시여부: true,
    내용: `## 소상공인 긴급경영안정자금이란?

소상공인 긴급경영안정자금은 경영 위기에 처한 소상공인을 대상으로 **저금리 정책자금**을 긴급 지원하는 제도입니다. 2026년에는 총 **1조 2,000억 원** 규모로 편성되었으며, 자연재해, 경기 침체, 사회적 재난 등으로 매출이 급감한 소상공인이 주요 대상입니다.

### 지원 핵심 요약

<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:20px 0;">
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#60A5FA;">최대 1억원</div>
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">대출 한도</div>
</div>
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#60A5FA;">연 2.0%</div>
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">고정 금리</div>
</div>
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#60A5FA;">5년</div>
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">상환 기간</div>
</div>
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#60A5FA;">2년</div>
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">거치 기간</div>
</div>
</div>

### 자격요건 체크리스트

<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<thead>
<tr style="background:rgba(59,130,246,0.2);">
<th style="padding:12px;text-align:left;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">요건 항목</th>
<th style="padding:12px;text-align:left;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">세부 기준</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-weight:600;">업종</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">소상공인보호법상 소상공인 해당 업종</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-weight:600;">매출 기준</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">연 매출 10억 원 이하 (업종별 상이)</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-weight:600;">종업원 수</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">상시근로자 5인 미만 (제조·건설·운수업 10인 미만)</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-weight:600;">사업 기간</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">사업자등록 후 6개월 이상 경과</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-weight:600;">매출 감소</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">전년 동기 대비 매출 10% 이상 감소 입증</td></tr>
<tr><td style="padding:10px;color:rgba(255,255,255,0.8);font-weight:600;">신용 등급</td><td style="padding:10px;color:rgba(255,255,255,0.8);">NICE 신용점수 744점 이상 (일부 예외 인정)</td></tr>
</tbody>
</table>

### 신청 절차 5단계

**1단계: 온라인 사전 접수**
소상공인시장진흥공단(semas.or.kr) 홈페이지에서 사전 접수합니다. 접수 기간은 분기별로 운영되며, 2026년 1분기 접수는 **2월 17일~3월 14일**입니다.

**2단계: 서류 제출**
사업자등록증, 매출 증빙(부가세 과세표준증명원), 사업장 임대차계약서, 신분증 사본 등을 제출합니다.

**3단계: 현장 실사**
소진공 담당자가 사업장을 방문하여 실제 영업 여부와 경영 상황을 확인합니다. 평균 접수 후 **1~2주 이내** 실시됩니다.

**4단계: 심사 및 승인**
서류 심사와 현장 실사 결과를 종합하여 지원 여부를 결정합니다. 승인까지 평균 **3~4주**가 소요됩니다.

**5단계: 대출 실행**
승인 후 지정 금융기관(기업은행, 국민은행 등)에서 대출이 실행됩니다.

### 최근 3년간 승인률 추이

<div style="margin:20px 0;">
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:80px;font-size:13px;color:rgba(255,255,255,0.7);">2024년</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:62%;height:100%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;">62.3%</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:80px;font-size:13px;color:rgba(255,255,255,0.7);">2025년</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:58%;height:100%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;">58.7%</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:80px;font-size:13px;color:rgba(255,255,255,0.7);">2026년*</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:65%;height:100%;background:linear-gradient(90deg,#10B981,#34D399);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;">65.1% (1월 기준)</div>
</div>
</div>
</div>
<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">* 2026년은 1월 접수분 기준 잠정치</div>

### 승인률을 높이는 5가지 전략

**1. 매출 감소 입증 철저히**
부가세 신고서, 카드 매출 데이터, POS 매출 내역 등 다양한 증빙을 준비하세요. 단순 매출 감소가 아닌 **경영 위기의 구체적 원인**을 설명할 수 있어야 합니다.

**2. 사업계획서의 회복 전략**
자금 지원 후 어떻게 경영을 정상화할 것인지 구체적인 계획을 제시하세요. 신규 사업 영역 진출, 비용 절감 계획, 마케팅 전략 등이 포함되면 좋습니다.

**3. 기존 대출 상환 실적**
기존에 정책자금이나 은행 대출을 이용한 경우, 상환 실적이 양호하면 긍정적으로 작용합니다.

**4. 세금 체납 해소**
국세·지방세 체납이 있으면 무조건 탈락합니다. 신청 전 반드시 완납 여부를 확인하세요.

**5. 전문가 사전 상담**
자격요건 충족 여부와 최적의 프로그램 선택을 위해 전문 컨설턴트의 사전 상담을 받는 것이 유리합니다.

> 긴급경영안정자금은 예산 소진 시 조기 마감될 수 있습니다. 자격 요건에 해당되신다면 가능한 빨리 신청하시는 것을 권장합니다.

**K-자금컴퍼니**는 소상공인 긴급경영안정자금 신청을 전문적으로 지원합니다. 자격요건 검토부터 서류 준비, 심사 대비까지 체계적으로 도와드립니다.

문의: **1844-0239** | 무료 상담 예약 가능`
  },

  // ───────── 3. 창업기업 정부지원 프로그램 비교분석 ─────────
  {
    제목: '2026 창업기업 정부지원 프로그램 비교분석 — 예비·초기·재도전 패키지 완벽 비교',
    요약: '예비창업패키지, 초기창업패키지, 재도전성공패키지를 지원금액, 자격요건, 선정률까지 상세 비교합니다.',
    카테고리: '창업지원',
    태그: '창업지원, 예비창업패키지, 초기창업패키지, 재도전, 비교분석',
    작성일: '2026-02-11',
    게시여부: true,
    내용: `## 나에게 맞는 창업 지원 프로그램은?

정부는 창업 단계별로 다양한 지원 프로그램을 운영하고 있습니다. 그중 가장 대표적인 3대 패키지인 **예비창업패키지**, **초기창업패키지**, **재도전성공패키지**를 2026년 기준으로 상세히 비교해보겠습니다.

### 3대 창업 패키지 핵심 비교

<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<thead>
<tr style="background:rgba(59,130,246,0.2);">
<th style="padding:12px;text-align:left;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">항목</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">예비창업패키지</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">초기창업패키지</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">재도전성공패키지</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-weight:600;">대상</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">예비 창업자<br>(사업자등록 전)</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">창업 3년 이내<br>기업 대표</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">폐업 경험<br>재창업자</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-weight:600;">지원금액</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:700;">최대 1억원</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:700;">최대 1억원</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:700;">최대 7천만원</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-weight:600;">지원 형태</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">보조금 (무상)</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">보조금 (무상)</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">보조금 (무상)</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-weight:600;">2026 선정 규모</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">약 2,400명</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">약 1,800명</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">약 600명</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-weight:600;">경쟁률 (2025)</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">약 6.2:1</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">약 4.8:1</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">약 3.5:1</td></tr>
<tr><td style="padding:10px;color:rgba(255,255,255,0.7);font-weight:600;">접수 시기</td><td style="padding:10px;text-align:center;color:rgba(255,255,255,0.8);">3월~4월</td><td style="padding:10px;text-align:center;color:rgba(255,255,255,0.8);">4월~5월</td><td style="padding:10px;text-align:center;color:rgba(255,255,255,0.8);">3월~4월</td></tr>
</tbody>
</table>

### 프로그램별 지원금액 비교

<div style="margin:20px 0;">
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:120px;font-size:13px;color:rgba(255,255,255,0.7);">예비창업</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:32px;overflow:hidden;">
<div style="width:100%;height:100%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:13px;color:white;font-weight:600;">최대 1억원</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:120px;font-size:13px;color:rgba(255,255,255,0.7);">초기창업</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:32px;overflow:hidden;">
<div style="width:100%;height:100%;background:linear-gradient(90deg,#8B5CF6,#A78BFA);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:13px;color:white;font-weight:600;">최대 1억원</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:120px;font-size:13px;color:rgba(255,255,255,0.7);">재도전성공</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:32px;overflow:hidden;">
<div style="width:70%;height:100%;background:linear-gradient(90deg,#10B981,#34D399);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:13px;color:white;font-weight:600;">최대 7천만원</div>
</div>
</div>
</div>

### 각 프로그램 상세 분석

## 예비창업패키지

아직 사업자등록을 하지 않은 **예비 창업자**를 대상으로 합니다. 선정되면 사업화 자금(최대 1억 원)과 함께 창업 교육, 멘토링, 네트워킹 기회를 제공받습니다.

**핵심 심사 기준:**
- 창업 아이템의 혁신성 (40%)
- 사업 모델의 실현 가능성 (30%)
- 대표자 역량 및 팀 구성 (20%)
- 시장성 및 성장 가능성 (10%)

**2026년 우대 분야:** AI·디지털, 탄소중립, 바이오헬스, 우주항공

## 초기창업패키지

사업자등록 후 **3년 이내** 기업 대표가 대상입니다. 이미 사업을 시작했지만 성장을 위한 추가 자금이 필요한 초기 스타트업에 적합합니다.

**예비창업패키지와의 차이:**
- 이미 시장에 진출한 기업 대상 → 매출 실적, 고객 반응 등 실질적 성과 심사
- 시제품 제작비보다 마케팅, 양산, 인력 채용 등에 자금 활용 가능
- 후속 투자 유치 연계 프로그램 운영

## 재도전성공패키지

사업 실패 경험이 있는 **재창업자**를 위한 프로그램입니다. 폐업 후 새로운 아이템으로 재도전하는 사업자에게 자금과 재기 교육을 지원합니다.

**지원 자격:**
- 과거 폐업 경험 보유 (폐업신고 완료)
- 신용회복 절차 완료 또는 진행 중
- 새로운 사업 아이템으로 재창업 의지

### 선정 확률을 높이는 전략

**1. 차별화된 문제 정의**
"무엇을 만들었는가"보다 **"어떤 문제를 해결하는가"**에 집중하세요. 구체적인 타겟 고객의 페인포인트(Pain Point)를 명확히 정의하는 것이 핵심입니다.

**2. 숫자로 말하는 사업계획서**
시장 규모, 예상 매출, 고객 확보 계획 등을 **구체적인 수치**로 제시하세요. "큰 시장"이 아닌 "연간 3.2조 규모의 시장에서 0.5% 점유율 목표"처럼 작성합니다.

**3. 대표자 경력의 연관성**
대표자의 과거 경력이 창업 아이템과 어떻게 연결되는지 설득력 있게 설명해야 합니다.

> 2026년 창업 패키지 접수는 3~5월에 집중됩니다. 사업계획서 작성에 충분한 시간을 확보하시기 바랍니다.

**K-자금컴퍼니**는 창업 지원 프로그램 선정을 위한 사업계획서 작성 컨설팅을 전문적으로 제공합니다.

문의: **1844-0239** | 무료 사업계획서 사전 검토 가능`
  },

  // ───────── 4. 정책자금 금리 변동 추이와 전망 ─────────
  {
    제목: '2026년 정책자금 금리 변동 추이와 전망 — 지금이 대출 적기인 이유',
    요약: '최근 3년간 정책자금 금리 추이를 분석하고, 2026년 하반기 전망과 최적의 대출 시점을 안내합니다.',
    카테고리: '분석',
    태그: '정책자금금리, 금리추이, 금리전망, 2026, 대출시점',
    작성일: '2026-02-10',
    게시여부: true,
    내용: `## 정책자금 금리, 3년 만에 최저 수준

2026년 2월 현재, 중소기업 정책자금 금리가 최근 3년 중 **가장 낮은 수준**에 도달했습니다. 한국은행의 기준금리 인하 기조와 정부의 중소기업 지원 강화 정책이 맞물리면서, 정책자금 기본금리가 **연 2.7%**까지 낮아졌습니다.

### 기준금리 vs 정책금리 비교

<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:20px 0;">
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:8px;">한국은행 기준금리</div>
<div style="font-size:32px;font-weight:700;color:#60A5FA;">2.50%</div>
<div style="font-size:12px;color:#34D399;margin-top:4px;">▼ 0.75%p (전년 대비)</div>
</div>
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:8px;">정책자금 기본금리</div>
<div style="font-size:32px;font-weight:700;color:#60A5FA;">2.70%</div>
<div style="font-size:12px;color:#34D399;margin-top:4px;">▼ 0.47%p (전년 대비)</div>
</div>
</div>

### 최근 3년 금리 추이 (분기별)

<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<thead>
<tr style="background:rgba(59,130,246,0.2);">
<th style="padding:12px;text-align:left;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">시기</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">기준금리</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">정책금리</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">시중 대출금리</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">절감 효과</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">2024 Q1</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">3.50%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">3.40%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">5.8%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#34D399;">-2.4%p</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">2024 Q3</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">3.50%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">3.35%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">5.6%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#34D399;">-2.25%p</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">2025 Q1</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">3.25%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">3.17%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">5.3%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#34D399;">-2.13%p</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">2025 Q3</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">3.00%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">2.95%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">5.0%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#34D399;">-2.05%p</td></tr>
<tr><td style="padding:10px;color:rgba(255,255,255,0.8);font-weight:600;">2026 Q1</td><td style="padding:10px;text-align:center;color:rgba(255,255,255,0.8);">2.50%</td><td style="padding:10px;text-align:center;color:#60A5FA;font-weight:700;">2.70%</td><td style="padding:10px;text-align:center;color:rgba(255,255,255,0.8);">4.5%</td><td style="padding:10px;text-align:center;color:#34D399;font-weight:600;">-1.80%p</td></tr>
</tbody>
</table>

### 금리 하락 추이 시각화

<div style="margin:20px 0;">
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:90px;font-size:13px;color:rgba(255,255,255,0.7);">2024 Q1</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;position:relative;">
<div style="width:85%;height:100%;background:linear-gradient(90deg,#EF4444,#F87171);border-radius:4px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;font-size:12px;color:white;font-weight:600;">3.40%</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:90px;font-size:13px;color:rgba(255,255,255,0.7);">2024 Q3</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:83%;height:100%;background:linear-gradient(90deg,#F59E0B,#FBBF24);border-radius:4px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;font-size:12px;color:white;font-weight:600;">3.35%</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:90px;font-size:13px;color:rgba(255,255,255,0.7);">2025 Q1</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:79%;height:100%;background:linear-gradient(90deg,#F59E0B,#FBBF24);border-radius:4px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;font-size:12px;color:white;font-weight:600;">3.17%</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:90px;font-size:13px;color:rgba(255,255,255,0.7);">2025 Q3</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:74%;height:100%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:4px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;font-size:12px;color:white;font-weight:600;">2.95%</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:90px;font-size:13px;color:rgba(255,255,255,0.7);font-weight:600;">2026 Q1</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:68%;height:100%;background:linear-gradient(90deg,#10B981,#34D399);border-radius:4px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;font-size:12px;color:white;font-weight:600;">2.70%</div>
</div>
</div>
</div>

### 정책금리 vs 시중금리 이자 절감 효과

1억 원 대출 기준, 정책자금과 시중 은행 대출의 연간 이자 차이를 계산해보겠습니다.

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0;">
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:8px;">정책자금 연이자</div>
<div style="font-size:24px;font-weight:700;color:#60A5FA;">270만원</div>
<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">1억 × 2.7%</div>
</div>
<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:8px;">시중 대출 연이자</div>
<div style="font-size:24px;font-weight:700;color:#F87171;">450만원</div>
<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">1억 × 4.5%</div>
</div>
<div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:8px;">연간 절감액</div>
<div style="font-size:24px;font-weight:700;color:#34D399;">180만원</div>
<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">5년 기준 900만원</div>
</div>
</div>

### 2026년 하반기 금리 전망

한국은행은 2026년 상반기까지 추가 금리 인하 가능성을 시사했습니다. 시장 전문가들은 기준금리가 **2.25~2.50%** 수준에서 안정화될 것으로 예상하고 있습니다.

**금리 인하 가능 시나리오:**
- 글로벌 경기 둔화 지속 → 추가 0.25%p 인하 가능
- 수출 부진 심화 → 중소기업 지원 확대 → 정책금리 추가 인하

**금리 동결/인상 시나리오:**
- 환율 불안정 → 기준금리 동결
- 인플레이션 재상승 → 금리 인하 중단

> 현재 금리 수준은 최근 3년 중 최저입니다. 자금 수요가 있다면 **2026년 상반기가 최적의 대출 시점**입니다. 하반기에는 금리가 동결되거나 소폭 상승할 가능성도 있습니다.

### 금리 우대 조건 활용법

기본 정책금리에서 추가로 금리를 낮출 수 있는 방법이 있습니다.

- **고용 증가 기업**: 직전년 대비 고용 5% 이상 증가 → 0.2%p 우대
- **녹색 경영 인증**: 환경부 녹색기업 인증 보유 → 0.1%p 우대
- **AI·디지털 전환**: 스마트팩토리, AI 도입 기업 → 0.3%p 우대
- **수출 실적 기업**: 직접 수출 실적 보유 → 0.1%p 우대
- **최대 중복 적용 시**: 기본 2.7% → **최저 1.9%** 가능

**K-자금컴퍼니**는 금리 우대 조건 분석과 최적의 대출 전략을 제시합니다. 사업체 상황에 맞는 맞춤 컨설팅으로 최저 금리를 실현하세요.

문의: **1844-0239** | 금리 시뮬레이션 무료 제공`
  },

  // ───────── 5. 시설자금 vs 운전자금 비교 ─────────
  {
    제목: '시설자금 vs 운전자금 — 어떤 정책자금이 내 사업에 유리한가?',
    요약: '시설자금과 운전자금의 조건, 한도, 상환기간을 비교하고, 사업 상황별 최적의 선택 가이드를 제시합니다.',
    카테고리: '분석',
    태그: '시설자금, 운전자금, 정책자금비교, 대출한도, 상환기간',
    작성일: '2026-02-09',
    게시여부: true,
    내용: `## 시설자금? 운전자금? 어떤 것을 선택해야 할까

정책자금을 신청할 때 가장 먼저 결정해야 하는 것이 **자금 용도**입니다. 크게 시설자금과 운전자금으로 나뉘며, 각각의 조건과 한도가 크게 다릅니다. 잘못된 선택은 불필요한 이자 부담이나 심사 탈락으로 이어질 수 있으므로, 두 유형의 차이를 정확히 이해해야 합니다.

### 한눈에 비교

<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<thead>
<tr style="background:rgba(59,130,246,0.2);">
<th style="padding:12px;text-align:left;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">비교 항목</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">시설자금</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">운전자금</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-weight:600;">용도</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">설비 구입, 공장 신축/증설,<br>사업장 매입/리모델링</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">원자재 구입, 인건비,<br>임차료, 일반 경영 비용</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-weight:600;">대출 한도</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:700;">최대 100억원</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:700;">최대 10억원</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-weight:600;">대출 기간</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">10년 (3년 거치)</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">5년 (2년 거치)</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-weight:600;">금리</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">연 2.7% (기본)</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">연 2.9% (기본)</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-weight:600;">심사 난이도</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">상대적으로 까다로움<br>(투자 타당성 심사)</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">상대적으로 용이<br>(경영 현황 중심)</td></tr>
<tr><td style="padding:10px;color:rgba(255,255,255,0.7);font-weight:600;">자금 사용 증빙</td><td style="padding:10px;text-align:center;color:rgba(255,255,255,0.8);">설비 구입 증빙 필수<br>(세금계산서, 계약서)</td><td style="padding:10px;text-align:center;color:rgba(255,255,255,0.8);">상대적으로 자유로움<br>(일반 경영 지출)</td></tr>
</tbody>
</table>

### 한도 비교

<div style="margin:20px 0;">
<div style="display:flex;align-items:center;margin:12px 0;">
<span style="width:100px;font-size:14px;color:rgba(255,255,255,0.8);font-weight:600;">시설자금</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:36px;overflow:hidden;">
<div style="width:100%;height:100%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:4px;display:flex;align-items:center;padding-left:12px;font-size:14px;color:white;font-weight:700;">최대 100억원</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:12px 0;">
<span style="width:100px;font-size:14px;color:rgba(255,255,255,0.8);font-weight:600;">운전자금</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:36px;overflow:hidden;">
<div style="width:10%;height:100%;background:linear-gradient(90deg,#8B5CF6,#A78BFA);border-radius:4px;display:flex;align-items:center;padding-left:12px;font-size:14px;color:white;font-weight:700;min-width:120px;">최대 10억원</div>
</div>
</div>
</div>

### 시설자금 상세 안내

시설자금은 **유형 자산에 대한 투자**를 위한 자금입니다. 생산설비 구입, 공장 건설/증축, 사업장 매입 등 구체적인 시설 투자 목적이 있어야 합니다.

**시설자금 사용 가능 항목:**
- 생산설비·기계장치 구입비
- 공장·사업장 신축/증축/리모델링비
- 토지 및 건물 매입비
- 연구개발 시설·장비 도입비
- 환경오염 방지시설 설치비
- 물류시설 확충비

**주의사항:**
시설자금은 반드시 **사전에 투자 계획을 수립**하고, 심사 시 설비 견적서, 건축 설계도, 임대차 계약서 등을 제출해야 합니다. 대출 실행 후에도 **실제 시설 투자 증빙**(세금계산서 등)을 제출해야 하므로, 다른 용도로 유용할 수 없습니다.

### 운전자금 상세 안내

운전자금은 기업의 **일상적인 경영 활동**에 필요한 자금입니다. 원자재 구입, 인건비, 임차료, 마케팅비 등 다양한 용도로 사용할 수 있어 **활용 자유도가 높습니다**.

**운전자금 사용 가능 항목:**
- 원자재·부자재 구입비
- 인건비 (급여, 4대 보험)
- 사업장 임차료
- 마케팅·광고비
- 연구개발비 (인력 인건비)
- 기타 일반 경영비

### 상황별 추천 가이드

<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<thead>
<tr style="background:rgba(59,130,246,0.2);">
<th style="padding:12px;text-align:left;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">사업 상황</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">추천 유형</th>
<th style="padding:12px;text-align:left;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">이유</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">새 공장 건설 예정</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">시설자금</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">높은 한도(100억)와 긴 상환기간</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">생산설비 교체 필요</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">시설자금</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">설비 투자에 최적화된 조건</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">일시적 자금난</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#A78BFA;font-weight:600;">운전자금</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">빠른 심사, 유연한 사용</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">인력 확충 계획</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#A78BFA;font-weight:600;">운전자금</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">인건비 충당 가능</td></tr>
<tr><td style="padding:10px;color:rgba(255,255,255,0.8);">설비 + 운영자금 모두 필요</td><td style="padding:10px;text-align:center;color:#34D399;font-weight:600;">혼합 신청</td><td style="padding:10px;color:rgba(255,255,255,0.8);">시설+운전 동시 신청 가능</td></tr>
</tbody>
</table>

### 혼합 신청 전략

시설자금과 운전자금은 **동시에 신청**할 수 있습니다. 예를 들어, 공장을 신축하면서(시설자금) 운영에 필요한 원자재를 구입하고(운전자금) 인력을 채용(운전자금)하는 경우, 두 가지를 함께 신청하는 것이 유리합니다.

**혼합 신청 시 유의사항:**
- 시설자금과 운전자금은 별도로 심사됩니다
- 각각의 한도가 독립적으로 적용됩니다
- 사업계획서에 두 자금의 용도를 명확히 구분해야 합니다
- 자금 사용 증빙도 용도별로 구분하여 관리해야 합니다

> 자금 용도의 선택은 대출 한도, 금리, 상환 조건에 직접적인 영향을 미칩니다. 사업체 상황에 맞는 최적의 조합을 찾는 것이 중요합니다.

**K-자금컴퍼니**는 시설자금·운전자금 최적 조합 분석부터 심사 서류 준비까지 전 과정을 지원합니다. 사업체 재무 상황과 투자 계획을 분석하여 승인률을 극대화하는 맞춤 전략을 제시합니다.

문의: **1844-0239** | 무료 자금 진단 상담`
  },

  // ───────── 6. 중소벤처기업부 2026년 예산 분석 ─────────
  {
    제목: '중소벤처기업부 2026년 예산 분석 — 부처별 지원사업 예산 어디에 얼마나?',
    요약: '중소벤처기업부 2026년 예산 배분 현황과 전년 대비 증감, 주요 지원사업별 예산을 분석합니다.',
    카테고리: '분석',
    태그: '중기부예산, 2026예산, 지원사업, 예산분석, 중소벤처기업부',
    작성일: '2026-02-08',
    게시여부: true,
    내용: `## 중소벤처기업부 2026년 예산, 어디에 쓰이나

2026년 중소벤처기업부(중기부) 총 예산은 **16조 8,200억 원**으로 편성되었습니다. 이는 2025년(15조 9,500억 원) 대비 **약 5.5% 증가**한 규모입니다. 특히 AI·디지털 전환 지원과 소상공인 경영안정 분야에 대한 투자가 크게 늘었습니다.

### 총 예산 개요

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0;">
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#60A5FA;">16.82조</div>
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">2026년 총 예산</div>
</div>
<div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#34D399;">+5.5%</div>
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">전년 대비 증가율</div>
</div>
<div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:20px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#A78BFA;">+8,700억</div>
<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">증가 금액</div>
</div>
</div>

### 분야별 예산 배분 현황

<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<thead>
<tr style="background:rgba(59,130,246,0.2);">
<th style="padding:12px;text-align:left;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">분야</th>
<th style="padding:12px;text-align:right;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">2025년</th>
<th style="padding:12px;text-align:right;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">2026년</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">증감</th>
<th style="padding:12px;text-align:center;border-bottom:2px solid rgba(59,130,246,0.3);color:#93C5FD;font-size:14px;">비중</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-weight:600;">중소기업 정책자금</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">4.61조</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">4.85조</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#34D399;">+5.2%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">28.8%</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-weight:600;">소상공인 지원</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">4.12조</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">4.45조</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#34D399;">+8.0%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">26.5%</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-weight:600;">창업 지원</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">2.38조</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">2.52조</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#34D399;">+5.9%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">15.0%</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-weight:600;">기술혁신·R&D</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">2.15조</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">2.35조</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#34D399;">+9.3%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">14.0%</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-weight:600;">수출·판로 지원</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">1.52조</td><td style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);color:#60A5FA;font-weight:600;">1.58조</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:#34D399;">+3.9%</td><td style="padding:10px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);">9.4%</td></tr>
<tr><td style="padding:10px;color:rgba(255,255,255,0.8);font-weight:600;">기타 (인력, 상권 등)</td><td style="padding:10px;text-align:right;color:rgba(255,255,255,0.8);">1.07조</td><td style="padding:10px;text-align:right;color:#60A5FA;font-weight:600;">1.07조</td><td style="padding:10px;text-align:center;color:rgba(255,255,255,0.6);">0%</td><td style="padding:10px;text-align:center;color:rgba(255,255,255,0.8);">6.4%</td></tr>
</tbody>
</table>

### 분야별 예산 비중

<div style="margin:20px 0;">
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:130px;font-size:13px;color:rgba(255,255,255,0.7);">정책자금</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:28.8%;height:100%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;">28.8%</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:130px;font-size:13px;color:rgba(255,255,255,0.7);">소상공인</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:26.5%;height:100%;background:linear-gradient(90deg,#8B5CF6,#A78BFA);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;">26.5%</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:130px;font-size:13px;color:rgba(255,255,255,0.7);">창업 지원</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:15%;height:100%;background:linear-gradient(90deg,#10B981,#34D399);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;">15.0%</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:130px;font-size:13px;color:rgba(255,255,255,0.7);">기술혁신·R&D</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:14%;height:100%;background:linear-gradient(90deg,#F59E0B,#FBBF24);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;">14.0%</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:130px;font-size:13px;color:rgba(255,255,255,0.7);">수출·판로</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:9.4%;height:100%;background:linear-gradient(90deg,#EF4444,#F87171);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;min-width:50px;">9.4%</div>
</div>
</div>
<div style="display:flex;align-items:center;margin:10px 0;">
<span style="width:130px;font-size:13px;color:rgba(255,255,255,0.7);">기타</span>
<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:4px;height:28px;overflow:hidden;">
<div style="width:6.4%;height:100%;background:linear-gradient(90deg,#6B7280,#9CA3AF);border-radius:4px;display:flex;align-items:center;padding-left:10px;font-size:12px;color:white;font-weight:600;min-width:45px;">6.4%</div>
</div>
</div>
</div>

### 2026년 예산의 핵심 포인트

## 1. 소상공인 지원 대폭 강화 (+8.0%)

소상공인 지원 예산이 전년 대비 **8.0%** 증가한 **4.45조 원**으로 편성되었습니다. 이는 전체 분야 중 가장 높은 증가율입니다.

**주요 내용:**
- 긴급경영안정자금: 1.2조 원 (신규 편성 확대)
- 소상공인 디지털 전환 지원: 3,200억 원 (+25%)
- 전통시장·상점가 활성화: 2,800억 원 (+10%)
- 소상공인 재기 지원: 1,500억 원 (+15%)

## 2. 기술혁신·R&D 투자 확대 (+9.3%)

기술혁신·R&D 분야가 전년 대비 **9.3%** 증가한 **2.35조 원**으로 편성되었습니다. AI와 디지털 전환에 대한 투자가 핵심입니다.

**주요 내용:**
- AI 기반 제조혁신: 4,500억 원 (신규)
- 스마트팩토리 보급 확산: 3,800억 원 (+12%)
- 중소기업 R&D 바우처: 2,200억 원 (+8%)
- 기술보증기금 출연: 8,000억 원 (동결)

## 3. 창업 지원 꾸준한 성장 (+5.9%)

창업 지원 예산은 **2.52조 원**으로, 예비창업패키지와 초기창업패키지의 선정 인원이 소폭 확대되었습니다.

**주요 내용:**
- 예비창업패키지: 3,600억 원 (+5%)
- 초기창업패키지: 2,800억 원 (+7%)
- 재도전성공패키지: 800억 원 (+10%)
- TIPS(민간투자 주도형): 2,500억 원 (+3%)

### 중소기업이 주목해야 할 신규 사업

**1. AI 도입 바우처 (신규)**
중소기업의 AI 솔루션 도입을 지원하는 바우처 사업이 신설됩니다. 기업당 **최대 3,000만 원**의 바우처를 지급하여 AI 기반 생산성 향상을 돕습니다. (총 예산 1,200억 원, 약 4,000개 기업 선정 예정)

**2. 탄소중립 전환 자금 (확대)**
탄소중립 설비 도입을 위한 특별 정책자금이 기존 1,500억 원에서 **2,500억 원**으로 확대됩니다. ESG 경영을 추진하는 중소기업에 유리합니다.

**3. 글로벌 진출 통합 패키지 (확대)**
수출 초보 기업을 위한 통합 지원 패키지가 확대됩니다. 해외 시장조사, 바이어 매칭, 수출 인증, 물류비 지원까지 **원스톱 지원** 체계를 구축합니다.

> 정부 예산이 편성되었다고 모든 기업이 혜택을 받는 것은 아닙니다. 공모 일정과 자격 요건을 미리 파악하고, 적합한 사업에 전략적으로 지원하는 것이 중요합니다.

**K-자금컴퍼니**는 중기부 예산 동향 분석과 맞춤형 지원사업 매칭 서비스를 제공합니다. 기업 상황에 최적화된 정부 지원 프로그램을 찾아드립니다.

문의: **1844-0239** | 맞춤 지원사업 매칭 무료 상담`
  }
];

// 게시글 일괄 등록 실행
async function registerPosts() {
  console.log('=== 게시글 등록 시작 ===\n');

  const results = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`[${i + 1}/${posts.length}] ${post.제목.substring(0, 40)}...`);

    try {
      const res = await fetch(`${WORKER_URL}/board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });

      const result = await res.json();

      if (result.success) {
        console.log(`  ✅ 성공 — ID: ${result.id}`);
        results.push({ title: post.제목, id: result.id, success: true });
      } else {
        console.log(`  ❌ 실패 — ${result.error}`);
        results.push({ title: post.제목, error: result.error, success: false });
      }
    } catch (error) {
      console.log(`  ❌ 오류 — ${error.message}`);
      results.push({ title: post.제목, error: error.message, success: false });
    }

    // API 속도 제한 대비 500ms 대기
    if (i < posts.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('\n=== 등록 결과 요약 ===');
  const successCount = results.filter(r => r.success).length;
  console.log(`성공: ${successCount}/${posts.length}`);

  if (successCount > 0) {
    console.log('\n등록된 게시글 ID:');
    results.filter(r => r.success).forEach(r => {
      console.log(`  ${r.id} — ${r.title.substring(0, 50)}`);
    });
  }

  const failCount = results.filter(r => !r.success).length;
  if (failCount > 0) {
    console.log('\n실패한 게시글:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ${r.title.substring(0, 50)} — ${r.error}`);
    });
  }
}

registerPosts();
