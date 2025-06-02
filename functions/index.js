export async function onRequest(context) {
  const env = context.env || {};
  const url = new URL(context.request.url);

  // 支持 URL 查询 lang/首选语言/默认环境变量，自动多语言
  let lang = url.searchParams.get('lang')
    || (context.request.headers.get('accept-language')?.split(',')[0] || '').toLowerCase()
    || (env.DEFAULT_LANG || 'zh-CN');
  lang = lang.startsWith('en') ? 'en' : 'zh-CN';

  // 多语言字典
  const i18nDict = {
    'zh-CN': {
      title: env.SITE_TITLE_ZH || '简邮邮局收发件',
      metaDesc: env.META_DESC_ZH || '轻量级邮件客户端',
      inbox: '收件箱', sent: '发件箱', compose: '写信',
      login: '邮箱登录', email: '邮箱', password: '密码', loginBtn: '登录',
      logout: '退出登录', noMail: '暂无邮件', noSent: '暂无发件', send: '发送',
      sentSuccess: '已发送！', sentFail: '发送失败', sending: '发送中...',
      loading: '加载中...', notFound: '邮件不存在或无权限查看。',
      subject: '主题', from: '发件人', to: '收件人', time: '时间', content: '正文',
      netError: '网络错误', loginFail: '登录失败！', loginPending: '登录中...',
      noSubject: '(无主题)', noContent: '(无内容)', loadFail: '加载失败'
    },
    'en': {
      title: env.SITE_TITLE_EN || 'JianMail WebMail',
      metaDesc: env.META_DESC_EN || 'Lightweight mail client',
      inbox: 'Inbox', sent: 'Sent', compose: 'Compose',
      login: 'Mail Login', email: 'Email', password: 'Password', loginBtn: 'Login',
      logout: 'Logout', noMail: 'No mails', noSent: 'No sent mail', send: 'Send',
      sentSuccess: 'Sent!', sentFail: 'Send failed', sending: 'Sending...',
      loading: 'Loading...', notFound: 'Mail not found or no permission.',
      subject: 'Subject', from: 'From', to: 'To', time: 'Time', content: 'Content',
      netError: 'Network Error', loginFail: 'Login failed!', loginPending: 'Logging in...',
      noSubject: '(No subject)', noContent: '(No content)', loadFail: 'Load failed'
    }
  };
  const i18n = i18nDict[lang] || i18nDict['zh-CN'];

  function htmlEscape(str) {
    return String(str || '').replace(/[<>&"]/g, s =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[s]));
  }

  const apiBase = env.API_BASE || '';
  const metaTags = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>${htmlEscape(i18n.title)}</title>
    <meta name="description" content="${htmlEscape(i18n.metaDesc)}">
    <meta name="robots" content="index, follow">
    <meta property="og:title" content="${htmlEscape(i18n.title)}">
    <meta property="og:description" content="${htmlEscape(i18n.metaDesc)}">
  `.replace(/^\s+/gm, '');

  const langSwitcher = `
    <div style="position:absolute;top:10px;right:30px;font-size:14px;z-index:20;">
      <a href="?lang=zh-CN"${lang==='zh-CN'?' style="font-weight:bold"':''}>简体中文</a> |
      <a href="?lang=en"${lang==='en'?' style="font-weight:bold"':''}>English</a>
    </div>
  `;

  const html = `<!DOCTYPE html>
<html lang="${htmlEscape(lang)}">
<head>
  ${metaTags}
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <style>
    body { font-family: system-ui,sans-serif; margin: 0; background: #f8f9fb; }
    .layout { display: flex; min-height: 100vh; }
    .sidebar {
      width: 180px; background: #f7f7f7; box-shadow: 1px 0 8px #0001;
      padding: 34px 0 0 0; display: flex; flex-direction: column;
      align-items: center;
    }
    .sidebar .menu-btn {
      display: block; width: 120px; padding: 11px 0; margin: 7px 0;
      border: none; background: #eaf1fb; color: #3577d4; border-radius: 8px;
      font-size: 15px; cursor: pointer; text-align: left; text-indent: 8px;
      transition: 0.2s;
    }
    .sidebar .menu-btn.active, .sidebar .menu-btn:hover { background: #4285f4; color: #fff; }
    .content {
      flex: 1; max-width: 520px; margin: 36px auto; background: #fff;
      border-radius: 10px; box-shadow: 0 2px 14px #0001; padding: 26px 30px 34px 30px;
      min-height: 420px;
    }
    .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
    .header-bar h2 { margin: 0; }
    .logout-btn { background: none; border: none; color: #999; font-size: 15px; cursor: pointer;}
    .mail-list { margin: 0 0 0 0; }
    .mail-item {
      padding: 13px 0; border-bottom: 1px solid #eee; cursor: pointer; transition: 0.15s;
    }
    .mail-item:hover { background: #f2f7fd; }
    .subject { font-weight: 600; }
    .from, .to { color: #888; font-size: 13px; margin-left: 6px; }
    .date { float: right; color: #aaa; font-size: 12px; }
    .detail-box { margin-top: 22px; padding: 15px; border-radius: 8px; background: #f7fafd; border: 1px solid #e4ebf3; }
    .empty { color: #aaa; text-align: center; margin: 35px 0; }
    .compose-form label { display:block; margin-top: 13px; font-weight:500;}
    .compose-form input, .compose-form textarea {
      width: 100%; padding: 7px 12px; font-size: 15px; border: 1px solid #ccd7e4; border-radius: 5px; margin-top: 3px;
    }
    .compose-form textarea { min-height: 80px; resize: vertical;}
    .compose-form button { margin-top: 17px; padding: 7px 28px; background: #4285f4; color: #fff; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; }
    .compose-form button:disabled { background: #aaa; }
    #loginForm { max-width: 340px; margin: 80px auto; padding: 38px 32px 32px 32px; /* 左右留白更大，底部略窄一点 */ background: #fff; border-radius: 12px; box-shadow: 0 2px 16px #0001; border: 1px solid #f0f0f5; } #loginForm .input-row { margin-bottom: 20px; } #loginForm label { display: block; margin-bottom: 5px; font-size: 15px; color: #222; font-weight: 500; } #loginForm input { width: 100%; padding: 10px 13px; font-size: 15px; border: 1.2px solid #e1e1ea; border-radius: 6px; box-sizing: border-box; background: #fafbfe; margin-top: 4px; transition: border 0.2s; } #loginForm input:focus { border: 1.5px solid #4285f4; outline: none; background: #fff; } #loginForm button { padding: 10px 24px; border: none; background: #4285f4; color: #fff; border-radius: 7px; font-size: 17px; font-weight: 500; cursor: pointer; width: 100%; margin-top: 6px; box-shadow: 0 1px 6px #4285f41a; transition: background 0.2s; } #loginForm button:disabled { background: #b7cef7; }
  </style>
</head>
<body>
  ${langSwitcher}
  <!-- 登录表单 -->
  <form id="loginForm" style="display:none;">
    <h2 style="text-align:center;">${htmlEscape(i18n.login)}</h2>
    <div class="input-row">
      <label>${htmlEscape(i18n.email)}</label>
      <input type="email" id="email" required placeholder="your@email.com">
    </div>
    <div class="input-row">
      <label>${htmlEscape(i18n.password)}</label>
      <input type="password" id="password" required placeholder="${htmlEscape(i18n.password)}">
    </div>
    <button type="submit">${htmlEscape(i18n.loginBtn)}</button>
  </form>
  <div class="layout" id="mainLayout" style="display:none;">
    <div class="sidebar">
      <button class="menu-btn" id="menu-inbox">${htmlEscape(i18n.inbox)}</button>
      <button class="menu-btn" id="menu-sent">${htmlEscape(i18n.sent)}</button>
      <button class="menu-btn" id="menu-compose">${htmlEscape(i18n.compose)}</button>
      <button class="logout-btn" id="logoutBtn" style="margin-top:30px;">${htmlEscape(i18n.logout)}</button>
    </div>
    <div class="content">
      <div id="inboxBox">
        <div class="header-bar"><h2>${htmlEscape(i18n.inbox)}</h2></div>
        <div class="mail-list" id="inboxList"></div>
        <div class="empty" id="inboxEmpty" style="display:none;">${htmlEscape(i18n.noMail)}</div>
        <div class="detail-box" id="inboxDetail" style="display:none;"></div>
      </div>
      <div id="sentBox" style="display:none;">
        <div class="header-bar"><h2>${htmlEscape(i18n.sent)}</h2></div>
        <div class="mail-list" id="sentList"></div>
        <div class="empty" id="sentEmpty" style="display:none;">${htmlEscape(i18n.noSent)}</div>
        <div class="detail-box" id="sentDetail" style="display:none;"></div>
      </div>
      <div id="composeBox" style="display:none;">
        <div class="header-bar"><h2>${htmlEscape(i18n.compose)}</h2></div>
        <form class="compose-form" id="composeForm">
          <label>${htmlEscape(i18n.to)}</label>
          <input type="email" id="to" required placeholder="收件人邮箱">
          <label>${htmlEscape(i18n.subject)}</label>
          <input type="text" id="subject" placeholder="${htmlEscape(i18n.subject)}">
          <label>${htmlEscape(i18n.content)}</label>
          <textarea id="body" required></textarea>
          <button type="submit">${htmlEscape(i18n.send)}</button>
        </form>
        <div class="empty" id="composeStatus" style="display:none;"></div>
      </div>
    </div>
  </div>
  <script>
    // ===================== 配置和多语言 =====================
    const API_BASE = ${JSON.stringify(apiBase)};
    const LANG = ${JSON.stringify(lang)};
    const I18N = ${JSON.stringify(i18n)};

    // ========= 工具 =========
    function escapeHtml(str) {
      return String(str||'').replace(/[<>&"]/g, s=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"})[s]);
    }
    function formatTime(t) {
      if (!t) return '';
      let d = new Date(t);
      return \`\${d.getFullYear()}/\${d.getMonth()+1}/\${d.getDate()} \${d.getHours()}:\${('0'+d.getMinutes()).slice(-2)}\`;
    }
    function setActiveMenu(menu) {
      for (let btn of document.querySelectorAll('.menu-btn')) btn.classList.remove('active');
      document.getElementById('menu-' + menu).classList.add('active');
    }
    function setStatus(msg, color) {
      const s = document.getElementById('composeStatus');
      s.textContent = msg || '';
      s.style.display = msg ? '' : 'none';
      s.style.color = color || '#09be6d';
    }

    // ========= 多语言UI初始化 =========
  function initI18nUI() {
  // 登录表单
  document.querySelector('#loginForm h2').textContent = I18N.login;
  var loginLabels = document.querySelectorAll('#loginForm .input-row label');
  if (loginLabels.length >= 2) {
    loginLabels[0].textContent = I18N.email;
    loginLabels[1].textContent = I18N.password;
  }
  document.querySelector('#loginForm button').textContent = I18N.loginBtn;
  // 菜单
  document.getElementById('menu-inbox').textContent = I18N.inbox;
  document.getElementById('menu-sent').textContent = I18N.sent;
  document.getElementById('menu-compose').textContent = I18N.compose;
  document.getElementById('logoutBtn').textContent = I18N.logout;
  // 标题
  document.querySelector('#inboxBox .header-bar h2').textContent = I18N.inbox;
  document.querySelector('#sentBox .header-bar h2').textContent = I18N.sent;
  document.querySelector('#composeBox .header-bar h2').textContent = I18N.compose;
  // 占位/空内容
  document.getElementById('inboxEmpty').textContent = I18N.noMail;
  document.getElementById('sentEmpty').textContent = I18N.noSent;
  // 写信
  var composeLabels = document.querySelectorAll('#composeForm label');
  if (composeLabels.length >= 3) {
    composeLabels[0].textContent = I18N.to;
    composeLabels[1].textContent = I18N.subject;
    composeLabels[2].textContent = I18N.content;
  }
  document.querySelector('#composeForm button').textContent = I18N.send;
}


    document.addEventListener('DOMContentLoaded', function() {
      // 多语言UI初始化
      initI18nUI();

      // ========== UI切换 ==========
      function showLogin() {
        document.getElementById('loginForm').style.display = '';
        document.getElementById('mainLayout').style.display = 'none';
      }
      function showMain(menu) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainLayout').style.display = '';
        showBox(menu || 'inbox');
      }
      function showBox(menu) {
        setActiveMenu(menu);
        document.getElementById('inboxBox').style.display = menu === 'inbox' ? '' : 'none';
        document.getElementById('sentBox').style.display = menu === 'sent' ? '' : 'none';
        document.getElementById('composeBox').style.display = menu === 'compose' ? '' : 'none';
        setStatus('');
        if (menu === 'inbox') loadInbox();
        if (menu === 'sent') loadSent();
        if (menu === 'compose') {
          document.getElementById('composeForm').reset();
        }
      }

      // ========== 登录状态检测 ==========
      async function checkLogin() {
        let res = await fetch(API_BASE + '/user/check', { credentials: 'include' });
        let data = await res.json();
        if (data.loggedIn) {
          showMain('inbox');
        } else {
          showLogin();
        }
      }

      // ========== 登录事件 ==========
      document.getElementById('loginForm').onsubmit = async function(e){
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const btn = this.querySelector('button');
        btn.disabled = true;
        btn.innerText = I18N.loginPending;
        try {
          let res = await fetch(API_BASE + '/user/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({ email, password })
          });
          let data = await res.json();
          if (data.success) {
            showMain('inbox');
          } else {
            alert(data.error || I18N.loginFail);
          }
        } catch {
          alert(I18N.netError);
        }
        btn.disabled = false;
        btn.innerText = I18N.loginBtn;
      };

      // ========== 登出事件 ==========
      document.getElementById('logoutBtn').onclick = async function(){
        await fetch(API_BASE + '/user/logout', { method:'POST', credentials:'include' });
        showLogin();
      };

      // ========== 邮件加载 ==========
      // 收件箱
      async function loadInbox() {
        const mailList = document.getElementById('inboxList');
        mailList.innerHTML = '';
        document.getElementById('inboxDetail').style.display = 'none';
        document.getElementById('inboxEmpty').style.display = 'none';
        try {
          let res = await fetch(API_BASE + '/user/inbox', { credentials: 'include' });
          let data = await res.json();
          if (data.mails && data.mails.length) {
            for (const m of data.mails) {
              let item = document.createElement('div');
              item.className = 'mail-item';
              item.innerHTML = \`<span class="subject">\${escapeHtml(m.subject || I18N.noSubject)}</span>
                                <span class="from">\${escapeHtml(m.mail_from)}</span>
                                <span class="date">\${formatTime(m.created_at)}</span>\`;
              item.onclick = ()=>showInboxDetail(m.id);
              mailList.appendChild(item);
            }
          } else {
            document.getElementById('inboxEmpty').style.display = '';
          }
        } catch {
          mailList.innerHTML = \`<div class="empty">\${I18N.loadFail}</div>\`;
        }
      }
      async function showInboxDetail(id) {
        let box = document.getElementById('inboxDetail');
        box.innerHTML = I18N.loading;
        box.style.display = '';
        let res = await fetch(API_BASE + \`/user/mail?id=\${encodeURIComponent(id)}\`, { credentials: 'include' });
        let data = await res.json();
        if (!data.mail) {
          box.innerHTML = I18N.notFound;
          return;
        }
        box.innerHTML = \`<div style="font-weight:600;">\${I18N.subject}：\${escapeHtml(data.mail.subject||I18N.noSubject)}</div>
                         <div>\${I18N.from}：\${escapeHtml(data.mail.mail_from)}</div>
                         <div>\${I18N.time}：\${formatTime(data.mail.created_at)}</div>
                         <hr>
                         <div style="white-space:pre-wrap;">\${escapeHtml(data.mail.body||I18N.noContent)}</div>\`;
      }
      // 发件箱
      async function loadSent() {
        const mailList = document.getElementById('sentList');
        mailList.innerHTML = '';
        document.getElementById('sentDetail').style.display = 'none';
        document.getElementById('sentEmpty').style.display = 'none';
        try {
          let res = await fetch(API_BASE + '/user/sent', { credentials: 'include' });
          let data = await res.json();
          if (data.mails && data.mails.length) {
            for (const m of data.mails) {
              let item = document.createElement('div');
              item.className = 'mail-item';
              item.innerHTML = \`<span class="subject">\${escapeHtml(m.subject || I18N.noSubject)}</span>
                                <span class="to">\${escapeHtml(m.mail_to)}</span>
                                <span class="date">\${formatTime(m.created_at)}</span>\`;
              item.onclick = ()=>showSentDetail(m.id);
              mailList.appendChild(item);
            }
          } else {
            document.getElementById('sentEmpty').style.display = '';
          }
        } catch {
          mailList.innerHTML = \`<div class="empty">\${I18N.loadFail}</div>\`;
        }
      }
      async function showSentDetail(id) {
        let box = document.getElementById('sentDetail');
        box.innerHTML = I18N.loading;
        box.style.display = '';
        let res = await fetch(API_BASE + \`/user/sentmail?id=\${encodeURIComponent(id)}\`, { credentials: 'include' });
        let data = await res.json();
        if (!data.mail) {
          box.innerHTML = I18N.notFound;
          return;
        }
        box.innerHTML = \`<div style="font-weight:600;">\${I18N.subject}：\${escapeHtml(data.mail.subject||I18N.noSubject)}</div>
                         <div>\${I18N.to}：\${escapeHtml(data.mail.mail_to)}</div>
                         <div>\${I18N.time}：\${formatTime(data.mail.created_at)}</div>
                         <hr>
                         <div style="white-space:pre-wrap;">\${escapeHtml(data.mail.body||I18N.noContent)}</div>\`;
      }

      // ========== 写信 ==========
      document.getElementById('composeForm').onsubmit = async function(e){
        e.preventDefault();
        const to = document.getElementById('to').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const body = document.getElementById('body').value.trim();
        const btn = this.querySelector('button');
        setStatus(I18N.sending, '#888');
        btn.disabled = true;
        try {
          let res = await fetch(API_BASE + '/user/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({ to, subject, body })
          });
          let data = await res.json();
          if (data.success) {
            setStatus(I18N.sentSuccess);
            this.reset();
          } else {
            setStatus(data.error || I18N.sentFail, '#e55');
          }
        } catch {
          setStatus(I18N.sentFail, '#e55');
        }
        btn.disabled = false;
        btn.textContent = I18N.send;
      };

      // ========== 菜单切换 ==========
      document.getElementById('menu-inbox').onclick = () => showBox('inbox');
      document.getElementById('menu-sent').onclick = () => showBox('sent');
      document.getElementById('menu-compose').onclick = () => showBox('compose');

      // ========== 初始化 ==========
      checkLogin();
    });
  </script>
</body>
</html>
`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-frame-options': 'SAMEORIGIN',
    }
  });
}
