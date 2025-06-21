export async function onRequest(context) {
  const env = context.env || {};
  const apiBase = env.API_BASE || '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>邮箱后台管理</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: system-ui,sans-serif; margin:0; background:#f7f7fc;}
    .main { max-width: 560px; margin: 60px auto; background:#fff; border-radius:12px; box-shadow:0 6px 24px #0012.09; padding:34px 36px 40px;}
    h1 { font-size: 23px; margin: 0 0 23px;}
    .input-row {margin-bottom:18px;}
    label {display:block; margin-bottom:5px;}
    input {width:100%; padding:8px 10px; border-radius:6px; border:1.2px solid #ddd; font-size:15px;}
    button {padding: 9px 16px; border-radius:6px; border:none; background: #4285f4; color:#fff; font-size:16px; cursor:pointer;}
    button[disabled] { background: #bbb;}
    .status {color:#e22; margin: 15px 0;}
    .table {width:100%; border-collapse:collapse; margin:20px 0;}
    .table th, .table td {padding: 7px 7px; border:1px solid #ddd; text-align:left;}
    .actions button {margin-right:8px;}
    .logout-btn {color:#888; background:none; border:none; margin-left:14px; cursor:pointer;}
  </style>
</head>
<body>
<div class="main">
  <h1>邮箱后台管理</h1>
  <form id="loginForm" style="display:none;">
    <div class="input-row">
      <label>管理员用户名</label>
      <input type="text" id="username" required>
    </div>
    <div class="input-row">
      <label>密码</label>
      <input type="password" id="adminpwd" required>
    </div>
    <button type="submit">登录</button>
  </form>
  <div id="app" style="display:none;">
    <button id="logoutBtn" class="logout-btn">退出</button>
    <form id="addForm" style="margin-top:22px;">
      <h3>添加用户</h3>
      <div class="input-row"><label>邮箱</label><input type="email" id="addEmail" required></div>
      <div class="input-row"><label>密码</label><input type="password" id="addPwd" required></div>
      <label><input type="checkbox" id="addSend" checked> 可发信</label>
      <label><input type="checkbox" id="addRecv" checked> 可收信</label>
      <button type="submit">添加</button>
      <div class="status" id="addStatus"></div>
    </form>
    <h3 style="margin-top:34px;">账号列表</h3>
    <table class="table" id="userTable">
      <thead><tr><th>邮箱</th><th>可发</th><th>可收</th><th>创建时间</th><th>操作</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>
</div>
<script>
  const API_BASE = ${JSON.stringify(apiBase)};
  async function checkLogin(){
    let r = await fetch(API_BASE+"/manage/check",{credentials:"include"}).then(r=>r.json());
    if(r.loggedIn){ document.getElementById('loginForm').style.display='none'; document.getElementById('app').style.display=''; loadUsers(); }
    else { document.getElementById('loginForm').style.display=''; document.getElementById('app').style.display='none'; }
  }
  document.getElementById('loginForm').onsubmit = async function(e){
    e.preventDefault();
    let username = document.getElementById('username').value,
        password = document.getElementById('adminpwd').value,
        btn = this.querySelector('button');
    btn.disabled = true;
    let r = await fetch(API_BASE+"/manage/login",{
      method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",
      body: JSON.stringify({username,password})
    }).then(r=>r.json());
    btn.disabled = false;
    if(r.success){ checkLogin(); }
    else alert(r.error||"登录失败");
  };
  document.getElementById('logoutBtn').onclick = async function(){
    await fetch(API_BASE+"/manage/logout",{method:"POST",credentials:"include"});
    checkLogin();
  };
  document.getElementById('addForm').onsubmit = async function(e){
    e.preventDefault();
    let email = document.getElementById('addEmail').value,
        pwd = document.getElementById('addPwd').value,
        can_send = document.getElementById('addSend').checked,
        can_receive = document.getElementById('addRecv').checked,
        btn = this.querySelector('button');
    btn.disabled = true;
    let status = document.getElementById('addStatus');
    status.textContent='';
    let r = await fetch(API_BASE+"/manage/add",{
      method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",
      body: JSON.stringify({email,password:pwd,can_send,can_receive})
    }).then(r=>r.json());
    btn.disabled = false;
    if(r.success){ this.reset(); status.textContent="添加成功"; loadUsers(); }
    else status.textContent=r.error||"添加失败";
  };

  async function loadUsers(){
    let table = document.getElementById('userTable').querySelector('tbody');
    table.innerHTML = '<tr><td colspan="5">加载中...</td></tr>';
    let r = await fetch(API_BASE+"/manage/list",{credentials:"include"}).then(r=>r.json());
    if(!r.accounts || !r.accounts.length){ table.innerHTML='<tr><td colspan="5">暂无账号</td></tr>'; return; }
    table.innerHTML = '';
    for(const u of r.accounts){
      let tr = document.createElement('tr');
      tr.innerHTML =
        '<td>'+u.email+'</td>'+
        '<td>'+(u.can_send?'✅':'❌')+'</td>'+
        '<td>'+(u.can_receive?'✅':'❌')+'</td>'+
        '<td>'+u.created_at.replace('T',' ').replace(/\\..+$/,'')+'</td>'+
        '<td class="actions">'+
        '<button onclick="updateUser(\\''+u.email+'\\')">修改</button>'+
        '<button onclick="deleteUser(\\''+u.email+'\\')">删除</button>'+
        '</td>';
      table.appendChild(tr);
    }
  }
  window.updateUser = async function(email){
    let can_send = confirm("点确定将可发信（否则不可发）");
    let can_receive = confirm("点确定将可收信（否则不可收）");
    await fetch(API_BASE+"/manage/update",{
      method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",
      body: JSON.stringify({email,can_send,can_receive})
    }).then(r=>r.json());
    loadUsers();
  }
  window.deleteUser = async function(email){
    if(!confirm("确认删除?"))return;
    await fetch(API_BASE+"/manage/delete",{
      method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",
      body: JSON.stringify({email})
    }).then(r=>r.json());
    loadUsers();
  }
  window.addEventListener('DOMContentLoaded', checkLogin);
</script>
</body>
</html>
`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-frame-options': 'SAMEORIGIN'
    }
  });
}
