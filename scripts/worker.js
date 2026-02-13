// ================================================
// K-자금컴퍼니 Workers API
// 기능: 문의접수 + 게시판 + 접수내역
// 배포: Cloudflare Workers
//
// 환경변수 (wrangler secret):
//   - AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID
//   - TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
//   - GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
//   - OTP_KV (KV namespace binding)
// ================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const STATIC_SLUGS = [
  '2026-policy-fund-overview',
  '2026-startup-support',
  '2026-small-business-voucher',
  '2026-ax-sprint-track',
  '2026-non-capital-region',
  '2026-hope-return-package'
];

// ================================================
// 유틸리티
// ================================================

function escapeHtml(str) {
  if (!str) return '-';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getKSTNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

function formatDateKST(date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

function formatTimeKST(date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[1].substring(0, 5);
}

// ================================================
// Gmail OAuth2 이메일 발송
// ================================================

async function getGmailAccessToken(env) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GMAIL_CLIENT_ID,
      client_secret: env.GMAIL_CLIENT_SECRET,
      refresh_token: env.GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  const data = await response.json();
  if (!data.access_token) throw new Error('Gmail token refresh failed: ' + JSON.stringify(data));
  return data.access_token;
}

// UTF-8 문자열 → Latin1 바이트열 (btoa 호환)
function utf8ToLatin1(str) {
  return unescape(encodeURIComponent(str));
}

// UTF-8 문자열 → base64
function utf8ToBase64(str) {
  return btoa(utf8ToLatin1(str));
}

// RFC 2047 인코딩 (이메일 헤더용)
function encodeRfc2047(str) {
  return '=?UTF-8?B?' + utf8ToBase64(str) + '?=';
}

// From 헤더 인코딩 (표시명에 한글 포함 가능)
function encodeFromHeader(from) {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return encodeRfc2047(match[1].trim()) + ' <' + match[2] + '>';
  }
  return from;
}

