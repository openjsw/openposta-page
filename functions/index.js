export async function onRequest(context) {
  const { request, env } = context;
  const API_BASE = env.API_BASE;
  const url = new URL(request.url);
  const params = url.searchParams;
  const lang = params.get('lang') || 'en';
  const i18n = {
    en: {
      mailbox: "Mailbox",
      inbox: "Inbox",
      sent: "Sent",
      from: "From",
      to: "To",
      subject: "Subject",
      date: "Date",
      mail_detail: "Mail Detail",
      login: "Login",
      logout: "Logout",
      register: "Register",
      email: "Email",
      password: "Password",
      send: "Send",
      new_mail: "Compose",
      mail_none: "No mail found.",
      loading: "Loading...",
      error_load: "Error loading data.",
      no_subject: "(No subject)",
      attachment: "Attachment",
      reply: "Reply",
      back: "Back"
    },
    zh: {
      mailbox: "邮箱",
      inbox: "收件箱",
      sent: "发件箱",
      from: "发件人",
      to: "收件人",
      subject: "主题",
      date: "日期",
      mail_detail: "邮件详情",
      login: "登录",
      logout: "退出",
      register: "注册",
      email: "邮箱",
      password: "密码",
      send: "发送",
      new_mail: "写信",
      mail_none: "暂无邮件。",
      loading: "加载中...",
      error_load: "数据加载失败。",
      no_subject: "（无主题）",
      attachment: "附件",
      reply: "回复",
      back: "返回"
    }
  }[lang] || i18n['en'];

  // HTML工具
  function h(strings, ...values) {
    return strings.map((s, i) => s + (values[i] || '')).join('');
  }
  function esc(str) {
    return (str || '').replace(/[<>&"'`]/g, c =>
      ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;'})[c]
    );
  }

  // fetch工具，自动带cookie
  async function fetchApi(path, opt={}) {
    return fetch(API_BASE + path, {
      ...opt,
      credentials: "include",
      headers: {
        ...(opt.headers || {}),
        'Accept': 'application/json',
        ...(opt.body && typeof opt.body === 'string' ? {'Content-Type': 'application/json'} : {})
      }
    }).then(r => r.json());
  }

  // 检查用户是否登录
  let user = null, errorMsg = '';
  try {
    const auth = await fetchApi('/user/check');
    if (auth.loggedIn) user = true;
  } catch (e) { errorMsg = i18n.error_load; }

  // 视图判定
  const isLoginView = params.get('login') === '1';
  const isRegisterView = params.get('register') === '1';
  const box = params.get('box') || 'inbox'; // inbox/sent
  const showId = params.get('id');
  const showBox = params.get('box');

  // 切换语言按钮
  const langBtn = lang === 'en'
    ? `<a href="?${params.toString().replace(/lang=[^&]*/g,'').replace(/^&|&$/g,'')}${params.toString() ? '&' : ''}lang=zh" aria-label="切换到中文">中文</a>`
    : `<a href="?${params.toString().replace(/lang=[^&]*/g,'').replace(/^&|&$/g,'')}${params.toString() ? '&' : ''}lang=en" aria-label="Switch to English">English</a>`;

  // 页头
  const headerHtml = h`
    <header style="display:flex;align-items:center;justify-content:space-between;">
      <h1 aria-label="${i18n.mailbox}">${i18n.mailbox}</h1>
      <nav>${langBtn}
        ${user ? h`
          <form method="POST" action="${API_BASE}/user/logout" style="display:inline;">
            <button type="submit" aria-label="${i18n.logout}">${i18n.logout}</button>
          </form>
        ` : h`
          <a href="/?login=1&lang=${lang}" aria-label="${i18n.login}">${i18n.login}</a> /
          <a href="/?register=1&lang=${lang}" aria-label="${i18n.register}">${i18n.register}</a>
        `}
      </nav>
    </header>
  `;

  // 页面主内容
  let pageHtml = '';

  // 登录表单
  if (!user && isLoginView) {
    pageHtml = h`
      <h2>${i18n.login}</h2>
      <form method="POST" action="${API_BASE}/user/login" autocomplete="on">
        <input name="email" placeholder="${i18n.email}" required autofocus aria-label="${i18n.email}"><br>
        <input type="password" name="password" placeholder="${i18n.password}" required aria-label="${i18n.password}"><br>
        <button type="submit">${i18n.login}</button>
      </form>
      <div><a href="/?register=1&lang=${lang}">${i18n.register}</a></div>
    `;
  }
  // 注册表单
  else if (!user && isRegisterView) {
    pageHtml = h`
      <h2>${i18n.register}</h2>
      <form method="POST" action="${API_BASE}/user/register" autocomplete="on">
        <input name="email" placeholder="${i18n.email}" required autofocus aria-label="${i18n.email}"><br>
        <input type="password" name="password" placeholder="${i18n.password}" required aria-label="${i18n.password}"><br>
        <button type="submit">${i18n.register}</button>
      </form>
      <div><a href="/?login=1&lang=${lang}">${i18n.login}</a></div>
    `;
  }
  // 未登录，显示登录入口
  else if (!user) {
    pageHtml = h`<div>
      <a href="/?login=1&lang=${lang}">${i18n.login}</a> / 
      <a href="/?register=1&lang=${lang}">${i18n.register}</a>
    </div>`;
  }
  // 邮件详情
  else if (showId) {
    let detail = null;
    try {
      const res = await fetchApi(`/user/${showBox==='sent'?'sentmail':'mail'}?id=${encodeURIComponent(showId)}`);
      if (res.mail) detail = res.mail;
    } catch { errorMsg = i18n.error_load; }
    if (detail) {
      pageHtml = h`
        <div role="dialog" aria-modal="true" class="mail-detail">
          <a href="javascript:history.back()" aria-label="${i18n.back}">&larr; ${i18n.back}</a>
          <h2>${esc(detail.subject) || i18n.no_subject}</h2>
          <div><b>${i18n.from}:</b> ${esc(detail.mail_from)}</div>
          <div><b>${i18n.to}:</b> ${esc(detail.mail_to)}</div>
          <div><b>${i18n.date}:</b> ${esc(detail.created_at)}</div>
          <div><b>${i18n.mail_detail}:</b></div>
          <pre tabindex="0">${esc(detail.body)}</pre>
          ${detail.attachments?.length ? `<div><b>${i18n.attachment}:</b> ${detail.attachments.map(a =>
            `<a href="${API_BASE}/api/attachment?id=${detail.id}&filename=${encodeURIComponent(a.filename)}" download="${esc(a.filename)}">${esc(a.filename)}</a>`
          ).join(' ')}</div>` : ''}
        </div>
      `;
    } else {
      pageHtml = `<div>${i18n.mail_none}</div>`;
    }
  }
  // 收件箱/发件箱列表
  else {
    let inbox = [], sent = [];
    try {
      const inboxRes = await fetchApi('/user/inbox');
      if (inboxRes.mails) inbox = inboxRes.mails;
      const sentRes = await fetchApi('/user/sent');
      if (sentRes.mails) sent = sentRes.mails;
    } catch { errorMsg = i18n.error_load; }
    function mailRow(mail, boxType) {
      return h`
        <tr tabindex="0" aria-label="${i18n.subject}: ${esc(mail.subject) || i18n.no_subject}, ${boxType==='inbox'? i18n.from: i18n.to}: ${esc(boxType==='inbox'?mail.mail_from:mail.mail_to)}, ${i18n.date}: ${esc(mail.created_at)}">
          <td>${esc(boxType==='inbox'?mail.mail_from:mail.mail_to)}</td>
          <td>${esc(mail.subject) || i18n.no_subject}</td>
          <td>${esc(mail.created_at)}</td>
          <td><a href="/?box=${boxType}&id=${mail.id}&lang=${lang}" aria-label="${i18n.mail_detail}">🔍</a></td>
        </tr>
      `;
    }
    pageHtml = h`
      <nav>
        <a href="/?box=inbox&lang=${lang}" aria-label="${i18n.inbox}" style="margin-right:1em;">${i18n.inbox}</a>
        <a href="/?box=sent&lang=${lang}" aria-label="${i18n.sent}">${i18n.sent}</a>
      </nav>
      <section>
        <h2>${box==='sent'?i18n.sent:i18n.inbox}</h2>
        <table aria-label="${box==='sent'?i18n.sent:i18n.inbox}">
          <thead>
            <tr>
              <th>${box==='sent'?i18n.to:i18n.from}</th>
              <th>${i18n.subject}</th>
              <th>${i18n.date}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${
              (box==='sent'?sent:inbox)
              .map(m=>mailRow(m, box)).join('')
              || `<tr><td colspan="4">${i18n.mail_none}</td></tr>`
            }
          </tbody>
        </table>
      </section>
    `;
  }

  // 输出HTML
  return new Response(h`
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
      ${headerHtml}
      ${errorMsg ? `<div style="color:#c00">${esc(errorMsg)}</div>` : ''}
      ${pageHtml}
    </main>
    <script>
      // 支持esc关闭详情
      if (window.location.search.includes('id=')) {
        window.addEventListener('keydown', e => { if (e.key==='Escape') window.history.back(); });
      }
    </script>
  </body>
  </html>
  `, { headers: { "content-type": "text/html; charset=utf-8" } });
}
