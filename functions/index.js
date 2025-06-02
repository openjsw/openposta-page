export async function onRequest(context) {
  const env = context.env || {};
  const url = new URL(context.request.url);

  let lang = url.searchParams.get('lang')
    || (context.request.headers.get('accept-language')?.split(',')[0] || '').toLowerCase()
    || (env.DEFAULT_LANG || 'zh-CN');
  lang = lang.startsWith('en') ? 'en' : 'zh-CN';

  const i18nDict = {
    'zh-CN': {
      title: '简邮邮局收发件',
      metaDesc: '轻量级邮件客户端',
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
      title: 'JianMail WebMail',
      metaDesc: 'Lightweight mail client',
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

  const langSwitcher = `
    <div style="position:absolute;top:10px;right:30px;font-size:14px;z-index:20;">
      <a href="?lang=zh-CN"${lang==='zh-CN'?' style="font-weight:bold"':''}>简体中文</a> |
      <a href="?lang=en"${lang==='en'?' style="font-weight:bold"':''}>English</a>
    </div>
  `;
  const html = `<!DOCTYPE html>
<html lang="${htmlEscape(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${htmlEscape(i18n.title)}</title>
  <meta name="description" content="${htmlEscape(i18n.metaDesc)}">
  <style>
    body { font-family: system-ui,sans-serif; margin: 0; background: #f8f9fb; }
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 180px; background: #f7f7f7; box-shadow: 1px 0 8px #0001;
      padding: 34px 0 0 0; display: flex; flex-direction: column; align-items: center;}
    .sidebar .menu-btn { display: block; width: 120px; padding: 11px 0; margin: 7px 0; border: none; background: #eaf1fb; color: #3577d4; border-radius: 8px; font-size: 15px; cursor: pointer; text-align: left; text-indent: 8px; transition: 0.2s;}
    .sidebar .menu-btn.active, .sidebar .menu-btn:hover { background: #4285f4; color: #fff; }
    .content { flex: 1; max-width: 520px; margin: 36px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 14px #0001; padding: 26px 30px 34px 30px; min-height: 420px;}
    .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
    .header-bar h2 { margin: 0; }
    .logout-btn { background: none; border: none; color: #999; font-size: 15px; cursor: pointer;}
    .mail-list { margin: 0 0 0 0; }
    .mail-item { padding: 13px 0; border-bottom: 1px solid #eee; cursor: pointer; transition: 0.15s;}
    .mail-item:hover { background: #f2f7fd; }
    .subject { font-weight: 600; }
    .from, .to { color: #888; font-size: 13px; margin-left: 6px; }
    .date { float: right; color: #aaa; font-size: 12px; }
    .detail-box { margin-top: 22px; padding: 15px; border-radius: 8px; background: #f7fafd; border: 1px solid #e4ebf3; }
    .empty { color: #aaa; text-align: center; margin: 35px 0; }
    .compose-form label { display:block; margin-top: 13px; font-weight:500;}
    .compose-form input, .compose-form textarea { width: 100%; padding: 7px 12px; font-size: 15px; border: 1px solid #ccd7e4; border-radius: 5px; margin-top: 3px;}
    .compose-form textarea { min-height: 80px; resize: vertical;}
    .compose-form button { margin-top: 17px; padding: 7px 28px; background: #4285f4; color: #fff; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; }
    .compose-form button:disabled { background: #aaa; }
    #loginForm { max-width: 300px; margin: 80px auto; padding: 38px 25px; background: #fff; border-radius: 10px; box-shadow: 0 2px 16px #0001; }
    #loginForm .input-row { margin-bottom: 18px; }
    #loginForm label { display: block; margin-bottom: 4px;}
    #loginForm input { width: 100%; padding: 8px 12px; font-size: 15px; border: 1px solid #ddd; border-radius: 5px; }
    #loginForm button { padding: 7px 24px; border: none; background: #4285f4; color: #fff; border-radius: 5px; font-size: 16px; cursor: pointer; width: 100%; }
    #loginForm button:disabled { background: #ccc; }
  </style>
</head>
<body>
  ${langSwitcher}
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
    const API_BASE = ${JSON.stringify(apiBase)};
    const LANG = ${JSON.stringify(lang)};
    const I18N = ${JSON.stringify(i18n)};

    // ----------- 只做UI测试 ------------------
    function showLogin() {
      document.getElementById('loginForm').style.display = '';
      document.getElementById('mainLayout').style.display = 'none';
    }
    function showMain(menu) {
      document.getElementById('loginForm').style.display = 'none';
      document.getElementById('mainLayout').style.display = '';
    }
    // 自动显示登录页以便UI能看见
    showLogin();
    // 你可以用 setTimeout(() => showMain('inbox'), 1000); 测试UI切换
  </script>
</body>
</html>
`;
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