function buildMimeMessage({ from, to, subject, html }) {
  const boundary = '----=_Part_' + Date.now();
  const encodedHtml = utf8ToBase64(html);
  const lines = [
    `From: ${encodeFromHeader(from)}`,
    `To: ${to}`,
    `Subject: ${encodeRfc2047(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodedHtml,
    '',
    `--${boundary}--`
  ];
  return lines.join('\r\n');
}

// ArrayBuffer → base64url
function arrayBufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendGmail(env, accessToken, { from, to, subject, html }) {
  const mime = buildMimeMessage({ from, to, subject, html });
  // MIME 메시지는 이미 ASCII (한글은 모두 base64 인코딩됨)
  const raw = btoa(mime).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error('Gmail send failed: ' + JSON.stringify(error));
  }

  return await response.json();
}

// ================================================
// 문의 접수 핸들러
// ================================================

async function handleSubmit(request, env) {
  console.log('📥 K-자금컴퍼니 문의 접수');

  const data = await request.json();
  const results = {
    success: true,
    airtable: { success: false, id: null, error: null },
    email: { customer: { success: false, error: null }, staff: { success: false, error: null } },
    telegram: { success: false, error: null }
  };

  const now = new Date();
  const kst = getKSTNow();
  const submitDate = kst.toISOString().split('T')[0];
  const submitTime = kst.toISOString().split('T')[1].substring(0, 5);

  // 1. Airtable 저장
  if (env.AIRTABLE_TOKEN && env.AIRTABLE_BASE_ID) {
    try {
      const rawFields = data.airtableFields || {};
      const fieldMap = {
        '기업명': 'Company', '사업자번호': 'BizNo', '대표자명': 'Name',
        '연락처': 'Phone', '이메일': 'Email', '지역': 'Region',
        '업종': 'Industry', '설립연도': 'Founded', '직전년도매출': 'Revenue',
        '통화가능시간': 'CallTime', '필요자금규모': 'Amount',
        '자금종류': 'FundType', '문의사항': 'Message',
        '접수일': 'Date', '접수시간': 'Time', '상태': 'Status', '메모': 'Memo'
      };

      // 영문 필드명 셋 (Airtable에 실제 존재하는 필드만 허용)
      const validFields = new Set(Object.values(fieldMap));
      const fields = {};
      for (const [key, value] of Object.entries(rawFields)) {
        const engKey = fieldMap[key] || key;
        // 매핑된 영문 필드만 전달 (알 수 없는 필드 무시)
        if (validFields.has(engKey)) {
          fields[engKey] = value;
        }
      }

      if (fields['FundType']) {
        fields['FundType'] = Array.isArray(fields['FundType']) ? fields['FundType'].join(', ') : fields['FundType'];
      }

      fields['Date'] = submitDate;
      fields['Time'] = submitTime;

      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_ID}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fields })
        }
      );

      if (airtableResponse.ok) {
        const airtableResult = await airtableResponse.json();
        results.airtable.success = true;
        results.airtable.id = airtableResult.id;
        console.log('✅ Airtable 저장:', airtableResult.id);
      } else {
        const error = await airtableResponse.json();
        results.airtable.error = error;
        console.error('❌ Airtable:', error);
      }
    } catch (error) {
      results.airtable.error = error.message;
    }
  }

  // 2. 이메일 발송 (Gmail OAuth2)
  if (env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN) {
    let accessToken;
    try {
      accessToken = await getGmailAccessToken(env);
    } catch (error) {
      console.error('❌ Gmail 토큰:', error.message);
      results.email.customer.error = error.message;
      results.email.staff.error = error.message;
    }

    if (accessToken) {
      // 고객 이메일
      if (data.customerEmail && data.customerHtml) {
        try {
          await sendGmail(env, accessToken, {
            from: data.emailFrom || 'K-자금컴퍼니 <noreply@kfund.co.kr>',
            to: data.customerEmail,
            subject: data.customerSubject || '[K-자금컴퍼니] 무료진단 신청이 접수되었습니다',
            html: data.customerHtml
          });
          results.email.customer.success = true;
          console.log('✅ 고객 이메일 발송');
        } catch (error) {
          results.email.customer.error = error.message;
          console.error('❌ 고객 이메일:', error.message);
        }
      }

      // 담당자 이메일
      if (data.staffEmails && data.staffEmails.length > 0 && data.staffHtml) {
        try {
          for (const staffEmail of data.staffEmails) {
            await sendGmail(env, accessToken, {
              from: data.emailFrom || 'K-자금컴퍼니 <noreply@kfund.co.kr>',
              to: staffEmail,
              subject: data.staffSubject || '[K-자금컴퍼니] 신규 무료진단 접수',
              html: data.staffHtml
            });
          }
          results.email.staff.success = true;
          console.log('✅ 담당자 이메일 발송');
        } catch (error) {
          results.email.staff.error = error.message;
          console.error('❌ 담당자 이메일:', error.message);
        }
      }
    }
  }

  // 3. Telegram 발송
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    try {
      const fields = data.airtableFields || {};
      const telegramText = buildTelegramMessage(fields, submitDate, submitTime);

      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: telegramText,
            parse_mode: 'HTML',
            disable_web_page_preview: true
          })
        }
      );

      if (telegramResponse.ok) {
        results.telegram.success = true;
        console.log('✅ Telegram 발송');
      } else {
        const error = await telegramResponse.json();
        results.telegram.error = error;
        console.error('❌ Telegram:', error);
      }
    } catch (error) {
      results.telegram.error = error.message;
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

// Telegram 메시지 생성
function buildTelegramMessage(fields, submitDate, submitTime) {
  let msg = '🔔 <b>K-자금컴퍼니 신규 상담</b>\n\n';
  msg += '👤 <b>고객정보</b>\n';
  msg += '├ 기업명: <b>' + escapeHtml(fields['기업명'] || fields['Company']) + '</b>\n';
  msg += '├ 사업자번호: ' + escapeHtml(fields['사업자번호'] || fields['BizNo']) + '\n';
  msg += '├ 대표자명: <b>' + escapeHtml(fields['대표자명'] || fields['Name']) + '</b>\n';
  msg += '├ 연락처: <code>' + escapeHtml(fields['연락처'] || fields['Phone']) + '</code>\n';
  msg += '├ 이메일: ' + escapeHtml(fields['이메일'] || fields['Email']) + '\n';
  msg += '├ 지역: ' + escapeHtml(fields['지역'] || fields['Region']) + '\n';
  msg += '└ 통화가능: <b>' + escapeHtml(fields['통화가능시간'] || fields['CallTime']) + '</b>\n\n';

  msg += '💰 <b>자금정보</b>\n';
  const fundTypes = fields['자금종류'] || fields['FundType'];
  if (fundTypes) msg += '├ 자금종류: ' + escapeHtml(fundTypes) + '\n';
  const amount = fields['필요자금규모'] || fields['Amount'];
  const industry = fields['업종'] || fields['Industry'];
  const founded = fields['설립연도'] || fields['Founded'];
  const revenue = fields['직전년도매출'] || fields['Revenue'];
  if (amount) msg += '├ 필요규모: ' + escapeHtml(amount) + '\n';
  if (industry) msg += '├ 업종: ' + escapeHtml(industry) + '\n';
  if (founded) msg += '├ 설립연도: ' + escapeHtml(founded) + '\n';
  if (revenue) msg += '└ 매출: ' + escapeHtml(revenue) + '\n';

  const message = fields['문의사항'] || fields['Message'];
  if (message && message !== '-') {
    msg += '\n💬 <b>문의</b>\n' + escapeHtml(message) + '\n';
  }

  msg += '\n📅 ' + submitDate + ' ' + submitTime;
  msg += '\n\n📋 <a href="https://k-fund.kr/admin/leads.html">접수관리 바로가기</a>';
  return msg;
}

// ================================================
// 접수내역 API
// ================================================

async function handleLeadsAPI(request, env, path) {
  const method = request.method;

  // GET /leads
  if (method === 'GET' && path === '/leads') {
    try {
      const sortField = encodeURIComponent('Date');
      const airtableUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_ID}?sort[0][field]=${sortField}&sort[0][direction]=desc`;
      const airtableResponse = await fetch(airtableUrl, {
        headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
      });

      if (!airtableResponse.ok) {
        const error = await airtableResponse.json();
        return new Response(JSON.stringify({ success: false, error: error.error?.message }), {
          status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      const result = await airtableResponse.json();
      const leads = result.records.map(record => ({
        id: record.id, createdTime: record.createdTime,
        Company: record.fields['Company'], BizNo: record.fields['BizNo'],
        Name: record.fields['Name'], Phone: record.fields['Phone'],
        Email: record.fields['Email'], Region: record.fields['Region'],
        Industry: record.fields['Industry'], Founded: record.fields['Founded'],
        Revenue: record.fields['Revenue'], CallTime: record.fields['CallTime'],
        Amount: record.fields['Amount'], FundType: record.fields['FundType'],
        Message: record.fields['Message'], Date: record.fields['Date'],
        Time: record.fields['Time'], Status: record.fields['Status'] || '신규',
        Memo: record.fields['Memo'] || ''
      }));

      return new Response(JSON.stringify({ success: true, leads }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // PATCH /leads/:id
  if (method === 'PATCH' && path.startsWith('/leads/')) {
    const recordId = path.replace('/leads/', '');
    try {
      const data = await request.json();
      const fields = {};
      if (data.Status !== undefined) fields['Status'] = data.Status;
      else if (data.상태 !== undefined) fields['Status'] = data.상태;
      if (data.Memo !== undefined) fields['Memo'] = data.Memo;
      else if (data.메모 !== undefined) fields['Memo'] = data.메모;

      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_ID}/${recordId}`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields })
        }
      );

      if (!airtableResponse.ok) {
        const error = await airtableResponse.json();
        return new Response(JSON.stringify({ success: false, error: error.error?.message }), {
          status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      const result = await airtableResponse.json();
      return new Response(JSON.stringify({ success: true, record: result }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // DELETE /leads/:id
  if (method === 'DELETE' && path.startsWith('/leads/')) {
    const recordId = path.replace('/leads/', '');
    try {
      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_ID}/${recordId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
        }
      );

      if (!airtableResponse.ok) {
        const error = await airtableResponse.json();
        return new Response(JSON.stringify({ success: false, error: error.error?.message }), {
          status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      const result = await airtableResponse.json();
      return new Response(JSON.stringify({ success: true, deleted: true, id: result.id }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

// ================================================
// 게시판 API
// ================================================

async function handleBoardAPI(request, env, path) {
  const method = request.method;

  // GET /board or /posts
  if (method === 'GET' && (path === '/board' || path === '/posts')) {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit')) || 0;

      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/board2?sort[0][field]=date&sort[0][direction]=desc`,
        { headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` } }
      );

      if (!airtableResponse.ok) {
        return new Response(JSON.stringify({ posts: [], records: [] }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      const data = await airtableResponse.json();
      let records = (data.records || []).map(record => ({
        id: record.id,
        제목: record.fields['title'] || '',
        내용: record.fields['content'] || '',
        요약: record.fields['summary'] || record.fields['content']?.substring(0, 100) || '',
        카테고리: record.fields['category'] || record.fields['tag'] || '',
        썸네일URL: record.fields['thumbnailUrl'] || '',
        태그: record.fields['tags'] || record.fields['tag'] || '',
        작성일: record.fields['date'] || '',
        조회수: record.fields['views'] || 0,
        게시여부: record.fields['isPublic'] !== false,
        slug: record.fields['slug'] || ''
      }));

      if (limit > 0) records = records.slice(0, limit);

      // post.html 관련글에서 사용하는 영문키 posts 배열도 함께 반환
      const posts = records.map(r => ({
        id: r.id,
        title: r.제목,
        content: r.내용,
        description: r.요약,
        category: r.카테고리,
        thumbnail: r.썸네일URL,
        tags: r.태그,
        date: r.작성일,
        views: r.조회수,
        isPublic: r.게시여부,
        slug: r.slug
      }));

      return new Response(JSON.stringify({ records, posts }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // POST /board
  if (method === 'POST' && path === '/board') {
    try {
      const data = await request.json();
      const fields = {
        title: data.제목 || '',
        content: data.내용 || '',
        summary: data.요약 || '',
        category: data.카테고리 || '',
        tags: data.태그 || '',
        thumbnailUrl: data.썸네일URL || '',
        date: data.작성일 || formatDateKST(new Date()),
        isPublic: data.게시여부 !== false
      };

      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/board2`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields })
        }
      );

      if (!airtableResponse.ok) {
        const error = await airtableResponse.json();
        return new Response(JSON.stringify({ success: false, error: error.error?.message }), {
          status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      const result = await airtableResponse.json();
      return new Response(JSON.stringify({ success: true, id: result.id }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // PATCH /board/:id
  if (method === 'PATCH' && path.startsWith('/board/')) {
    const recordId = path.replace('/board/', '');
    try {
      // 정적 게시글 수정 차단
      const checkResponse = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/board2/${recordId}`,
        { headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` } }
      );
      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        const slug = checkResult.fields?.slug;
        if (slug && STATIC_SLUGS.includes(slug)) {
          return new Response(JSON.stringify({ success: false, error: '샘플 게시글은 수정할 수 없습니다.' }), {
            status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }
      }

      const data = await request.json();
      const fields = {};
      if (data.제목 !== undefined) fields.title = data.제목;
      if (data.내용 !== undefined) fields.content = data.내용;
      if (data.요약 !== undefined) fields.summary = data.요약;
      if (data.카테고리 !== undefined) fields.category = data.카테고리;
      if (data.태그 !== undefined) fields.tags = data.태그;
      if (data.썸네일URL !== undefined) fields.thumbnailUrl = data.썸네일URL;
      if (data.작성일 !== undefined) fields.date = data.작성일;
      if (data.게시여부 !== undefined) fields.isPublic = data.게시여부;

      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/board2/${recordId}`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields })
        }
      );

      if (!airtableResponse.ok) {
        const error = await airtableResponse.json();
        return new Response(JSON.stringify({ success: false, error: error.error?.message }), {
          status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      const result = await airtableResponse.json();
      return new Response(JSON.stringify({ success: true, id: result.id }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // DELETE /board/:id
  if (method === 'DELETE' && path.startsWith('/board/')) {
    const recordId = path.replace('/board/', '');
    try {
      // 정적 게시글 삭제 차단
      const checkResponse = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/board2/${recordId}`,
        { headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` } }
      );
      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        const slug = checkResult.fields?.slug;
        if (slug && STATIC_SLUGS.includes(slug)) {
          return new Response(JSON.stringify({ success: false, error: '샘플 게시글은 삭제할 수 없습니다.' }), {
            status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }
      }

      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/board2/${recordId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
        }
      );

      if (!airtableResponse.ok) {
        const error = await airtableResponse.json();
        return new Response(JSON.stringify({ success: false, error: error.error?.message }), {
          status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      const result = await airtableResponse.json();
      return new Response(JSON.stringify({ success: true, deleted: true, id: result.id }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // GET /posts/:id
  if (method === 'GET' && path.startsWith('/posts/')) {
    try {
      const recordId = path.replace('/posts/', '');
      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/board2/${recordId}`,
        { headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` } }
      );

      const record = await airtableResponse.json();
      const post = {
        id: record.id,
        title: record.fields['title'] || '',
        content: record.fields['content'] || '',
        description: record.fields['summary'] || record.fields['content']?.substring(0, 150) || '',
        category: record.fields['category'] || record.fields['tag'] || '',
        thumbnail: record.fields['thumbnailUrl'] || '',
        tags: record.fields['tags'] || record.fields['tag'] || '',
        date: record.fields['date'] || '',
        views: record.fields['views'] || 0,
        isPublic: record.fields['isPublic'] || false,
        slug: record.fields['slug'] || ''
      };

      return new Response(JSON.stringify({ post }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

// ================================================
// 팝업 API
// ================================================

async function handlePopupsAPI(request, env, path) {
  const method = request.method;
  const TABLE = 'popups';

  // GET /popups/all
  if (method === 'GET' && path === '/popups/all') {
    try {
      const res = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${TABLE}?sort[0][field]=order&sort[0][direction]=asc`,
        { headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` } }
      );
      const data = await res.json();
      const popups = (data.records || []).map(r => ({
        id: r.id,
        title: r.fields.title || '',
        altText: r.fields.altText || '',
        imageUrl: r.fields.imageUrl || '',
        linkUrl: r.fields.linkUrl || '',
        linkTarget: r.fields.linkTarget || '_self',
        order: r.fields.order || 1,
        isActive: r.fields.isActive || false,
        startDate: r.fields.startDate || null,
        endDate: r.fields.endDate || null
      }));
      return new Response(JSON.stringify({ popups }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ popups: [], error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // POST /popups
  if (method === 'POST' && path === '/popups') {
    try {
      const data = await request.json();
      const fields = {
        title: data.title, altText: data.altText, imageUrl: data.imageUrl,
        linkUrl: data.linkUrl || '', linkTarget: data.linkTarget || '_self',
        order: data.order || 1, isActive: data.isActive || false,
        startDate: data.startDate || '', endDate: data.endDate || ''
      };
      const res = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${TABLE}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      const result = await res.json();
      return new Response(JSON.stringify({ success: res.ok, id: result.id, error: result.error?.message }), {
        status: res.ok ? 200 : 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // PATCH /popups/:id
  if (method === 'PATCH' && path.startsWith('/popups/')) {
    const id = path.replace('/popups/', '');
    try {
      const data = await request.json();
      const fields = {};
      if (data.title !== undefined) fields.title = data.title;
      if (data.altText !== undefined) fields.altText = data.altText;
      if (data.imageUrl !== undefined) fields.imageUrl = data.imageUrl;
      if (data.linkUrl !== undefined) fields.linkUrl = data.linkUrl;
      if (data.linkTarget !== undefined) fields.linkTarget = data.linkTarget;
      if (data.order !== undefined) fields.order = data.order;
      if (data.isActive !== undefined) fields.isActive = data.isActive;
      if (data.startDate !== undefined) fields.startDate = data.startDate;
      if (data.endDate !== undefined) fields.endDate = data.endDate;

      const res = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${TABLE}/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      const result = await res.json();
      return new Response(JSON.stringify({ success: res.ok, error: result.error?.message }), {
        status: res.ok ? 200 : 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // DELETE /popups/:id
  if (method === 'DELETE' && path.startsWith('/popups/')) {
    const id = path.replace('/popups/', '');
    try {
      const res = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${TABLE}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
      });
      return new Response(JSON.stringify({ success: res.ok }), {
        status: res.ok ? 200 : 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

// ================================================
// 임직원 API
// ================================================

async function handleEmployeesAPI(request, env, path) {
  const method = request.method;
  const TABLE = 'employees';

  // GET /employees/all
  if (method === 'GET' && path === '/employees/all') {
    try {
      const res = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${TABLE}?sort[0][field]=order&sort[0][direction]=asc`,
        { headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` } }
      );
      const data = await res.json();
      const employees = (data.records || []).map(r => ({
        id: r.id,
        이름: r.fields.name || '',
        직책: r.fields.position || '',
        소개: r.fields.intro || '',
        프로필이미지URL: r.fields.profileImageUrl || '',
        이미지위치: r.fields.imagePosition || 'center 20%',
        순서: r.fields.order || 1,
        공개여부: r.fields.isActive || false,
        자금유형: r.fields.fundType || '',
        업무영역: r.fields.workArea || '',
        산업분야: r.fields.industry || ''
      }));
      return new Response(JSON.stringify({ employees }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ employees: [], error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // POST /employees
  if (method === 'POST' && path === '/employees') {
    try {
      const data = await request.json();
      const fields = {
        name: data.이름, position: data.직책, intro: data.소개 || '',
        profileImageUrl: data.프로필이미지URL || '', imagePosition: data.이미지위치 || 'center 20%',
        order: data.순서 || 1, isActive: data.공개여부 || false,
        fundType: data.자금유형 || '', workArea: data.업무영역 || '', industry: data.산업분야 || ''
      };
      const res = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${TABLE}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      const result = await res.json();
      return new Response(JSON.stringify({ success: res.ok, id: result.id, error: result.error?.message }), {
        status: res.ok ? 200 : 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // PATCH /employees/:id
  if (method === 'PATCH' && path.startsWith('/employees/')) {
    const id = path.replace('/employees/', '');
    try {
      const data = await request.json();
      const fields = {};
      if (data.이름 !== undefined) fields.name = data.이름;
      if (data.직책 !== undefined) fields.position = data.직책;
      if (data.소개 !== undefined) fields.intro = data.소개;
      if (data.프로필이미지URL !== undefined) fields.profileImageUrl = data.프로필이미지URL;
      if (data.이미지위치 !== undefined) fields.imagePosition = data.이미지위치;
      if (data.순서 !== undefined) fields.order = data.순서;
      if (data.공개여부 !== undefined) fields.isActive = data.공개여부;
      if (data.자금유형 !== undefined) fields.fundType = data.자금유형;
      if (data.업무영역 !== undefined) fields.workArea = data.업무영역;
      if (data.산업분야 !== undefined) fields.industry = data.산업분야;

      const res = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${TABLE}/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      const result = await res.json();
      return new Response(JSON.stringify({ success: res.ok, error: result.error?.message }), {
        status: res.ok ? 200 : 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // DELETE /employees/:id
  if (method === 'DELETE' && path.startsWith('/employees/')) {
    const id = path.replace('/employees/', '');
    try {
      const res = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${TABLE}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
      });
      return new Response(JSON.stringify({ success: res.ok }), {
        status: res.ok ? 200 : 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

// ================================================
// GA4 Analytics API (Google Analytics Data API v1beta)
// ================================================

// Base64URL 인코딩 (JWT용)
function base64url(source) {
  let str = '';
  const bytes = new Uint8Array(source);
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// PEM → CryptoKey 변환
async function importPrivateKey(pem) {
  const pemContents = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', binaryDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

// JWT 생성 → Google OAuth2 액세스 토큰 교환
async function getGoogleAccessToken(env) {
  const sa = JSON.parse(env.GA_SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const sigInput = `${headerB64}.${payloadB64}`;

  const key = await importPrivateKey(sa.private_key);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(sigInput));
  const jwt = `${sigInput}.${base64url(signature)}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error('토큰 발급 실패: ' + JSON.stringify(tokenData));
  return tokenData.access_token;
}

// GA4 Data API 호출 헬퍼
async function ga4RunReport(accessToken, propertyId, body) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error?.message || JSON.stringify(data);
    throw new Error(`GA4 API ${res.status}: ${msg}`);
  }
  return data;
}

// 기간 문자열 생성 (daysAgo → YYYY-MM-DD)
function daysAgoDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

// GA4 Analytics 메인 핸들러
async function handleAnalyticsAPI(request, env, url, path) {
  if (!env.GA_SERVICE_ACCOUNT_JSON || !env.GA_PROPERTY_ID) {
    return new Response(JSON.stringify({
      error: 'GA4 설정 필요',
      message: 'GA_SERVICE_ACCOUNT_JSON과 GA_PROPERTY_ID 환경변수를 설정해주세요.'
    }), { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }

  try {
    const accessToken = await getGoogleAccessToken(env);
    const propertyId = env.GA_PROPERTY_ID;

    // GET /analytics/all?period=7 or period=daily/weekly/monthly
    if (path === '/analytics/all') {
      const rawPeriod = url.searchParams.get('period') || '7';
      const periodMap = { daily: 1, weekly: 7, monthly: 30 };
      const period = periodMap[rawPeriod] || parseInt(rawPeriod) || 7;
      const startDate = daysAgoDate(period);
      const endDate = daysAgoDate(0);
      const prevStartDate = daysAgoDate(period * 2);
      const prevEndDate = daysAgoDate(period + 1);

      // 병렬 리포트 요청
      const [overview, pages, sources, devices, trend, prevOverview] = await Promise.all([
        // 1. 개요 (방문자수, 페이지뷰, 세션, 이벤트수, 평균세션시간)
        ga4RunReport(accessToken, propertyId, {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'activeUsers' }, { name: 'screenPageViews' },
            { name: 'sessions' }, { name: 'eventCount' },
            { name: 'averageSessionDuration' }, { name: 'newUsers' },
            { name: 'bounceRate' }
          ]
        }),
        // 2. 인기 페이지
        ga4RunReport(accessToken, propertyId, {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 10
        }),
        // 3. 유입 소스
        ga4RunReport(accessToken, propertyId, {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10
        }),
        // 4. 디바이스
        ga4RunReport(accessToken, propertyId, {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
        }),
        // 5. 일별 추이
        ga4RunReport(accessToken, propertyId, {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }],
          orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }]
        }),
        // 6. 이전 기간 개요 (비교용)
        ga4RunReport(accessToken, propertyId, {
          dateRanges: [{ startDate: prevStartDate, endDate: prevEndDate }],
          metrics: [
            { name: 'activeUsers' }, { name: 'screenPageViews' },
            { name: 'sessions' }, { name: 'averageSessionDuration' },
            { name: 'bounceRate' }
          ]
        })
      ]);

      // 응답 데이터 구성 (대시보드 형식에 맞춤)
      const getMetricVal = (report, idx) => {
        const rows = report.rows || [];
        return rows.length > 0 ? parseFloat(rows[0].metricValues[idx].value) : 0;
      };

      const calcChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.round(seconds % 60);
        return m > 0 ? `${m}분 ${s}초` : `${s}초`;
      };

      // 현재/이전 기간 값
      const curUsers = getMetricVal(overview, 0);
      const curPageViews = getMetricVal(overview, 1);
      const curSessions = getMetricVal(overview, 2);
      const curEventCount = getMetricVal(overview, 3);
      const curDuration = getMetricVal(overview, 4);
      const curNewUsers = getMetricVal(overview, 5);
      const curBounce = getMetricVal(overview, 6);

      const prevUsers = getMetricVal(prevOverview, 0);
      const prevPageViews = getMetricVal(prevOverview, 1);
      const prevSessions = getMetricVal(prevOverview, 2);
      const prevDuration = getMetricVal(prevOverview, 3);
      const prevBounce = getMetricVal(prevOverview, 4);

      // 트래픽 소스 퍼센트 계산
      const sourceRows = (sources.rows || []).map(r => ({
        source: r.dimensionValues[0].value || '(direct)',
        sessions: parseInt(r.metricValues[0].value),
        users: parseInt(r.metricValues[1].value)
      }));
      const totalSessions = sourceRows.reduce((sum, s) => sum + s.sessions, 0);

      const result = {
        period,
        overview: {
          visitors: { value: curUsers, change: calcChange(curUsers, prevUsers) },
          pageviews: { value: curPageViews, change: calcChange(curPageViews, prevPageViews) },
          duration: { value: formatDuration(curDuration), change: calcChange(curDuration, prevDuration) },
          bounceRate: { value: Math.round(curBounce * 100), change: calcChange(curBounce, prevBounce) },
          sessions: curSessions,
          newUsers: curNewUsers,
          eventCount: curEventCount
        },
        pages: (pages.rows || []).map(r => ({
          path: r.dimensionValues[0].value,
          title: r.dimensionValues[1].value,
          views: parseInt(r.metricValues[0].value),
          users: parseInt(r.metricValues[1].value)
        })),
        traffic: {
          sources: sourceRows.map(s => ({
            source: s.source,
            sessions: s.sessions,
            percentage: totalSessions > 0 ? Math.round((s.sessions / totalSessions) * 100) : 0
          }))
        },
        sources: sourceRows,
        devices: (devices.rows || []).map(r => ({
          device: r.dimensionValues[0].value,
          users: parseInt(r.metricValues[0].value),
          sessions: parseInt(r.metricValues[1].value)
        })),
        trend: {
          trend: (trend.rows || []).map(r => ({
            date: r.dimensionValues[0].value,
            visitors: parseInt(r.metricValues[0].value),
            pageviews: parseInt(r.metricValues[1].value),
            sessions: parseInt(r.metricValues[2].value)
          }))
        }
      };

      return new Response(JSON.stringify(result), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // GET /history/cached?days=7 (일별 데이터 — 대시보드 형식)
    if (path === '/history/cached' || path === '/history/stats') {
      const days = parseInt(url.searchParams.get('days')) || 7;
      const startDate = daysAgoDate(days);
      const endDate = daysAgoDate(0);

      const report = await ga4RunReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' }, { name: 'screenPageViews' },
          { name: 'sessions' }, { name: 'newUsers' },
          { name: 'averageSessionDuration' }, { name: 'bounceRate' }
        ],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }]
      });

      const data = (report.rows || []).map(r => {
        const rawDate = r.dimensionValues[0].value; // YYYYMMDD
        const formattedDate = rawDate.length === 8
          ? `${rawDate.slice(0,4)}-${rawDate.slice(4,6)}-${rawDate.slice(6,8)}`
          : rawDate;
        return {
          date: formattedDate,
          visitors: parseInt(r.metricValues[0].value),
          pageviews: parseInt(r.metricValues[1].value),
          sessions: parseInt(r.metricValues[2].value),
          new_users: parseInt(r.metricValues[3].value),
          avg_duration: parseFloat(r.metricValues[4].value),
          bounce_rate: parseFloat(r.metricValues[5].value)
        };
      });

      return new Response(JSON.stringify({ data, days }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// ================================================
// 일별통계 수집 + Airtable 저장 + 텔레그램 리포트
// ================================================

const STATS_TABLE = encodeURIComponent('일별통계');

function getYesterdayKST() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  now.setDate(now.getDate() - 1);
  return now.toISOString().split('T')[0];
}

async function collectAndSaveDailyAnalytics(env) {
  const targetDate = getYesterdayKST();
  const accessToken = await getGoogleAccessToken(env);
  const propertyId = env.GA_PROPERTY_ID;

  const [summary, trafficSources, deviceData, topPages] = await Promise.all([
    ga4RunReport(accessToken, propertyId, {
      dateRanges: [{ startDate: targetDate, endDate: targetDate }],
      metrics: [
        { name: 'totalUsers' }, { name: 'screenPageViews' },
        { name: 'averageSessionDuration' }, { name: 'bounceRate' },
        { name: 'sessions' }, { name: 'newUsers' }
      ]
    }),
    ga4RunReport(accessToken, propertyId, {
      dateRanges: [{ startDate: targetDate, endDate: targetDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10
    }),
    ga4RunReport(accessToken, propertyId, {
      dateRanges: [{ startDate: targetDate, endDate: targetDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
    }),
    ga4RunReport(accessToken, propertyId, {
      dateRanges: [{ startDate: targetDate, endDate: targetDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10
    })
  ]);

  const getVal = (report, idx) => {
    const rows = report.rows || [];
    return rows.length > 0 ? parseFloat(rows[0].metricValues[idx].value) : 0;
  };

  const visitors = getVal(summary, 0);
  const pageViews = getVal(summary, 1);
  const avgDuration = Math.round(getVal(summary, 2));
  const bounceRate = Math.round(getVal(summary, 3) * 100);
  const sessions = getVal(summary, 4);
  const newUsers = getVal(summary, 5);

  const totalTrafficSessions = (trafficSources.rows || []).reduce((s, r) => s + parseInt(r.metricValues[0].value), 0);
  const trafficArr = (trafficSources.rows || []).map(r => {
    const count = parseInt(r.metricValues[0].value);
    return { source: r.dimensionValues[0].value, count, percent: totalTrafficSessions > 0 ? Math.round((count / totalTrafficSessions) * 100) : 0 };
  });

  const totalDeviceUsers = (deviceData.rows || []).reduce((s, r) => s + parseInt(r.metricValues[0].value), 0);
  const deviceArr = (deviceData.rows || []).map(r => {
    const count = parseInt(r.metricValues[0].value);
    return { type: r.dimensionValues[0].value, count, percent: totalDeviceUsers > 0 ? Math.round((count / totalDeviceUsers) * 100) : 0 };
  });

  const pagesArr = (topPages.rows || []).map(r => ({
    path: r.dimensionValues[0].value,
    views: parseInt(r.metricValues[0].value)
  }));

  // Airtable upsert
  const fields = {
    '날짜': targetDate,
    '방문자': visitors,
    '페이지뷰': pageViews,
    '세션': sessions,
    '신규방문자': newUsers,
    '평균체류초': avgDuration,
    '이탈률': bounceRate,
    '트래픽소스': JSON.stringify(trafficArr),
    '상위페이지': JSON.stringify(pagesArr),
    '기기분포': JSON.stringify(deviceArr)
  };

  const filterFormula = encodeURIComponent(`{날짜}='${targetDate}'`);
  const checkRes = await fetch(
    `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${STATS_TABLE}?filterByFormula=${filterFormula}`,
    { headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` } }
  );
  const checkData = await checkRes.json();

  let airtableAction;
  if (checkData.records && checkData.records.length > 0) {
    const patchRes = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${STATS_TABLE}/${checkData.records[0].id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (!patchRes.ok) throw new Error('Airtable 업데이트 실패: ' + (await patchRes.text()));
    airtableAction = '업데이트';
  } else {
    const postRes = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${STATS_TABLE}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (!postRes.ok) throw new Error('Airtable 생성 실패: ' + (await postRes.text()));
    airtableAction = '신규 생성';
  }

  return { targetDate, visitors, pageViews, sessions, newUsers, avgDuration, bounceRate, trafficArr, pagesArr, deviceArr, airtableAction };
}

async function sendDailyTelegramReport(env, data) {
  const { targetDate, visitors, pageViews, sessions, newUsers, avgDuration, bounceRate, trafficArr, pagesArr, airtableAction } = data;
  const dur = avgDuration >= 60 ? `${Math.floor(avgDuration / 60)}분 ${avgDuration % 60}초` : `${avgDuration}초`;

  let msg = `📊 <b>K-자금컴퍼니 일별통계</b>\n\n`;
  msg += `📅 ${targetDate}\n`;
  msg += `├ 방문자: <b>${visitors}</b>\n`;
  msg += `├ 페이지뷰: <b>${pageViews}</b>\n`;
  msg += `├ 세션: ${sessions}\n`;
  msg += `├ 신규방문: ${newUsers}\n`;
  msg += `├ 평균체류: ${dur}\n`;
  msg += `└ 이탈률: ${bounceRate}%\n`;

  if (trafficArr.length > 0) {
    msg += `\n🔗 <b>유입경로</b>\n`;
    const top5 = trafficArr.slice(0, 5);
    top5.forEach((s, i) => {
      msg += `${i === top5.length - 1 ? '└' : '├'} ${s.source}: ${s.count}회 (${s.percent}%)\n`;
    });
  }

  if (pagesArr.length > 0) {
    msg += `\n📄 <b>상위페이지</b>\n`;
    const top5 = pagesArr.slice(0, 5);
    top5.forEach((p, i) => {
      msg += `${i === top5.length - 1 ? '└' : '├'} ${p.path}: ${p.views}뷰\n`;
    });
  }

  msg += `\n✅ Airtable ${airtableAction}`;

  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg, parse_mode: 'HTML' })
  });
}

// Airtable에서 저장된 히스토리 조회
async function getStoredHistory(env, days) {
  const startDate = daysAgoDate(days);
  const sortField = encodeURIComponent('날짜');
  const res = await fetch(
    `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${STATS_TABLE}?sort[0][field]=${sortField}&sort[0][direction]=asc`,
    { headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` } }
  );
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return (data.records || [])
    .filter(r => {
      const d = r.fields['날짜'];
      return d && d >= startDate;
    })
    .map(r => ({
      date: (r.fields['날짜'] || '').replace(/-/g, ''),
      visitors: r.fields['방문자'] || 0,
      pageViews: r.fields['페이지뷰'] || 0,
      sessions: r.fields['세션'] || 0,
      newUsers: r.fields['신규방문자'] || 0,
      avgDuration: r.fields['평균체류초'] || 0,
      bounceRate: r.fields['이탈률'] || 0,
      trafficSources: r.fields['트래픽소스'] ? JSON.parse(r.fields['트래픽소스']) : [],
      topPages: r.fields['상위페이지'] ? JSON.parse(r.fields['상위페이지']) : [],
      devices: r.fields['기기분포'] ? JSON.parse(r.fields['기기분포']) : []
    }));
}

// ================================================
// 메인 라우터
// ================================================

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // OTP 요청
      if (path === '/auth/otp' && request.method === 'POST') {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        await env.OTP_KV.put('admin_otp', code, { expirationTtl: 300 });

        const msg = `🔐 <b>K-자금컴퍼니 관리자 인증</b>\n\n인증번호: <code>${code}</code>\n\n⏱ 5분 내 입력해주세요.`;
        const tgRes = await fetch(
          `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: env.TELEGRAM_CHAT_ID,
              text: msg,
              parse_mode: 'HTML'
            })
          }
        );

        const tgOk = tgRes.ok;
        return new Response(JSON.stringify({ success: tgOk, error: tgOk ? null : '텔레그램 발송 실패' }), {
          status: tgOk ? 200 : 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      // OTP 검증
      if (path === '/auth' && request.method === 'POST') {
        const { code } = await request.json();
        const stored = await env.OTP_KV.get('admin_otp');

        if (!stored) {
          return new Response(JSON.stringify({ success: false, error: '인증번호가 만료되었습니다. 다시 요청해주세요.' }), {
            status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }

        if (code !== stored) {
          return new Response(JSON.stringify({ success: false, error: '인증번호가 올바르지 않습니다' }), {
            status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }

        await env.OTP_KV.delete('admin_otp');
        return new Response(JSON.stringify({
          success: true, token: crypto.randomUUID(), expiresIn: 24 * 60 * 60 * 1000
        }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      // 헬스 체크
      if (path === '/health') {
        return new Response(JSON.stringify({
          status: 'ok', service: 'kfund-api', version: '1.0.0',
          features: ['submit', 'leads', 'board'],
          env_status: {
            AIRTABLE_TOKEN: !!env.AIRTABLE_TOKEN,
            AIRTABLE_BASE_ID: !!env.AIRTABLE_BASE_ID,
            TELEGRAM_BOT_TOKEN: !!env.TELEGRAM_BOT_TOKEN,
            GMAIL_CLIENT_ID: !!env.GMAIL_CLIENT_ID
          }
        }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      // R2 이미지 서빙 (GET /r2/board/...)
      if (path.startsWith('/r2/') && request.method === 'GET') {
        if (!env.BUCKET) {
          return new Response('R2 not configured', { status: 500 });
        }
        const objectKey = path.substring(4); // '/r2/board/xxx.webp' → 'board/xxx.webp'
        const object = await env.BUCKET.get(objectKey);
        if (!object) {
          return new Response('Not Found', { status: 404 });
        }
        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'image/webp');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(object.body, { headers });
      }

      // 이미지 업로드
      if (path === '/upload' && request.method === 'POST') {
        if (!env.BUCKET) {
          return new Response(JSON.stringify({ success: false, error: 'R2 bucket not bound' }), {
            status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) {
          return new Response(JSON.stringify({ success: false, error: 'No file provided' }), {
            status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop() || 'webp';
        const fileName = `board/${timestamp}-${randomStr}.${ext}`;

        const arrayBuffer = await file.arrayBuffer();
        await env.BUCKET.put(fileName, arrayBuffer, {
          httpMetadata: { contentType: file.type || 'image/webp' }
        });

        const publicUrl = `https://pub-d4f7fa5a4cb648d48f34274fcba1d283.r2.dev/${fileName}`;
        return new Response(JSON.stringify({ success: true, url: publicUrl, fileName }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      // 문의 접수
      if (request.method === 'POST' && (path === '/' || path === '/submit')) {
        return await handleSubmit(request, env);
      }

      // 접수내역
      if (path === '/leads' || path.startsWith('/leads/')) {
        return await handleLeadsAPI(request, env, path);
      }

      // 관련 게시글 API
      if (path === '/api/posts/related' && request.method === 'GET') {
        try {
          const slug = url.searchParams.get('slug') || '';
          const limit = parseInt(url.searchParams.get('limit')) || 3;

          const airtableResponse = await fetch(
            `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/board2?sort[0][field]=date&sort[0][direction]=desc`,
            { headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` } }
          );

          if (!airtableResponse.ok) {
            return new Response(JSON.stringify({ posts: [] }), {
              headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
          }

          const data = await airtableResponse.json();
          const posts = (data.records || [])
            .filter(r => r.fields['slug'] !== slug)
            .slice(0, limit)
            .map(r => ({
              id: r.id,
              title: r.fields['title'] || '',
              summary: r.fields['content']?.substring(0, 100) || '',
              category: r.fields['tag'] || '',
              thumbnail: r.fields['thumbnailUrl'] || '',
              date: r.fields['date'] || '',
              slug: r.fields['slug'] || ''
            }));

          return new Response(JSON.stringify({ posts }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ posts: [], error: error.message }), {
            status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }
      }

      // 게시판
      if (path === '/board' || path.startsWith('/board/') || path === '/posts' || path.startsWith('/posts/')) {
        return await handleBoardAPI(request, env, path);
      }

      // 팝업
      if (path === '/popups' || path.startsWith('/popups/')) {
        return await handlePopupsAPI(request, env, path);
      }

      // 임직원
      if (path === '/employees' || path.startsWith('/employees/')) {
        return await handleEmployeesAPI(request, env, path);
      }

      // GA4 Analytics (실시간)
      if (path === '/analytics/all' || path.startsWith('/history/')) {
        return await handleAnalyticsAPI(request, env, url, path);
      }

      // 저장된 일별통계 조회 (Airtable)
      if (path === '/analytics/stored') {
        try {
          const days = parseInt(url.searchParams.get('days')) || 30;
          const history = await getStoredHistory(env, days);
          return new Response(JSON.stringify({ history, days }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }
      }

      // 수동 일별통계 수집 트리거 (테스트용)
      if (path === '/analytics/collect' && request.method === 'POST') {
        try {
          const data = await collectAndSaveDailyAnalytics(env);
          await sendDailyTelegramReport(env, data);
          return new Response(JSON.stringify({ success: true, ...data }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }
      }

      // 404
      return new Response(JSON.stringify({ error: 'Not found', path }), {
        status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  },

  // 매일 09:00 KST (00:00 UTC) 크론 트리거
  async scheduled(event, env, ctx) {
    try {
      const data = await collectAndSaveDailyAnalytics(env);
      await sendDailyTelegramReport(env, data);
    } catch (error) {
      const targetDate = getYesterdayKST();
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: `🚨 <b>K-자금컴퍼니 일별통계 오류</b>\n\n📅 대상: ${targetDate}\n❌ ${String(error.message || error).substring(0, 500)}`,
          parse_mode: 'HTML'
        })
      });
    }
  }
};
