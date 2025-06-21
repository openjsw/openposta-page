export async function onRequest(context) {
  const env = context.env || {};
  const apiBase = env.API_BASE || '';

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>简邮邮箱</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: system-ui,sans-serif; margin:0; background: #f9fafb; }
    .container { max-width: 460px; margin: 60px auto; background:#fff; border-radius: 12px; box-shadow: 0 4px 32px #0011.07; padding: 30px 32px 38px; }
    h1 { font-size: 26px; margin: 0 0 26px; }
    .input-row { margin-bottom: 22px; }
    label { display:block; margin-bottom:5px; font-weight:500;}
    input,textarea { width:100%; padding:8px 10px; border-radius:6px; border:1.2px solid #ddd; font-size:16px; }
    textarea { min-height: 80px; resize:vertical; }
    button { padding: 10px 18px; border-radius: 6px; border:none; background: #4285f4; color:#fff; font-size: 17px; cursor:pointer;}
    button[disabled] { background: #bbb; }
    .nav { display:flex; gap:15px; margin-bottom:20px;}
    .nav button { background:#e3eefd; color:#3577d4; }
    .nav button.active, .nav button:hover { background:#4285f4; color:#fff; }
    .mail-list {margin-bottom:16px;}
    .mail-item {border-bottom:1px solid #ececec;padding:12px 0;cursor:pointer;}
    .mail-item:hover {background:#f6f7fb;}
    .fromto {font-size:12px;color:#888;}
    .empty {text-align:center;color:#aaa;margin:30px 0;}
    .detail {background:#f7fafd;border:1px solid #e3ebf3;border-radius:8px;padding:13px 15px 13px 18px;margin-top:15px;}
    .attach {margin:7px 0 0 0;}
    .attach a {color:#2977ed;text-decoration:underline;font-size:14px;display:inline-block;margin-right:7px;}
    .status {color:#e22;margin-top:16px;}
    .logout-btn {color:#999; background:none; border:none; margin-left:20px; cursor:pointer;}
  </style>
</head>
<body>
<div class="container">
  <h1>简邮邮箱</h1>
  <form id="loginForm" style="display:none;">
    <div class="input-row">
      <label>邮箱</label>
      <input type="email" id="email" placeholder="your@email.com" required>
    </div>
    <div class="input-row">
      <label>密码</label>
      <input type="password" id="password" required>
    </div>
    <button type="submit">登录</button>
  </form>
  <div id="app" style="display:none;">
    <div class="nav">
      <button id="inboxBtn" class="active">收件箱</button>
      <button id="sentBtn">已发送</button>
      <button id="composeBtn">写信</button>
      <button class="logout-btn" id="logoutBtn">退出</button>
    </div>
    <div id="inboxBox">
      <div class="mail-list" id="inboxList"></div>
      <div class="empty" id="inboxEmpty" style="display:none;">暂无邮件</div>
      <div class="detail" id="inboxDetail" style="display:none;"></div>
    </div>
    <div id="sentBox" style="display:none;">
      <div class="mail-list" id="sentList"></div>
      <div class="empty" id="sentEmpty" style="display:none;">暂无发件</div>
      <div class="detail" id="sentDetail" style="display:none;"></div>
    </div>
    <div id="composeBox" style="display:none;">
      <form id="composeForm">
        <div class="input-row"><label>收件人</label><input id="to" type="email" required></div>
        <div class="input-row"><label>主题</label><input id="subject"></div>
        <div class="input-row"><label>正文</label><textarea id="body"></textarea></div>
        <div class="input-row"><label>HTML正文（可选）</label><textarea id="body_html"></textarea></div>
        <div class="input-row"><label>附件（最多5个，10MB）</label>
          <input id="attachInput" type="file" multiple>
        </div>
        <button type="submit">发送</button>
        <div class="status" id="composeStatus"></div>
      </form>
    </div>
  </div>
</div>
<script>
  const API_BASE = ${JSON.stringify(apiBase)};
  function esc(s){return (s||'').replace(/[<>&"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]);}
  function formatTime(t){let d=new Date(t);return d.getFullYear()+"/"+(d.getMonth()+1)+"/"+d.getDate()+" "+d.getHours()+":"+('0'+d.getMinutes()).slice(-2);}
  let attachmentsForSend = [];

  async function checkLogin(){
    let r = await fetch(API_BASE + "/user/check",{credentials:"include"}).then(r=>r.json());
    if(r.loggedIn){ showApp(); loadInbox(); } else showLogin();
  }
  function showLogin(){
    document.getElementById('loginForm').style.display = '';
    document.getElementById('app').style.display = 'none';
  }
  function showApp(){
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('app').style.display = '';
    showBox('inbox');
  }
  function showBox(box){
    for(const id of ['inboxBox','sentBox','composeBox'])
      document.getElementById(id).style.display = box+'Box'==id ? '' : 'none';
    for(const id of ['inboxBtn','sentBtn','composeBtn'])
      document.getElementById(id).classList.toggle('active', id.startsWith(box));
    if(box==='inbox') loadInbox();
    if(box==='sent') loadSent();
    if(box==='compose'){ document.getElementById('composeForm').reset(); attachmentsForSend=[]; document.getElementById('composeStatus').textContent=''; }
  }

  document.getElementById('loginForm').onsubmit = async function(e){
    e.preventDefault();
    const email = document.getElementById('email').value, password = document.getElementById('password').value;
    let btn = this.querySelector('button'); btn.disabled = true;
    let r = await fetch(API_BASE + "/user/login", {
      method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include",
      body: JSON.stringify({email, password})
    }).then(r=>r.json());
    btn.disabled = false;
    if(r.success){ showApp(); loadInbox(); }
    else alert(r.error||"登录失败");
  };
  document.getElementById('logoutBtn').onclick = async function(){
    await fetch(API_BASE + "/user/logout",{method:"POST",credentials:"include"});
    showLogin();
  };
  document.getElementById('inboxBtn').onclick = ()=>showBox('inbox');
  document.getElementById('sentBtn').onclick = ()=>showBox('sent');
  document.getElementById('composeBtn').onclick = ()=>showBox('compose');

  async function loadInbox(){
    let list = document.getElementById('inboxList');
    let r = await fetch(API_BASE+"/user/inbox",{credentials:"include"}).then(r=>r.json());
    list.innerHTML = '';
    if(r.mails && r.mails.length){
      for(const m of r.mails){
        let div = document.createElement('div');
        div.className = 'mail-item';
        div.innerHTML = '<b>'+esc(m.subject||'(无主题)')+'</b> <span class="fromto">'+esc(m.mail_from)+'</span> <span class="fromto">'+formatTime(m.created_at)+'</span>';
        div.onclick = ()=>showMailDetail(m.id);
        list.appendChild(div);
      }
      document.getElementById('inboxEmpty').style.display='none';
    }else document.getElementById('inboxEmpty').style.display='';
    document.getElementById('inboxDetail').style.display='none';
  }
  async function showMailDetail(id){
    let box = document.getElementById('inboxDetail');
    box.innerHTML = '加载中...';
    box.style.display='';
    let r = await fetch(API_BASE+"/user/mail?id="+encodeURIComponent(id),{credentials:"include"}).then(r=>r.json());
    if(!r.mail){ box.textContent = "邮件不存在或无权限"; return; }
    let ahtml = '';
    if(r.mail.attachments && r.mail.attachments.length){
      for(const att of r.mail.attachments){
        ahtml += '<div class="attach"><a href="'+API_BASE+'/api/attachment?id='+encodeURIComponent(id)+'&filename='+encodeURIComponent(att.filename)+'" target="_blank">'+esc(att.filename)+'</a></div>';
      }
    }
    let bodyHtml = r.mail.body_html ? '<div style="margin:13px 0; border:1px solid #e3e3ee; border-radius:5px; background:#fcfcfd; padding:9px;">'+r.mail.body_html+'</div>' : '';
    box.innerHTML = '<b>主题：</b>'+esc(r.mail.subject||'(无主题)')+'<br>'
      +'<b>发件人：</b>'+esc(r.mail.mail_from)+'<br>'
      +'<b>时间：</b>'+formatTime(r.mail.created_at)+'<hr>'
      +'<div style="white-space:pre-wrap;">'+esc(r.mail.body||'')+'</div>'
      +bodyHtml + ahtml;
  }

  async function loadSent(){
    let list = document.getElementById('sentList');
    let r = await fetch(API_BASE+"/user/sent",{credentials:"include"}).then(r=>r.json());
    list.innerHTML = '';
    if(r.mails && r.mails.length){
      for(const m of r.mails){
        let div = document.createElement('div');
        div.className = 'mail-item';
        div.innerHTML = '<b>'+esc(m.subject||'(无主题)')+'</b> <span class="fromto">'+esc(m.mail_to)+'</span> <span class="fromto">'+formatTime(m.created_at)+'</span>';
        div.onclick = ()=>showSentMailDetail(m.id);
        list.appendChild(div);
      }
      document.getElementById('sentEmpty').style.display='none';
    }else document.getElementById('sentEmpty').style.display='';
    document.getElementById('sentDetail').style.display='none';
  }
  async function showSentMailDetail(id){
    let box = document.getElementById('sentDetail');
    box.innerHTML = '加载中...';
    box.style.display='';
    let r = await fetch(API_BASE+"/user/sentmail?id="+encodeURIComponent(id),{credentials:"include"}).then(r=>r.json());
    if(!r.mail){ box.textContent = "邮件不存在或无权限"; return; }
    let ahtml = '';
    if(r.mail.attachments && r.mail.attachments.length){
      for(const att of r.mail.attachments){
        ahtml += '<div class="attach"><a href="'+API_BASE+'/api/attachment?id='+encodeURIComponent(id)+'&filename='+encodeURIComponent(att.filename)+'" target="_blank">'+esc(att.filename)+'</a></div>';
      }
    }
    let bodyHtml = r.mail.body_html ? '<div style="margin:13px 0; border:1px solid #e3e3ee; border-radius:5px; background:#fcfcfd; padding:9px;">'+r.mail.body_html+'</div>' : '';
    box.innerHTML = '<b>主题：</b>'+esc(r.mail.subject||'(无主题)')+'<br>'
      +'<b>收件人：</b>'+esc(r.mail.mail_to)+'<br>'
      +'<b>时间：</b>'+formatTime(r.mail.created_at)+'<hr>'
      +'<div style="white-space:pre-wrap;">'+esc(r.mail.body||'')+'</div>'
      +bodyHtml + ahtml;
  }

  // 附件上传
  document.getElementById('attachInput').addEventListener('change', async function(e){
    let files = Array.from(this.files);
    if(files.length>5) return alert("最多5个附件");
    let form = new FormData();
    files.forEach(f=>form.append('file', f));
    let r = await fetch(API_BASE+"/user/upload-attachment",{
      method:"POST",credentials:"include",body:form
    }).then(r=>r.json());
    if(r.success){ attachmentsForSend = r.attachments; alert("附件上传成功"); }
    else alert(r.error||"附件上传失败");
  });

  // 写信
  document.getElementById('composeForm').onsubmit = async function(e){
    e.preventDefault();
    const to = document.getElementById('to').value.trim(),
          subject = document.getElementById('subject').value.trim(),
          body = document.getElementById('body').value,
          body_html = document.getElementById('body_html').value;
    const btn = this.querySelector('button');
    btn.disabled = true;
    document.getElementById('composeStatus').textContent = '';
    let r = await fetch(API_BASE + '/user/send', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify({ to, subject, body, body_html, attachments: attachmentsForSend })
    }).then(r=>r.json());
    btn.disabled = false;
    if(r.success){ this.reset(); attachmentsForSend=[]; document.getElementById('composeStatus').textContent="发送成功"; loadSent(); }
    else document.getElementById('composeStatus').textContent = r.error||"发送失败";
  };

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
