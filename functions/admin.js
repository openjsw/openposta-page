// == 简邮 邮箱系统管理后台 ==
// 用法：直接 output 到 html 或 <script src="admin.js"></script>
export async function onRequest(context) {
  const env = context.env || {};
  const url = new URL(context.request.url);
  // ==== 多语言判断 ====
  let lang = url.searchParams.get('lang')
    || (context.request.headers.get('accept-language')?.split(',')[0] || '').toLowerCase()
    || (env.DEFAULT_LANG || 'zh-CN');
  lang = lang.startsWith('en') ? 'en' : 'zh-CN';
  // ==== i18n 词典 ====
  const i18nDict = {
    'zh-CN': {
      title: '后台管理 - 简邮邮局',
      metaDesc: '轻量级邮件系统管理后台',
      login: '管理员登录',
      username: '用户名', password: '密码', loginBtn: '登录',
      loginFail: '登录失败，请重试',
      logout: '退出登录',
      addUser: '添加账号', email: '邮箱', send: '可发信', receive: '可收信',
      save: '保存', del: '删除', yes: '是', no: '否',
      add: '添加', cancel: '取消',
      userList: '用户列表', actions: '操作',
      addSuccess: '添加成功', addFail: '添加失败', delSuccess: '删除成功', delFail: '删除失败',
      modifySuccess: '修改成功', modifyFail: '修改失败',
      exist: '已存在',
      noUser: '暂无用户',
      loading: '加载中...',
      loginPending: '登录中...',
      addPending: '添加中...',
      modifyPending: '修改中...',
      delPending: '删除中...'
    },
    'en': {
      title: 'Admin Panel - JianMail',
      metaDesc: 'Lightweight mail admin panel',
      login: 'Admin Login',
      username: 'Username', password: 'Password', loginBtn: 'Login',
      loginFail: 'Login failed, please retry',
      logout: 'Logout',
      addUser: 'Add User', email: 'Email', send: 'Can Send', receive: 'Can Receive',
      save: 'Save', del: 'Delete', yes: 'Yes', no: 'No',
      add: 'Add', cancel: 'Cancel',
      userList: 'User List', actions: 'Action',
      addSuccess: 'Add success', addFail: 'Add failed', delSuccess: 'Delete success', delFail: 'Delete failed',
      modifySuccess: 'Update success', modifyFail: 'Update failed',
      exist: 'Already exists',
      noUser: 'No user found',
      loading: 'Loading...',
      loginPending: 'Logging in...',
      addPending: 'Adding...',
      modifyPending: 'Saving...',
      delPending: 'Deleting...'
    }
  };
  const I18N = i18nDict[lang] || i18nDict['zh-CN'];

  function htmlEscape(str) {
    return String(str || '').replace(/[<>&"]/g, s =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[s]));
  }

  const apiBase = env.API_BASE || '';
  const langSwitcher = `
    <div style="position:absolute;top:10px;right:28px;font-size:14px;z-index:20;">
      <a href="?lang=zh-CN"${lang === 'zh-CN' ? ' style="font-weight:bold"' : ''}>简体中文</a> |
      <a href="?lang=en"${lang === 'en' ? ' style="font-weight:bold"' : ''}>English</a>
    </div>
  `;
  const html = `<!DOCTYPE html>
<html lang="${htmlEscape(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${htmlEscape(I18N.title)}</title>
  <meta name="description" content="${htmlEscape(I18N.metaDesc)}">
  <style>
    body { font-family: system-ui,sans-serif; margin:0; background: #f6f9fb; }
    .centered { max-width: 480px; margin: 70px auto 0 auto; padding: 38px 32px 32px 32px; background:#fff; border-radius:12px; box-shadow:0 2px 16px #0001; }
    .header-bar { display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
    .logout-btn { border:none;background:none;color:#888;cursor:pointer;font-size:15px;}
    .status { text-align:center;margin:10px 0 8px 0;font-size:15px;}
    .user-table { border-collapse:collapse;width:100%;margin-top:12px; }
    .user-table th, .user-table td { border-bottom:1px solid #eee; padding:10px 8px; text-align:left; }
    .user-table th { background:#f3f6fa; }
    .user-table td .btn { margin:0 3px; padding:3px 9px; font-size:14px; border:none; border-radius:5px; cursor:pointer; }
    .user-table td .btn-save { background:#4285f4; color:#fff; }
    .user-table td .btn-del { background:#e55; color:#fff; }
    .add-form { margin:19px 0 8px 0; padding:10px 14px; background:#f7fafc; border-radius:9px; display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
    .add-form input { padding:6px 9px;font-size:14px; border:1px solid #ccd7e4; border-radius:4px; }
    .add-form label { font-size:14px;}
    .add-form button { padding:6px 17px; border:none; border-radius:5px; background:#4285f4;color:#fff; font-size:15px;cursor:pointer;}
    .empty { color:#aaa;text-align:center;margin:24px 0;}
    @media (max-width:540px) {
      .centered { max-width:99vw; padding:17px 4vw 12vw 4vw; }
      .user-table th, .user-table td { font-size:13px; padding:7px 3px;}
      .add-form { flex-direction:column; align-items:stretch;}
    }
  </style>
</head>
<body>
${langSwitcher}
<div class="centered" id="loginBox" style="display:none;">
  <h2 style="text-align:center;">${htmlEscape(I18N.login)}</h2>
  <form id="loginForm">
    <label>${htmlEscape(I18N.username)}</label>
    <input type="text" id="adminName" required placeholder="${htmlEscape(I18N.username)}" autocomplete="username">
    <label>${htmlEscape(I18N.password)}</label>
    <input type="password" id="adminPwd" required placeholder="${htmlEscape(I18N.password)}" autocomplete="current-password">
    <button type="submit" style="margin-top:17px;width:100%">${htmlEscape(I18N.loginBtn)}</button>
    <div class="status" id="loginStatus"></div>
  </form>
</div>
<div class="centered" id="mainBox" style="display:none;">
  <div class="header-bar">
    <h2>${htmlEscape(I18N.userList)}</h2>
    <button class="logout-btn" id="logoutBtn">${htmlEscape(I18N.logout)}</button>
  </div>
  <form class="add-form" id="addUserForm">
    <label>${htmlEscape(I18N.email)} <input type="email" id="newEmail" required style="width:140px"></label>
    <label>${htmlEscape(I18N.password)} <input type="text" id="newPwd" required style="width:90px"></label>
    <label>${htmlEscape(I18N.send)} <select id="newSend"><option value="1">${I18N.yes}</option><option value="0">${I18N.no}</option></select></label>
    <label>${htmlEscape(I18N.receive)} <select id="newRecv"><option value="1">${I18N.yes}</option><option value="0">${I18N.no}</option></select></label>
    <button type="submit">${htmlEscape(I18N.add)}</button>
    <span class="status" id="addUserStatus"></span>
  </form>
  <div id="userListBox">
    <div class="empty" id="userEmpty" style="display:none;">${htmlEscape(I18N.noUser)}</div>
    <table class="user-table" id="userTable" style="display:none;">
      <thead>
        <tr>
          <th>${htmlEscape(I18N.email)}</th>
          <th>${htmlEscape(I18N.send)}</th>
          <th>${htmlEscape(I18N.receive)}</th>
          <th>${htmlEscape(I18N.actions)}</th>
        </tr>
      </thead>
      <tbody id="userTableBody"></tbody>
    </table>
  </div>
</div>
<script>
const API_BASE = ${JSON.stringify(apiBase)};
const I18N = ${JSON.stringify(I18N)};

function escapeHtml(str) {
  return String(str||'').replace(/[<>&"]/g, s=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"})[s]);
}

function setStatus(el, msg, color) {
  el.textContent = msg || '';
  el.style.color = color || '#333';
  el.style.display = msg ? '' : 'none';
}

document.addEventListener('DOMContentLoaded', function(){
  const loginBox = document.getElementById('loginBox');
  const mainBox = document.getElementById('mainBox');
  // ===== 登录检测 =====
  async function checkLogin() {
    let res = await fetch(API_BASE+'/manage/check', { credentials: 'include' });
    let data = await res.json();
    if (data.loggedIn) {
      showMain();
    } else {
      showLogin();
    }
  }
  function showLogin() {
    loginBox.style.display = '';
    mainBox.style.display = 'none';
    document.getElementById('loginForm').reset();
    setStatus(document.getElementById('loginStatus'), '');
  }
  function showMain() {
    loginBox.style.display = 'none';
    mainBox.style.display = '';
    loadUsers();
  }

  // ===== 登录表单 =====
  document.getElementById('loginForm').onsubmit = async function(e){
    e.preventDefault();
    const name = document.getElementById('adminName').value.trim();
    const pwd = document.getElementById('adminPwd').value;
    const status = document.getElementById('loginStatus');
    setStatus(status, I18N.loginPending, '#888');
    try {
      let res = await fetch(API_BASE+'/manage/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        credentials: 'include',
        body: JSON.stringify({ username: name, password: pwd })
      });
      let data = await res.json();
      if (data.success) {
        showMain();
      } else {
        setStatus(status, data.error || I18N.loginFail, '#e55');
      }
    } catch {
      setStatus(status, I18N.loginFail, '#e55');
    }
  };
  document.getElementById('logoutBtn').onclick = async function() {
    await fetch(API_BASE+'/manage/logout', { method:'POST', credentials:'include' });
    showLogin();
  };

  // ===== 用户列表加载 =====
  async function loadUsers() {
    const table = document.getElementById('userTable');
    const tbody = document.getElementById('userTableBody');
    const empty = document.getElementById('userEmpty');
    tbody.innerHTML = '';
    setStatus(empty, I18N.loading, '#888'); empty.style.display = '';
    table.style.display = 'none';
    try {
      let res = await fetch(API_BASE+'/manage/list', { credentials:'include' });
      let data = await res.json();
      if (data.accounts && data.accounts.length) {
        for (const acc of data.accounts) {
          let tr = document.createElement('tr');
          tr.innerHTML = \`
            <td>\${escapeHtml(acc.email)}</td>
            <td>
              <select data-act="send" style="min-width:32px;">
                <option value="1"\${acc.can_send?' selected':''}>${I18N.yes}</option>
                <option value="0"\${!acc.can_send?' selected':''}>${I18N.no}</option>
              </select>
            </td>
            <td>
              <select data-act="recv" style="min-width:32px;">
                <option value="1"\${acc.can_receive?' selected':''}>${I18N.yes}</option>
                <option value="0"\${!acc.can_receive?' selected':''}>${I18N.no}</option>
              </select>
            </td>
            <td>
              <button class="btn btn-save">${I18N.save}</button>
              <button class="btn btn-del">${I18N.del}</button>
            </td>
          \`;
          // 保存/删除事件
          const [sendSel, recvSel] = tr.querySelectorAll('select');
          const btnSave = tr.querySelector('.btn-save');
          const btnDel = tr.querySelector('.btn-del');
          btnSave.onclick = async function() {
            btnSave.disabled = true; btnDel.disabled = true;
            btnSave.textContent = I18N.modifyPending;
            try {
              let res = await fetch(API_BASE+'/manage/update', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                credentials:'include',
                body: JSON.stringify({
                  email: acc.email,
                  can_send: sendSel.value==='1',
                  can_receive: recvSel.value==='1'
                })
              });
              let data = await res.json();
              if (data.success) btnSave.textContent = I18N.modifySuccess;
              else btnSave.textContent = data.error || I18N.modifyFail;
            } catch {
              btnSave.textContent = I18N.modifyFail;
            }
            setTimeout(()=>{btnSave.textContent = I18N.save;btnSave.disabled=false;btnDel.disabled=false;},1000);
          };
          btnDel.onclick = async function() {
            if(!confirm(I18N.del+'?')) return;
            btnSave.disabled = true; btnDel.disabled = true;
            btnDel.textContent = I18N.delPending;
            try {
              let res = await fetch(API_BASE+'/manage/delete', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                credentials:'include',
                body: JSON.stringify({email: acc.email})
              });
              let data = await res.json();
              if(data.success){
                tr.remove();
                if(!tbody.children.length){table.style.display='none';empty.style.display='';setStatus(empty, I18N.noUser);}
              }else{
                btnDel.textContent = data.error || I18N.delFail;
                setTimeout(()=>{btnDel.textContent = I18N.del;btnDel.disabled=false;btnSave.disabled=false;},1000);
              }
            }catch{
              btnDel.textContent = I18N.delFail;
              setTimeout(()=>{btnDel.textContent = I18N.del;btnDel.disabled=false;btnSave.disabled=false;},1000);
            }
          };
          tbody.appendChild(tr);
        }
        table.style.display = '';
        empty.style.display = 'none';
      } else {
        setStatus(empty, I18N.noUser, '#aaa'); empty.style.display = '';
        table.style.display = 'none';
      }
    } catch {
      setStatus(empty, I18N.loginFail, '#e55'); empty.style.display = '';
      table.style.display = 'none';
    }
  }

  // ===== 添加账号 =====
  document.getElementById('addUserForm').onsubmit = async function(e){
    e.preventDefault();
    const email = document.getElementById('newEmail').value.trim();
    const pwd = document.getElementById('newPwd').value.trim();
    const can_send = document.getElementById('newSend').value === '1';
    const can_receive = document.getElementById('newRecv').value === '1';
    const status = document.getElementById('addUserStatus');
    setStatus(status, I18N.addPending, '#888');
    try {
      let res = await fetch(API_BASE+'/manage/add', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body:JSON.stringify({ email, password: pwd, can_send, can_receive })
      });
      let data = await res.json();
      if (data.success) {
        setStatus(status, I18N.addSuccess, '#09be6d');
        this.reset();
        loadUsers();
      } else {
        setStatus(status, data.error || I18N.addFail, '#e55');
      }
    } catch {
      setStatus(status, I18N.addFail, '#e55');
    }
    setTimeout(()=>setStatus(status, ''),1200);
  };

  // ===== 初始化 =====
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
