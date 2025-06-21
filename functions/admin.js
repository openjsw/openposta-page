export async function onRequest(context) {
  const env = context.env || {};
  const url = new URL(context.request.url);

  // 多语言自动检测
  let lang = url.searchParams.get('lang')
    || (context.request.headers.get('accept-language')?.split(',')[0] || '').toLowerCase()
    || (env.DEFAULT_LANG || 'zh-CN');
  lang = lang.startsWith('en') ? 'en' : 'zh-CN';

  // 管理后台多语言字典
  const i18nDict = {
    'zh-CN': {
      title: env.ADMIN_TITLE_ZH || '后台管理',
      login: '管理员登录', username: '用户名', password: '密码', loginBtn: '登录',
      logout: '退出', list: '用户列表', add: '添加', save: '保存', cancel: '取消',
      email: '邮箱', can_send: '可发信', can_receive: '可收信', created_at: '创建时间', actions: '操作',
      edit: '编辑', delete: '删除', sure_delete: '确定删除该用户？', logout_success: '已退出登录',
      add_user: '添加用户', edit_user: '编辑用户', not_logged_in: '请登录后管理', updating: '操作中...',
      login_fail: '登录失败！', success: '操作成功', fail: '操作失败', language: '语言',
      switch_to_en: 'English', switch_to_zh: '简体中文'
    },
    'en': {
      title: env.ADMIN_TITLE_EN || 'Admin Panel',
      login: 'Admin Login', username: 'Username', password: 'Password', loginBtn: 'Login',
      logout: 'Logout', list: 'User List', add: 'Add', save: 'Save', cancel: 'Cancel',
      email: 'Email', can_send: 'Can Send', can_receive: 'Can Receive', created_at: 'Created', actions: 'Actions',
      edit: 'Edit', delete: 'Delete', sure_delete: 'Delete this user?', logout_success: 'Logged out',
      add_user: 'Add User', edit_user: 'Edit User', not_logged_in: 'Please login to manage', updating: 'Working...',
      login_fail: 'Login failed!', success: 'Success', fail: 'Failed', language: 'Language',
      switch_to_en: 'English', switch_to_zh: '简体中文'
    }
  };
  const i18n = i18nDict[lang] || i18nDict['zh-CN'];

  // 页面 HTML（完全自包含、无依赖，支持切换语言，全部按钮和内容会自动刷新多语言）
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${i18n.title}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>
    body { font-family: system-ui,sans-serif; background: #f8f9fb; margin:0; }
    .admin-bar { display:flex; align-items:center; justify-content:space-between; background:#3577d4; color:#fff; padding: 18px 24px; }
    .admin-bar h1 { font-size: 22px; margin: 0; }
    .lang-switcher a { color:#fff; margin-left:10px; font-size:15px; text-decoration:underline; }
    .lang-switcher a.active { font-weight: bold; text-decoration: none; }
    .main { max-width:520px; margin: 32px auto; background: #fff; border-radius:12px; box-shadow:0 2px 16px #0001; padding: 36px 32px; min-height:420px; }
    .hidden { display:none; }
    table { width:100%; border-collapse:collapse; margin-top:16px; }
    th,td { padding: 8px; border-bottom:1px solid #f0f0f5; text-align:left;}
    th { background:#f6f9fe; }
    tr:last-child td { border-bottom:none; }
    button { background:#4285f4; color:#fff; border:none; border-radius:6px; font-size:15px; padding:6px 14px; margin:0 4px; cursor:pointer; }
    button:disabled { background:#aaa; }
    .danger { background:#ea5050; }
    .logout-btn { background:none; color:#fff; font-size:16px; border:none; cursor:pointer; }
    .msg { margin:10px 0;color:#ea5050; }
    input[type="text"],input[type="email"],input[type="password"] { width:100%; padding:8px; font-size:15px; border:1.2px solid #e1e1ea; border-radius:6px; background:#fafbfe; margin:3px 0 13px 0;}
    label { display:block; font-size:15px; margin-top:10px;}
    .switch { vertical-align: middle; width: 20px; height: 20px; }
    .action-btns button { margin-right:5px;}
  </style>
</head>
<body>
  <div class="admin-bar">
    <h1>${i18n.title}</h1>
    <div class="lang-switcher">
      <a href="?lang=zh-CN"${lang==='zh-CN'?' class="active"':''}>简体中文</a> |
      <a href="?lang=en"${lang==='en'?' class="active"':''}>English</a>
      <button class="logout-btn" id="logoutBtn">${i18n.logout}</button>
    </div>
  </div>
  <div class="main">
    <form id="loginForm">
      <h2>${i18n.login}</h2>
      <label>${i18n.username}</label>
      <input type="text" id="username" required autocomplete="username">
      <label>${i18n.password}</label>
      <input type="password" id="password" required autocomplete="current-password">
      <button type="submit">${i18n.loginBtn}</button>
      <div class="msg" id="loginMsg"></div>
    </form>
    <div id="adminPanel" class="hidden">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 style="margin:0;">${i18n.list}</h2>
        <button id="addBtn">${i18n.add_user}</button>
      </div>
      <div class="msg" id="adminMsg"></div>
      <table id="userTable">
        <thead>
          <tr>
            <th>${i18n.email}</th><th>${i18n.can_send}</th><th>${i18n.can_receive}</th><th>${i18n.created_at}</th><th>${i18n.actions}</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <form id="editForm" class="hidden">
        <h3 id="editTitle"></h3>
        <label>${i18n.email}</label>
        <input type="email" id="editEmail" required>
        <label>${i18n.password} <span style="color:#888;font-size:13px;">(仅添加时需要)</span></label>
        <input type="password" id="editPassword">
        <label>${i18n.can_send}</label>
        <input type="checkbox" id="editCanSend" class="switch">
        <label>${i18n.can_receive}</label>
        <input type="checkbox" id="editCanReceive" class="switch">
        <div style="margin-top:15px;">
          <button type="submit" id="saveBtn">${i18n.save}</button>
          <button type="button" id="cancelBtn">${i18n.cancel}</button>
        </div>
      </form>
    </div>
  </div>
  <script>
    // ============ 工具 ============
    const $ = sel => document.querySelector(sel);
    let editingEmail = null;

    // 切换登录/后台显示
    function showPanel(show) {
      $('#loginForm').classList.toggle('hidden', !!show);
      $('#adminPanel').classList.toggle('hidden', !show);
      $('#adminMsg').textContent = '';
      $('#loginMsg').textContent = '';
      $('#editForm').classList.add('hidden');
    }

    // ======== 登录流程 ==========
    $('#loginForm').onsubmit = async e => {
      e.preventDefault();
      $('#loginMsg').textContent = '';
      let username = $('#username').value.trim();
      let password = $('#password').value;
      $('#loginForm button[type="submit"]').disabled = true;
      try {
        let res = await fetch('/manage/login', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          credentials:'include',
          body: JSON.stringify({username, password})
        });
        let data = await res.json();
        if(data.success) {
          showPanel(true);
          loadUsers();
        } else {
          $('#loginMsg').textContent = data.error || '${i18n.login_fail}';
        }
      } catch(e) {
        $('#loginMsg').textContent = '${i18n.fail}';
      }
      $('#loginForm button[type="submit"]').disabled = false;
    };

    // ======== 登出 ==========
    $('#logoutBtn').onclick = async ()=>{
      await fetch('/manage/logout', {method:'POST',credentials:'include'});
      showPanel(false);
    };

    // ======== 用户列表 ==========
    async function loadUsers() {
      $('#userTable tbody').innerHTML = '<tr><td colspan="5">${i18n.updating}</td></tr>';
      let res = await fetch('/manage/list', {credentials:'include'});
      let data = await res.json();
      const list = data.accounts || [];
      if(!list.length) {
        $('#userTable tbody').innerHTML = '<tr><td colspan="5">${i18n.fail}</td></tr>';
        return;
      }
      $('#userTable tbody').innerHTML = '';
      for(const u of list) {
        let tr = document.createElement('tr');
        tr.innerHTML = '<td>'+u.email+'</td>'
          + '<td>'+(u.can_send?'✅':'❌')+'</td>'
          + '<td>'+(u.can_receive?'✅':'❌')+'</td>'
          + '<td>'+(u.created_at||'').replace('T',' ').slice(0,19)+'</td>'
          + '<td class="action-btns"><button onclick="editUser(\\''+u.email+'\\')">${i18n.edit}</button>'
          + '<button class="danger" onclick="delUser(\\''+u.email+'\\')">${i18n.delete}</button></td>';
        $('#userTable tbody').appendChild(tr);
      }
    }
    window.editUser = function(email) {
      editingEmail = email;
      let row = [...$('#userTable tbody').children].find(tr=>tr.firstChild.textContent===email);
      $('#editEmail').value = email;
      $('#editEmail').readOnly = true;
      $('#editPassword').value = '';
      $('#editCanSend').checked = row.children[1].textContent==='✅';
      $('#editCanReceive').checked = row.children[2].textContent==='✅';
      $('#editTitle').textContent = '${i18n.edit_user}';
      $('#editForm').classList.remove('hidden');
    }
    window.delUser = async function(email) {
      if(!confirm('${i18n.sure_delete}')) return;
      let res = await fetch('/manage/delete', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body:JSON.stringify({email})
      });
      let data = await res.json();
      if(data.success) loadUsers();
      else $('#adminMsg').textContent = data.error || '${i18n.fail}';
    }
    $('#addBtn').onclick = ()=>{
      editingEmail = null;
      $('#editTitle').textContent = '${i18n.add_user}';
      $('#editEmail').value = '';
      $('#editEmail').readOnly = false;
      $('#editPassword').value = '';
      $('#editCanSend').checked = true;
      $('#editCanReceive').checked = true;
      $('#editForm').classList.remove('hidden');
    };
    $('#cancelBtn').onclick = ()=>$('#editForm').classList.add('hidden');
    $('#editForm').onsubmit = async e => {
      e.preventDefault();
      let email = $('#editEmail').value.trim();
      let password = $('#editPassword').value;
      let can_send = $('#editCanSend').checked, can_receive = $('#editCanReceive').checked;
      $('#saveBtn').disabled = true;
      let path = editingEmail ? '/manage/update' : '/manage/add';
      let body = editingEmail
        ? {email, can_send, can_receive}
        : {email, password, can_send, can_receive};
      let res = await fetch(path, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body:JSON.stringify(body)
      });
      let data = await res.json();
      if(data.success) {
        $('#editForm').classList.add('hidden');
        loadUsers();
      } else {
        $('#adminMsg').textContent = data.error || '${i18n.fail}';
      }
      $('#saveBtn').disabled = false;
    };

    // ===== 检查登录状态并初始化 =====
    async function checkLogin() {
      let res = await fetch('/manage/check', {credentials:'include'});
      let data = await res.json();
      if(data.loggedIn) {
        showPanel(true);
        loadUsers();
      } else {
        showPanel(false);
      }
    }
    checkLogin();
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
