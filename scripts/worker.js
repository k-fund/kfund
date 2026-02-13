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
  msg += '\n\n📋 <a href="https://airtable.com/app5d0aevBlybtHhg">접수내역 확인하기</a>';
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
      const records = (data.records || []).map(record => ({
        id: record.id,
        제목: record.fields['title'] || '',
        내용: record.fields['content'] || '',
        요약: record.fields['summary'] || record.fields['content']?.substring(0, 100) || '',
        카테고리: record.fields['category'] || record.fields['tag'] || '',
        썸네일URL: record.fields['thumbnailUrl'] || '',
        태그: record.fields['tags'] || record.fields['tag'] || '',
        작성일: record.fields['date'] || '',
        조회수: record.fields['views'] || 0,
        게시여부: record.fields['isPublic'] !== false
      }));

      return new Response(JSON.stringify({ records }), {
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
        category: data.카테고리 || '',
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
      if (data.카테고리 !== undefined) fields.category = data.카테고리;
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
        summary: record.fields['content']?.substring(0, 100) || '',
        category: record.fields['tag'] || '',
        thumbnail: record.fields['thumbnailUrl'] || '',
        tags: record.fields['tag'] || '',
        date: record.fields['date'] || '',
        views: 0,
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

      // 게시판
      if (path === '/board' || path.startsWith('/board/') || path === '/posts' || path.startsWith('/posts/')) {
        return await handleBoardAPI(request, env, path);
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
  }
};
