export async function onRequest(context) {
  const { request, env } = context;
  const API_BASE = env.API_BASE || 'https://api.example.com'; // 你的API地址
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') || 'en';

  // 多语言字典
  const i18n = {
    en: {
      inbox: "Inbox",
      sent: "Sent",
      from: "From",
      to: "To",
      subject: "Subject",
      date: "Date",
      mail_detail: "Mail Detail",
      logout: "Logout",
      login: "Login",
      mail_none: "No mail found.",
      mailbox: "Mailbox",
      send: "Send",
      new_mail: "Compose",
      loading: "Loading...",
      error_load: "Error loading data.",
      no_subject: "(No subject)"
    },
    zh: {
      inbox: "收件箱",
      sent: "发件箱",
      from: "发件人",
      to: "收件人",
      subject: "主题",
      date: "日期",
      mail_detail: "邮件详情",
      logout: "退出登录",
      login: "登录",
      mail_none: "暂无邮件。",
      mailbox: "邮箱",
      send: "发送",
      new_mail: "写信",
      loading: "加载中...",
      error_load: "数据加载失败。",
      no_subject: "（无主题）"
    }
  }[lang] || i18n['en'];

  // 自动带cookie请求API
  async function fetchApi(path) {
    const res = await fetch(API_BASE + path, {
      credentials: "include", // 保证带cookie
      headers: { 'Accept': 'application/json' }
    });
    return await res.json();
  }

  // 简单的auth检测
  let user = null;
  let errorMsg = '';
  try {
    const auth = await fetchApi('/user/check');
    if (auth.loggedIn) {
      user = true;
    }
  } catch (e) { errorMsg = i18n.error_load; }

  // 获取收件箱、发件箱邮件
  let inbox = [], sent = [];
  if (user) {
    try {
      const inboxRes = await fetchApi('/user/inbox');
      if (inboxRes.mails) inbox = inboxRes.mails;
      const sentRes = await fetchApi('/user/sent');
      if (sentRes.mails) sent = sentRes.mails;
    } catch (e) { errorMsg = i18n.error_load; }
  }

  // HTML模板工具
  function h(strings, ...values) {
    return strings.map((s, i) => s + (values[i] || '')).join('');
  }
  function esc(str) {
    return (str || '').replace(/[<>&"'`]/g, c =>
      ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;'})[c]
    );
  }

  // 邮件行模板
  function mailRow(mail, boxType) {
    return h`
    <tr tabindex="0" aria-label="${i18n.subject}: ${esc(mail.subject) || i18n.no_subject}, ${boxType==='inbox'? i18n.from: i18n.to}: ${esc(boxType==='inbox'?mail.mail_from:mail.mail_to)}, ${i18n.date}: ${esc(mail.created_at)}">
      <td>${esc(boxType==='inbox'?mail.mail_from:mail.mail_to)}</td>
      <td>${esc(mail.subject) || i18n.no_subject}</td>
      <td>${esc(mail.created_at)}</td>
      <td><a href="?box=${boxType}&id=${mail.id}&lang=${lang}" aria-label="${i18n.mail_detail}">🔍</a></td>
    </tr>`;
  }

  // 邮件详情
  let mailDetailHtml = '';
  const showId = url.searchParams.get('id');
  const showBox = url.searchParams.get('box');
  if (user && showId && (showBox==='inbox'||showBox==='sent')) {
    let detail = null;
    try {
      const res = await fetchApi(`/user/${showBox==='inbox'?'mail':'sentmail'}?id=${encodeURIComponent(showId)}`);
      if (res.mail) detail = res.mail;
    } catch {}
    if (detail) {
      mailDetailHtml = h`
      <div role="dialog" aria-modal="true" class="mail-detail">
        <button onclick="window.history.back()" aria-label="Back">&larr;</button>
        <h2>${esc(detail.subject) || i18n.no_subject}</h2>
        <div><b>${i18n.from}:</b> ${esc(detail.mail_from)}</div>
        <div><b>${i18n.to}:</b> ${esc(detail.mail_to)}</div>
        <div><b>${i18n.date}:</b> ${esc(detail.created_at)}</div>
        <div><b>${i18n.mail_detail}:</b></div>
        <pre tabindex="0">${esc(detail.body)}</pre>
        ${detail.attachments?.length ? `<div><b>Attachments:</b> ${detail.attachments.map(a =>
          `<a href="${API_BASE}/api/attachment?id=${detail.id}&filename=${encodeURIComponent(a.filename)}" download="${esc(a.filename)}">${esc(a.filename)}</a>`
        ).join(' ')}</div>` : ''}
      </div>`;
    }
  }

  // 切换语言按钮
  const langBtn = lang === 'en'
    ? `<a href="?lang=zh" aria-label="切换到中文">中文</a>`
    : `<a href="?lang=en" aria-label="Switch to English">English</a>`;

  // 主页面HTML
  const html = h`
  <!DOCTYPE html>
  <html lang="${lang}">
  <head>
    <meta charset="UTF-8">
    <title>${i18n.mailbox}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      body{font-family:sans-serif;background:#f7f7f7;margin:0;}
      main{max-width:800px;margin:2em auto;padding:1em;background:#fff;border-radius:12px;box-shadow:0 2px 12px #0001;}
      h1{margin-top:0;}
      table{width:100%;border-collapse:collapse;margin-bottom:1em;}
      th,td{padding:.5em .8em;}
      th{background:#e9e9e9;}
      tr:nth-child(even){background:#f9f9f9;}
      a{color:#1575d4;text-decoration:none;}
      a:hover{text-decoration:underline;}
      button{margin:.5em;}
      .mail-detail{background:#f6f8fa;padding:1em;border-radius:8px;}
      [tabindex="0"]:focus{outline:2px solid #36c;}
      @media (max-width:600px){main{padding:.4em;}table,th,td{font-size:.93em;}}
    </style>
  </head>
  <body>
    <main>
      <header style="display:flex;align-items:center;justify-content:space-between;">
        <h1 aria-label="${i18n.mailbox}">${i18n.mailbox}</h1>
        <nav>${langBtn} ${
          user ? `<form method="POST" action="/user/logout" style="display:inline;">
          <button type="submit" aria-label="${i18n.logout}">${i18n.logout}</button></form>`
          : `<a href="/login" aria-label="${i18n.login}">${i18n.login}</a>`
        }</nav>
      </header>
      ${errorMsg ? `<div style="color:#c00">${esc(errorMsg)}</div>` : ''}
      ${
        !user ? `<div>${i18n.login}...</div>` :
        mailDetailHtml ? mailDetailHtml :
        h`
        <nav>
          <a href="?box=inbox&lang=${lang}" aria-label="${i18n.inbox}" style="margin-right:1em;">${i18n.inbox}</a>
          <a href="?box=sent&lang=${lang}" aria-label="${i18n.sent}">${i18n.sent}</a>
        </nav>
        <section>
          <h2>${url.searchParams.get('box')==='sent'?i18n.sent:i18n.inbox}</h2>
          <table aria-label="${url.searchParams.get('box')==='sent'?i18n.sent:i18n.inbox}">
            <thead>
              <tr>
                <th>${url.searchParams.get('box')==='sent'?i18n.to:i18n.from}</th>
                <th>${i18n.subject}</th>
                <th>${i18n.date}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${
                (url.searchParams.get('box')==='sent'?sent:inbox)
                .map(m=>mailRow(m, url.searchParams.get('box')==='sent'?'sent':'inbox')).join('')
                || `<tr><td colspan="4">${i18n.mail_none}</td></tr>`
              }
            </tbody>
          </table>
        </section>
        `
      }
    </main>
    <script>
      // 支持键盘esc关闭详情
      if (window.location.search.includes('id=')) {
        window.addEventListener('keydown', e => { if (e.key==='Escape') window.history.back(); });
      }
    </script>
  </body>
  </html>
  `;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
