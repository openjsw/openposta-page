<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>简邮邮局收发件</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    /* 登录UI */
    #loginForm { max-width: 300px; margin: 80px auto; padding: 38px 25px; background: #fff; border-radius: 10px; box-shadow: 0 2px 16px #0001; }
    #loginForm .input-row { margin-bottom: 18px; }
    #loginForm label { display: block; margin-bottom: 4px;}
    #loginForm input { width: 100%; padding: 8px 12px; font-size: 15px; border: 1px solid #ddd; border-radius: 5px; }
    #loginForm button { padding: 7px 24px; border: none; background: #4285f4; color: #fff; border-radius: 5px; font-size: 16px; cursor: pointer; width: 100%; }
    #loginForm button:disabled { background: #ccc; }
  </style>
</head>
<body>
  <!-- 登录表单 -->
  <form id="loginForm" style="display:none;">
    <h2 style="text-align:center;">邮箱登录</h2>
    <div class="input-row">
      <label>邮箱</label>
      <input type="email" id="email" required placeholder="your@email.com">
    </div>
    <div class="input-row">
      <label>密码</label>
      <input type="password" id="password" required placeholder="邮箱密码">
    </div>
    <button type="submit">登录</button>
  </form>

  <div class="layout" id="mainLayout" style="display:none;">
    <div class="sidebar">
      <button class="menu-btn" id="menu-inbox">收件箱</button>
      <button class="menu-btn" id="menu-sent">发件箱</button>
      <button class="menu-btn" id="menu-compose">写信</button>
      <button class="logout-btn" id="logoutBtn" style="margin-top:30px;">退出登录</button>
    </div>
    <div class="content">
      <!-- 收件箱 -->
      <div id="inboxBox">
        <div class="header-bar"><h2>收件箱</h2></div>
        <div class="mail-list" id="inboxList"></div>
        <div class="empty" id="inboxEmpty" style="display:none;">暂无邮件</div>
        <div class="detail-box" id="inboxDetail" style="display:none;"></div>
      </div>
      <!-- 发件箱 -->
      <div id="sentBox" style="display:none;">
        <div class="header-bar"><h2>发件箱</h2></div>
        <div class="mail-list" id="sentList"></div>
        <div class="empty" id="sentEmpty" style="display:none;">暂无发件</div>
        <div class="detail-box" id="sentDetail" style="display:none;"></div>
      </div>
      <!-- 写信 -->
      <div id="composeBox" style="display:none;">
        <div class="header-bar"><h2>写信</h2></div>
        <form class="compose-form" id="composeForm">
          <label>收件人</label>
          <input type="email" id="to" required placeholder="收件人邮箱">
          <label>主题</label>
          <input type="text" id="subject" placeholder="主题">
          <label>正文</label>
          <textarea id="body" required></textarea>
          <button type="submit">发送</button>
        </form>
        <div class="empty" id="composeStatus" style="display:none;"></div>
      </div>
    </div>
  </div>
  <script>
    // ========== API基础配置 ==========
    const API_BASE = "https://api-663395.openjsw.net";

    // ========= 工具 =========
    function escapeHtml(str) {
      return String(str||'').replace(/[<>&"]/g, s=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"})[s]);
    }
    function formatTime(t) {
      if (!t) return '';
      let d = new Date(t);
      return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${('0'+d.getMinutes()).slice(-2)}`;
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
      btn.innerText = '登录中...';
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
           loadInbox();
        } else {
          alert(data.error || "登录失败！");
        }
      } catch {
        alert("网络错误");
      }
      btn.disabled = false;
      btn.innerText = '登录';
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
            item.innerHTML = `<span class="subject">${escapeHtml(m.subject || '(无主题)')}</span>
                              <span class="from">${escapeHtml(m.mail_from)}</span>
                              <span class="date">${formatTime(m.created_at)}</span>`;
            item.onclick = ()=>showInboxDetail(m.id);
            mailList.appendChild(item);
          }
        } else {
          document.getElementById('inboxEmpty').style.display = '';
        }
      } catch {
        mailList.innerHTML = '<div class="empty">加载失败</div>';
      }
    }
    async function showInboxDetail(id) {
      let box = document.getElementById('inboxDetail');
      box.innerHTML = '加载中...';
      box.style.display = '';
      let res = await fetch(API_BASE + `/user/mail?id=${encodeURIComponent(id)}`, { credentials: 'include' });
      let data = await res.json();
      if (!data.mail) {
        box.innerHTML = '邮件不存在或无权限查看。';
        return;
      }
      box.innerHTML = `<div style="font-weight:600;">主题：${escapeHtml(data.mail.subject||'(无主题)')}</div>
                       <div>发件人：${escapeHtml(data.mail.mail_from)}</div>
                       <div>时间：${formatTime(data.mail.created_at)}</div>
                       <hr>
                       <div style="white-space:pre-wrap;">${escapeHtml(data.mail.body||'(无内容)')}</div>`;
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
            item.innerHTML = `<span class="subject">${escapeHtml(m.subject || '(无主题)')}</span>
                              <span class="to">${escapeHtml(m.mail_to)}</span>
                              <span class="date">${formatTime(m.created_at)}</span>`;
            item.onclick = ()=>showSentDetail(m.id);
            mailList.appendChild(item);
          }
        } else {
          document.getElementById('sentEmpty').style.display = '';
        }
      } catch {
        mailList.innerHTML = '<div class="empty">加载失败</div>';
      }
    }
    async function showSentDetail(id) {
      let box = document.getElementById('sentDetail');
      box.innerHTML = '加载中...';
      box.style.display = '';
      let res = await fetch(API_BASE + `/user/sentmail?id=${encodeURIComponent(id)}`, { credentials: 'include' });
      let data = await res.json();
      if (!data.mail) {
        box.innerHTML = '邮件不存在或无权限查看。';
        return;
      }
      box.innerHTML = `<div style="font-weight:600;">主题：${escapeHtml(data.mail.subject||'(无主题)')}</div>
                       <div>收件人：${escapeHtml(data.mail.mail_to)}</div>
                       <div>时间：${formatTime(data.mail.created_at)}</div>
                       <hr>
                       <div style="white-space:pre-wrap;">${escapeHtml(data.mail.body||'(无内容)')}</div>`;
    }

    // ========== 写信 ==========
    document.getElementById('composeForm').onsubmit = async function(e){
      e.preventDefault();
      const to = document.getElementById('to').value.trim();
      const subject = document.getElementById('subject').value.trim();
      const body = document.getElementById('body').value.trim();
      const btn = this.querySelector('button');
      setStatus('发送中...', '#888');
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
          setStatus('已发送！');
          this.reset();
        } else {
          setStatus(data.error || '发送失败', '#e55');
        }
      } catch {
        setStatus('发送失败', '#e55');
      }
      btn.disabled = false;
    };

    // ========== 菜单切换 ==========
    document.getElementById('menu-inbox').onclick = () => showBox('inbox');
    document.getElementById('menu-sent').onclick = () => showBox('sent');
    document.getElementById('menu-compose').onclick = () => showBox('compose');

    // ========== 初始化 ==========
    checkLogin();
  </script>
</body>
</html>
