export async function onRequest(context) {
  const apiBase = context.env.API_BASE || "";
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>openposta</title>
  <meta name="description" content="简约、现代的云端邮箱系统">
  <style>
    body { margin:0; font-family:Roboto,system-ui,sans-serif; background:#f5f6fa;}
    .main-card { margin: 60px auto; max-width: 420px; padding: 36px 32px 32px 32px; background: #fff; border-radius: 16px; box-shadow: 0 4px 40px #0002; }
    h2 { font-size:2rem; margin-bottom:20px;}
    .input-row { margin-bottom:24px; }
    label { display:block; margin-bottom:7px; color:#333; font-weight:500;}
    input[type="email"], input[type="password"] {
      width:100%; padding:13px 12px; font-size:16px; border:1.3px solid #d1d5db; border-radius:8px; background:#fafbfc; transition:.2s;
    }
    input:focus { border:1.4px solid #0b72f4; background:#fff;}
    button {
      display:block; width:100%; padding:13px 0; font-size:1.13rem; border:none; border-radius:9px;
      background:#1967d2; color:#fff; font-weight:600; letter-spacing:.08em; margin-top:8px; box-shadow:0 2px 18px #1567d218; cursor:pointer;
      transition:.18s;
    }
    button:disabled { background:#bbb;}
    .mail-app { max-width:1100px; margin:38px auto; display:flex; min-height:560px;}
    .sidebar {
      width:210px; background:#fff; border-radius:16px 0 0 16px; box-shadow:0 2px 18px #0001;
      padding:28px 0 12px 0; display:flex; flex-direction:column; align-items:center;
    }
    .sidebar .menu-btn {
      width:148px; padding:11px 0; margin:7px 0;
      border:none; background:#f2f7fd; color:#2467d6; border-radius:7px;
      font-size:15.8px; cursor:pointer; text-align:left; text-indent:18px;
      transition:.19s;
      font-weight:500;
      outline:none;
    }
    .sidebar .menu-btn.active, .sidebar .menu-btn:hover { background: #1967d2; color: #fff; }
    .logout-btn { margin-top:38px; color:#999; background:none; border:none; font-size:15px; cursor:pointer;}
    .content { flex:1; padding:0 34px 0 36px;}
    .header-bar { display:flex; align-items:center; gap:20px; margin:22px 0 14px 0;}
    .mail-list { margin-top:0;}
    .mail-item {
      padding:13px 0 13px 0; border-bottom:1.5px solid #f3f4f7; cursor:pointer; transition:.16s;
      display:flex; align-items:center; gap:13px;
    }
    .mail-item:hover { background:#f2f7fd;}
    .mail-from {color:#444; font-weight:600; min-width:118px;}
    .mail-to { color:#999; min-width:110px;}
    .mail-subject { flex:1;}
    .mail-date { color:#bbb; min-width:104px;}
    .detail-box { margin-top:22px; padding:20px 28px; border-radius:10px; background:#f8fafd; border:1px solid #e2ebf5;}
    .empty { color:#bbb; text-align:center; margin:30px 0;}
    .compose-form label {margin-top:14px; margin-bottom:7px;}
    .compose-form textarea {width:100%; min-height:85px; resize:vertical; padding:8px; border-radius:7px; border:1.2px solid #c7d7ea;}
    .attach-list { margin:10px 0 0 0;}
    .attach-item { display:inline-block; padding:2px 8px; background:#e3ebfc; border-radius:7px; font-size:13px; margin:0 5px 4px 0;}
    .attach-item a { color:#1967d2; text-decoration:none;}
    .right { float:right;}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // 1. 环境变量
    const API_BASE = ${JSON.stringify(apiBase)};
    // 2. 状态管理
    let user = null, token = '', state = { menu:'inbox', mails:[], detail:null };
    // 3. 页面渲染入口
    function render(){
      if(!user) return renderLogin();
      document.body.innerHTML = \`
      <div class="mail-app">
        <div class="sidebar">
          <button class="menu-btn" id="btn-inbox">\u2709\uFE0F 收件箱</button>
          <button class="menu-btn" id="btn-sent">\u27A1\uFE0F 发件箱</button>
          <button class="menu-btn" id="btn-compose">\u2709\uFE0F 写邮件</button>
          <button class="logout-btn" id="logoutBtn">退出登录</button>
        </div>
        <div class="content">
          <div class="header-bar">
            <h2 id="page-title"></h2>
          </div>
          <div id="main-content"></div>
        </div>
      </div>\`;
      // 事件绑定
      ['inbox','sent','compose'].forEach(menu=>{
        document.getElementById('btn-'+menu).onclick = ()=>showMenu(menu);
      });
      document.getElementById('logoutBtn').onclick = logout;
      showMenu(state.menu||'inbox');
    }
    function renderLogin(){
      document.body.innerHTML = \`
      <div class="main-card">
        <h2>简邮邮箱登录</h2>
        <form id="loginForm">
          <div class="input-row">
            <label>邮箱</label>
            <input type="email" id="email" required placeholder="your@email.com">
          </div>
          <div class="input-row">
            <label>密码</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit">登录</button>
        </form>
        <div id="loginStatus" style="color:#d22;margin-top:16px;"></div>
      </div>\`;
      document.getElementById('loginForm').onsubmit = async function(e){
        e.preventDefault();
        let email = document.getElementById('email').value.trim();
        let password = document.getElementById('password').value;
        let btn = this.querySelector('button');
        btn.disabled = true;
        let r = await fetch(API_BASE+"/user/login",{
          method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",
          body:JSON.stringify({email,password})
        }).then(r=>r.json()).catch(()=>({}));
        btn.disabled = false;
        if(r.success){ user = {email}; state.menu="inbox"; render(); }
        else document.getElementById('loginStatus').textContent = r.error || "登录失败";
      };
    }
    // ========== 主菜单 ==========
    async function showMenu(menu){
      state.menu = menu;
      // 按钮高亮
      document.querySelectorAll('.menu-btn').forEach(btn=>btn.classList.remove('active'));
      document.getElementById('btn-'+menu).classList.add('active');
      // 页面
      let title = {inbox:"收件箱",sent:"发件箱",compose:"写邮件"}[menu];
      document.getElementById('page-title').textContent = title;
      let el = document.getElementById('main-content');
      if(menu==="inbox")      await loadInbox(el);
      else if(menu==="sent")  await loadSent(el);
      else if(menu==="compose") renderCompose(el);
    }
    async function logout(){
      await fetch(API_BASE+"/user/logout",{method:"POST",credentials:"include"});
      user = null; render();
    }
    // ========== 邮件相关 ==========
    async function loadInbox(el){
      el.innerHTML = '<div class="empty">加载中...</div>';
      let r = await fetch(API_BASE+"/user/inbox",{credentials:"include"}).then(r=>r.json());
      if(!r.mails || !r.mails.length){ el.innerHTML='<div class="empty">暂无邮件</div>'; return; }
      el.innerHTML = r.mails.map(m=>
        '<div class="mail-item" onclick="showDetail(\''+m.id+'\',false)">'+
          '<div class="mail-from">'+m.mail_from+'</div>'+
          '<div class="mail-subject">'+(m.subject||'(无主题)')+'</div>'+
          '<div class="mail-date">'+m.created_at.slice(0,16).replace("T"," ")+'</div>'+
        '</div>'
      ).join("");
      window.showDetail = showDetail;
    }
    async function loadSent(el){
      el.innerHTML = '<div class="empty">加载中...</div>';
      let r = await fetch(API_BASE+"/user/sent",{credentials:"include"}).then(r=>r.json());
      if(!r.mails || !r.mails.length){ el.innerHTML='<div class="empty">暂无发件</div>'; return; }
      el.innerHTML = r.mails.map(m=>
        '<div class="mail-item" onclick="showDetail(\''+m.id+'\',true)">'+
          '<div class="mail-to">'+m.mail_to+'</div>'+
          '<div class="mail-subject">'+(m.subject||'(无主题)')+'</div>'+
          '<div class="mail-date">'+m.created_at.slice(0,16).replace("T"," ")+'</div>'+
        '</div>'
      ).join("");
      window.showDetail = showDetail;
    }
    async function showDetail(id,sent){
      let url = sent ? "/user/sentmail?id="+encodeURIComponent(id) : "/user/mail?id="+encodeURIComponent(id);
      let r = await fetch(API_BASE+url,{credentials:"include"}).then(r=>r.json());
      let mail = r.mail;
      if(!mail){ document.getElementById('main-content').innerHTML='<div class="empty">邮件不存在或无权限。</div>'; return; }
      document.getElementById('main-content').innerHTML = \`
        <div class="detail-box">
          <b>主题：</b>\${mail.subject||'(无主题)'}<br>
          <b>\${sent?'收件人':'发件人'}：</b>\${sent?mail.mail_to:mail.mail_from}<br>
          <b>时间：</b>\${mail.created_at.slice(0,16).replace('T',' ')}<br>
          <hr>
          <div style="white-space:pre-wrap;margin-bottom:10px;">\${mail.body||'(无正文)'}</div>
          <div class="attach-list">\${mail.attachments && mail.attachments.length ? mail.attachments.map(a=>(
            '<span class="attach-item"><a href="'+API_BASE+'/api/attachment?id='+mail.id+'&filename='+encodeURIComponent(a.filename)+'" target="_blank">'+a.filename+'</a> ('+a.size+'字节)</span>'
          )).join('') : ''}</div>
          <button onclick="replyMail('\${sent?mail.mail_to:mail.mail_from}','Re:'+mail.subject)">回复</button>
        </div>
      \`;
      window.replyMail = (to,subject)=>{
        state.menu = "compose";
        render();
        setTimeout(()=>{
          document.getElementById('to').value = to;
          document.getElementById('subject').value = subject;
        },0);
      }
    }
    // ========== 写邮件 ==========
    function renderCompose(el){
      el.innerHTML = \`
        <form class="compose-form" id="composeForm">
          <label>收件人</label>
          <input type="email" id="to" required placeholder="收件人邮箱">
          <label>主题</label>
          <input type="text" id="subject" placeholder="邮件主题">
          <label>正文</label>
          <textarea id="body" required></textarea>
          <label>附件（可选）</label>
          <input type="file" id="fileInput" multiple style="margin-bottom:10px;">
          <button type="submit">发送</button>
        </form>
        <div class="empty" id="composeStatus" style="display:none"></div>
      \`;
      document.getElementById('composeForm').onsubmit = async function(e){
        e.preventDefault();
        let to = document.getElementById('to').value.trim(),
            subject = document.getElementById('subject').value.trim(),
            body = document.getElementById('body').value.trim(),
            files = document.getElementById('fileInput').files;
        let btn = this.querySelector('button');
        let status = document.getElementById('composeStatus');
        btn.disabled = true; status.style.display = ""; status.textContent = "发送中...";
        // 附件上传
        let attachments = [];
        if(files.length){
          let form = new FormData();
          for(let f of files) form.append('file', f);
          let r = await fetch(API_BASE+'/user/upload-attachment',{
            method:'POST',body:form,credentials:'include'
          }).then(r=>r.json());
          if(r.attachments) attachments = r.attachments;
          else { status.textContent = r.error||"附件上传失败"; btn.disabled = false; return; }
        }
        // 发信
        let resp = await fetch(API_BASE+'/user/send',{
          method:'POST',
          headers:{"Content-Type":"application/json"},
          credentials:'include',
          body:JSON.stringify({to,subject,body,attachments})
        }).then(r=>r.json());
        if(resp.success){ status.textContent = "已发送！"; this.reset(); }
        else status.textContent = resp.error||"发送失败";
        btn.disabled = false;
      }
    }
    // ========== 自动登录态检测 ==========
    async function checkLogin(){
      let r = await fetch(API_BASE+"/user/check",{credentials:"include"}).then(r=>r.json()).catch(()=>({}));
      if(r.loggedIn) { user={}; render(); }
      else renderLogin();
    }
    window.onload = checkLogin;
  </script>
</body>
</html>
  `;
  return new Response(html, {
    headers: {
      "content-type":"text/html; charset=utf-8",
      "cache-control":"no-store",
      "x-frame-options":"SAMEORIGIN"
    }
  });
}
