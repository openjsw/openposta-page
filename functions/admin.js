export async function onRequest(context) {
  const env = context.env || {};
  const url = new URL(context.request.url);

  // 多语言
  let lang = url.searchParams.get('lang')
    || (context.request.headers.get('accept-language')?.split(',')[0] || '').toLowerCase()
    || (env.DEFAULT_LANG || 'zh-CN');
  lang = lang.startsWith('en') ? 'en' : 'zh-CN';
  const i18nDict = {
    'zh-CN': {
      title: '邮局管理后台', adminLogin: '管理员登录', username: '用户名', password: '密码', login: '登录',
      logout: '退出登录', loginError: '登录失败', accounts: '邮箱账户管理', email: '邮箱前缀', domain: '邮箱后缀',
      pwd: '密码', add: '新增邮箱', addSuccess: '添加成功', addFail: '添加失败', delete: '删除', 
      deleteConfirm: '确定要删除此邮箱？', deleted: '已删除', allowSend: '允许发信', allowRecv: '允许收信',
      op: '操作', created: '创建时间', loading: '加载中...', inputEmailPwd: '请输入邮箱和密码', yes: '是', no: '否'
    },
    'en': {
      title: 'Mail Admin Panel', adminLogin: 'Admin Login', username: 'Username', password: 'Password', login: 'Login',
      logout: 'Logout', loginError: 'Login failed', accounts: 'Mail Account Management', email: 'Prefix', domain: 'Domain',
      pwd: 'Password', add: 'Add Email', addSuccess: 'Added', addFail: 'Add failed', delete: 'Delete',
      deleteConfirm: 'Are you sure to delete?', deleted: 'Deleted', allowSend: 'Can Send', allowRecv: 'Can Receive',
      op: 'Action', created: 'Created', loading: 'Loading...', inputEmailPwd: 'Enter email and password', yes: 'Yes', no: 'No'
    }
  };
  const t = i18nDict[lang];

  // 邮箱域名支持
  const domains = String(env.emaildomain || 'openjsw.net').split(',').map(s=>s.trim()).filter(Boolean);
  const defaultDomain = domains[0] || 'openjsw.net';
  const API_BASE = env.API_BASE || 'https://api-663395.openjsw.net';

  // 语言切换
  const langSwitcher = `
    <div style="position:fixed;top:28px;right:48px;font-size:15px;">
      <a href="?lang=zh-CN"${lang==='zh-CN'?' style="font-weight:bold"':''}>简体中文</a> |
      <a href="?lang=en"${lang==='en'?' style="font-weight:bold"':''}>English</a>
    </div>
  `;

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${t.title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    html, body { height: 100%; margin:0; padding:0;}
    body { background: #f8f8fa; min-height:100vh; font-family: system-ui,sans-serif; color:#222;}
    #app { max-width: 820px; margin: 68px auto 0 auto; padding: 0 24px 44px 24px;}
    h2 { margin: 0 0 28px 0; font-size:2.05em; font-weight:800; letter-spacing:0.01em;}
    .login-container {
      margin: 60px auto 0 auto; max-width:430px; background: #fff;
      border-radius: 12px; box-shadow: 0 4px 28px #0002; padding: 44px 38px 34px 38px;
    }
    .form-label { display:block; margin-bottom:8px; font-weight:500;}
    .form-input {
      width: 100%; padding: 12px 13px; border:1.5px solid #dae1e8; border-radius: 7px;
      font-size: 17px; margin-bottom: 20px; box-sizing: border-box; background:#f7fafd;
      transition: border .18s;
    }
    .form-input:focus { border-color: #3577d4; background: #fff;}
    .form-btn {
      width: 100%; padding: 13px 0; border: none; background: #3577d4; color: #fff;
      font-size: 18px; border-radius: 8px; cursor: pointer; font-weight:600; letter-spacing:0.05em;
      transition: background .18s;
    }
    .form-btn:disabled { background: #b8c4d2; cursor: not-allowed; }
    .error-msg { background:#fff2f2; color:#d12d2d; padding:10px 13px; border-radius:7px;
      margin-bottom:17px; text-align:center; font-size:16px;}
    .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;}
    .admin-header h2 { margin:0; font-size:1.55em;}
    .admin-header .btn { padding: 7px 22px; font-size:15px; border-radius: 7px; border: none; background: #eceff3;}
    .admin-header .btn:hover { background: #e6edfa; }
    .admin-form-row { display:flex; gap:22px; margin-bottom: 6px; align-items:end;}
    .input-combo { display:flex; width:100%; border-radius:7px; border:1.5px solid #dae1e8; overflow:hidden;}
    .input-combo input { border:none; background:#f7fafd; padding:12px 13px; font-size:17px; flex:1; min-width:0; outline:none;}
    .input-combo select { border:none; background:#f6f7f9; font-size:17px; padding:12px 17px 12px 10px; min-width:100px; outline:none;}
    .input-combo:focus-within { box-shadow:0 0 0 2px #c1d8f9;}
    .admin-form-row .form-input { margin-bottom:0; }
    .admin-form-row > div { flex:1; }
    .admin-form-row .combo-wrap { flex:2.1; }
    .admin-form-row .pwd-wrap { flex:2; }
    .admin-form-row .submit-wrap { flex:1.1; min-width:110px;}
    .form-switch-row { margin: 10px 0 16px 0;}
    .form-switch-row label { font-size:15px; margin-right:16px;}
    .form-switch-row input[type=checkbox] { margin-right:5px; }
    table { border-collapse:collapse; width:100%; background:#fff; margin-top:18px;}
    th, td { border:1px solid #ececec; padding: 12px 7px; text-align:center; font-size:15.5px;}
    th { background: #f5f7fa; font-weight:500;}
    .switch { position:relative; display:inline-block; width:36px; height:22px;}
    .switch input { opacity:0; width:0; height:0;}
    .slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0;
      background:#ccc; border-radius:18px; transition:.2s;}
    .switch input:checked + .slider { background:#3577d4;}
    .slider:before { position:absolute; content:""; height:16px; width:16px; left:3px; bottom:3px;
      background:#fff; border-radius:50%; transition:.2s;}
    .switch input:checked + .slider:before { transform:translateX(14px);}
    .danger { color:#e14; background: #fff7f7; border: 1.5px solid #fad5d5;}
    .loading { color:#888; text-align:center; margin-top:16px;}
    @media (max-width: 700px) {
      #app { max-width:100vw; padding:0 3vw 14vw 3vw;}
      .login-container { padding:28px 8vw 22px 8vw;}
      .admin-header, .admin-form-row { flex-direction:column; gap:0;}
      .admin-header { align-items: flex-start; }
      table, th, td { font-size:14px;}
    }
  </style>
</head>
<body>
  ${langSwitcher}
  <div id="app"></div>
  <script>
  const t = ${JSON.stringify(t)};
  const API_BASE = ${JSON.stringify(API_BASE)};
  const domains = ${JSON.stringify(domains)};
  const defaultDomain = ${JSON.stringify(defaultDomain)};
  function formatTime(str) {
    if (!str) return '';
    let d = new Date(str);
    return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0')
        +' '+d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
  }
  function escapeHtml(str) {
    return String(str||'').replace(/[<>&"]/g, s=>({'<':'&lt;','>':'&gt;','&':'&amp;'})[s]);
  }
  // 状态
  const app = document.getElementById('app');
  let state = {
    loginForm: { username: '', password: '' },
    loginError: '', loginLoading: false, loggedIn: false,
    addForm: { email_prefix: '', domain: defaultDomain, password: '', can_send: true, can_receive: true },
    addLoading: false, accounts: [], loading: false,
  };
  function setState(obj) { Object.assign(state, obj); render(); }
  async function login() {
    setState({loginLoading:true, loginError:''});
    try {
      let res = await fetch(API_BASE+'/manage/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify(state.loginForm)
      });
      let data = await res.json();
      if (data.success) {
        setState({loggedIn:true, loginLoading:false, loginError:''});
        loadAccounts();
      } else {
        setState({loginError:data.error||t.loginError, loginLoading:false});
      }
    } catch {
      setState({loginError:t.loginError, loginLoading:false});
    }
  }
  async function logout() {
    await fetch(API_BASE+'/manage/logout', {method:'POST', credentials:'include'});
    setState({loggedIn:false});
  }
  async function loadAccounts() {
    setState({loading:true});
    let res = await fetch(API_BASE+'/manage/list', {credentials:'include'});
    let data = await res.json();
    if (Array.isArray(data.accounts)) {
      setState({accounts: data.accounts.map(acc => ({
        ...acc, can_send: Number(acc.can_send), can_receive: Number(acc.can_receive),
      })), loading:false});
    } else {
      setState({accounts:[], loading:false});
    }
  }
  async function addAccount(ev) {
    if (ev) ev.preventDefault();
    if (!state.addForm.email_prefix || !state.addForm.password) {
      alert(t.inputEmailPwd); return;
    }
    setState({addLoading:true});
    let payload = {
      email: state.addForm.email_prefix + '@' + state.addForm.domain,
      password: state.addForm.password,
      can_send: state.addForm.can_send,
      can_receive: state.addForm.can_receive
    };
    let res = await fetch(API_BASE+'/manage/add', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify(payload)
    });
    let data = await res.json();
    setState({addLoading:false});
    if (data.success) {
      alert(t.addSuccess);
      setState({addForm:{email_prefix:'',domain:defaultDomain,password:'',can_send:true,can_receive:true}});
      loadAccounts();
    } else {
      alert(data.error || t.addFail);
    }
  }
  async function deleteAccount(email) {
    if (!confirm(t.deleteConfirm)) return;
    let res = await fetch(API_BASE+'/manage/delete', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({email})
    });
    let data = await res.json();
    if (data.success) {
      alert(t.deleted);
      loadAccounts();
    } else {
      alert(data.error || t.addFail);
    }
  }
  async function updateAccount(row) {
    await fetch(API_BASE+'/manage/update', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({
        email: row.email,
        can_send: row.can_send,
        can_receive: row.can_receive
      })
    });
    loadAccounts();
  }
  async function checkLogin() {
    try {
      let res = await fetch(API_BASE+'/manage/check', {credentials:'include'});
      let data = await res.json();
      setState({loggedIn:!!data.loggedIn});
      if (data.loggedIn) loadAccounts();
    } catch {
      setState({loggedIn:false});
    }
  }
  window.onToggleSend = function (el) {
    const idx = Number(el.dataset.index);
    const acc = state.accounts[idx];
    acc.can_send = el.checked ? 1 : 0;
    updateAccount(acc);
  };
  window.onToggleRecv = function (el) {
    const idx = Number(el.dataset.index);
    const acc = state.accounts[idx];
    acc.can_receive = el.checked ? 1 : 0;
    updateAccount(acc);
  };
  function render() {
    if (!state.loggedIn) {
      app.innerHTML = \`
        <div class="login-container">
          <h2>\${t.adminLogin}</h2>
          <form id="loginForm" autocomplete="on">
            <label class="form-label">\${t.username}</label>
            <input class="form-input" type="text" autocomplete="username" autofocus
              value="\${escapeHtml(state.loginForm.username)}"
              oninput="this.value=this.value.replace(/\\s/g,'');state.loginForm.username=this.value">
            <label class="form-label">\${t.password}</label>
            <input class="form-input" type="password" autocomplete="current-password"
              value="\${escapeHtml(state.loginForm.password)}"
              oninput="state.loginForm.password=this.value">
            \${state.loginError?'<div class="error-msg">'+escapeHtml(state.loginError)+'</div>':''}
            <button class="form-btn" type="submit" id="loginBtn" \${state.loginLoading?'disabled':''}>
              \${state.loginLoading?t.loading:t.login}
            </button>
          </form>
        </div>
      \`;
      setTimeout(()=>{
        document.getElementById('loginForm').onsubmit = function(e){
          e.preventDefault();
          if (!state.loginLoading) login();
        };
      }, 1);
    } else {
      app.innerHTML = \`
        <div class="admin-header">
          <h2>\${t.accounts}</h2>
          <button class="btn" onclick="logout()">\${t.logout}</button>
        </div>
        <form id="addForm">
          <div class="admin-form-row">
            <div class="combo-wrap">
              <label class="form-label">\${t.email}</label>
              <div class="input-combo">
                <input type="text" value="\${escapeHtml(state.addForm.email_prefix||'')}"
                  placeholder="\${t.email}" oninput="state.addForm.email_prefix=this.value" autocomplete="off">
                <select id="domainSel">
                  \${domains.map(d=>\`<option value="\${d}"\${d===state.addForm.domain?' selected':''}>@\${d}</option>\`).join('')}
                </select>
              </div>
            </div>
            <div class="pwd-wrap">
              <label class="form-label">\${t.pwd}</label>
              <input class="form-input" type="password" value="\${escapeHtml(state.addForm.password||'')}"
                placeholder="\${t.pwd}" oninput="state.addForm.password=this.value" autocomplete="new-password">
            </div>
            <div class="submit-wrap">
              <button class="form-btn" type="submit" id="addBtn" \${state.addLoading?'disabled':''}>
                \${state.addLoading?t.loading:t.add}
              </button>
            </div>
          </div>
          <div class="form-switch-row">
            <label>
              <input type="checkbox" id="sendChk" \${state.addForm.can_send?'checked':''}
                onchange="state.addForm.can_send=this.checked">\${t.allowSend}
            </label>
            <label>
              <input type="checkbox" id="recvChk" \${state.addForm.can_receive?'checked':''}
                onchange="state.addForm.can_receive=this.checked">\${t.allowRecv}
            </label>
          </div>
        </form>
        <table>
          <thead>
            <tr>
              <th>\${t.email}</th>
              <th>@</th>
              <th>\${t.allowSend}</th>
              <th>\${t.allowRecv}</th>
              <th>\${t.created}</th>
              <th>\${t.op}</th>
            </tr>
          </thead>
          <tbody>
            \${state.loading?'<tr><td colspan="6" class="loading">'+t.loading+'</td></tr>':(
              state.accounts.length===0?
              '<tr><td colspan="6" class="loading">-</td></tr>':
              state.accounts.map((acc,i)=>\`
                <tr>
                  <td>\${escapeHtml(acc.email.split('@')[0])}</td>
                  <td>@\${escapeHtml(acc.email.split('@')[1]||'')}</td>
                  <td>
                    <label class="switch">
                      <input type="checkbox" \${acc.can_send?'checked':''} data-index="\${i}" onchange="onToggleSend(this)">
                      <span class="slider"></span>
                    </label>
                  </td>
                  <td>
                    <label class="switch">
                      <input type="checkbox" \${acc.can_receive?'checked':''} data-index="\${i}" onchange="onToggleRecv(this)">
                      <span class="slider"></span>
                    </label>
                  </td>
                  <td>\${formatTime(acc.created_at)}</td>
                  <td>
                    <button class="btn danger" onclick="deleteAccount('\${escapeHtml(acc.email)}')">\${t.delete}</button>
                  </td>
                </tr>
              \`).join('')
            )}
          </tbody>
        </table>
      \`;
      setTimeout(()=>{
        document.getElementById('addForm').onsubmit = function(e){
          addAccount(e);
        };
        document.getElementById('domainSel').onchange = function(){
          state.addForm.domain = this.value;
        };
      },1);
    }
  }
  window.state = state;
  window.setState = setState;
  window.logout = logout;
  window.deleteAccount = deleteAccount;
  window.updateAccount = updateAccount;
  checkLogin();
  render();
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
