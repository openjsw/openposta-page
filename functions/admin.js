export async function onRequest(context) {
  const env = context.env || {};
  const url = new URL(context.request.url);

  // 多语言判断
  let lang = url.searchParams.get('lang')
    || (context.request.headers.get('accept-language')?.split(',')[0] || '').toLowerCase()
    || (env.DEFAULT_LANG || 'zh-CN');
  lang = lang.startsWith('en') ? 'en' : 'zh-CN';

  // 多语言字典
  const i18nDict = {
    'zh-CN': {
      title: '邮局管理后台',
      adminLogin: '管理员登录',
      username: '用户名',
      password: '密码',
      login: '登录',
      logout: '退出登录',
      loginError: '登录失败',
      accounts: '邮箱账户管理',
      email: '邮箱',
      pwd: '密码',
      add: '新增邮箱',
      addSuccess: '添加成功',
      addFail: '添加失败',
      delete: '删除',
      deleteConfirm: '确定要删除此邮箱？',
      deleted: '已删除',
      allowSend: '允许发信',
      allowRecv: '允许收信',
      op: '操作',
      created: '创建时间',
      loading: '加载中...',
      inputEmailPwd: '请输入邮箱和密码',
      yes: '是', no: '否'
    },
    'en': {
      title: 'Mail Admin Panel',
      adminLogin: 'Admin Login',
      username: 'Username',
      password: 'Password',
      login: 'Login',
      logout: 'Logout',
      loginError: 'Login failed',
      accounts: 'Mail Account Management',
      email: 'Email',
      pwd: 'Password',
      add: 'Add Email',
      addSuccess: 'Added',
      addFail: 'Add failed',
      delete: 'Delete',
      deleteConfirm: 'Are you sure to delete?',
      deleted: 'Deleted',
      allowSend: 'Can Send',
      allowRecv: 'Can Receive',
      op: 'Action',
      created: 'Created',
      loading: 'Loading...',
      inputEmailPwd: 'Enter email and password',
      yes: 'Yes', no: 'No'
    }
  };
  const t = i18nDict[lang];

  // 后端API
  const API_BASE = env.API_BASE || 'https://api-663395.openjsw.net';

  // 语言切换
  const langSwitcher = `
    <div style="position:absolute;top:10px;right:24px;font-size:15px;z-index:20;">
      <a href="?lang=zh-CN"${lang==='zh-CN'?' style="font-weight:bold"':''}>简体中文</a> |
      <a href="?lang=en"${lang==='en'?' style="font-weight:bold"':''}>English</a>
    </div>
  `;

  // 页面内容
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${t.title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { background: #f8f8fa; margin:0; font-family: system-ui,sans-serif; }
    #app { max-width: 700px; margin: 46px auto 0 auto; background: #fff;
      border-radius: 12px; box-shadow: 0 4px 18px #0002; padding: 36px 26px 28px 26px;}
    h2 { margin: 0 0 22px 0; text-align:center; font-size:1.7em;}
    .form { max-width:320px; margin: 0 auto 0 auto; }
    .form-group { margin-bottom: 18px; }
    .form-label { display:block; margin-bottom:6px; font-weight:500;}
    .form-input { width:100%; padding:9px 10px; border:1px solid #dadada; border-radius:6px;
      font-size: 16px; margin-bottom:2px; box-sizing: border-box;}
    .form-btn { width:100%; padding: 10px 0; border:none; background:#3577d4; color:#fff;
      font-size:17px; border-radius:6px; cursor:pointer; transition:0.18s; }
    .form-btn:disabled { background:#b8c4d2; cursor:not-allowed;}
    .error-msg { background:#fff4f4; color:#d43a3a; padding:8px 12px; border-radius:6px;
      margin-bottom:14px; text-align:center;}
    .table-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px;}
    .btn { padding: 6px 16px; background: #f6f7f8; color:#333; border-radius: 6px;
      border:1px solid #e4e8ec; cursor:pointer; font-size:15px;}
    .btn[disabled] { background: #ececec; color: #bbb; cursor:not-allowed;}
    .table { border-collapse:collapse; width:100%; margin-top:18px;}
    .table th, .table td { border:1px solid #ececec; padding: 8px 7px; text-align:center;}
    .table th { background: #f5f7fa; font-weight:500;}
    .switch { position:relative; display:inline-block; width:34px; height:20px; vertical-align:middle;}
    .switch input { opacity:0; width:0; height:0;}
    .slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0;
      background:#ccc; border-radius:18px; transition:.2s;}
    .switch input:checked + .slider { background:#4285f4;}
    .slider:before { position:absolute; content:""; height:14px; width:14px; left:3px; bottom:3px;
      background:#fff; border-radius:50%; transition:.2s;}
    .switch input:checked + .slider:before { transform:translateX(14px);}
    .danger { color:#e14; background: #fff7f7; border-color:#f7d3d3;}
    .loading { color:#888; text-align:center; margin-top:16px;}
    @media (max-width:600px) {
      #app { padding:18px 2vw 10vw 2vw;}
      .table th,.table td { font-size:13px; }
    }
  </style>
</head>
<body>
  ${langSwitcher}
  <div id="app"></div>
  <script>
  // --- 多语言
  const t = ${JSON.stringify(t)};
  const API_BASE = ${JSON.stringify(API_BASE)};

  // 工具函数
  function formatTime(str) {
    if (!str) return '';
    let d = new Date(str);
    return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0')
        +' '+d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
  }
  function escapeHtml(str) {
    return String(str||'').replace(/[<>&"]/g, s=>({'<':'&lt;','>':'&gt;','&':'&amp;'})[s]);
  }

  // 渲染方法
  const app = document.getElementById('app');
  let state = {
    loginForm: { username: '', password: '' },
    loginError: '',
    loginLoading: false,
    loggedIn: false,

    addForm: { email: '', password: '', can_send: true, can_receive: true },
    addLoading: false,
    accounts: [],
    loading: false,
  };

  function setState(obj) {
    Object.assign(state, obj);
    render();
  }

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
        ...acc,
        can_send: Number(acc.can_send), can_receive: Number(acc.can_receive),
      })), loading:false});
    } else {
      setState({accounts:[], loading:false});
    }
  }

  async function addAccount() {
    if (!state.addForm.email || !state.addForm.password) {
      alert(t.inputEmailPwd);
      return;
    }
    setState({addLoading:true});
    let res = await fetch(API_BASE+'/manage/add', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify(state.addForm)
    });
    let data = await res.json();
    setState({addLoading:false});
    if (data.success) {
      alert(t.addSuccess);
      setState({addForm:{email:'',password:'',can_send:true,can_receive:true}});
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

  function render() {
    if (!state.loggedIn) {
      app.innerHTML = \`
        <h2>\${t.adminLogin}</h2>
        <form class="form" onsubmit="return false;">
          <div class="form-group">
            <label class="form-label">\${t.username}</label>
            <input class="form-input" type="text" autocomplete="username"
              value="\${escapeHtml(state.loginForm.username)}"
              oninput="this.value=this.value.replace(/\\s/g,'');state.loginForm.username=this.value">
          </div>
          <div class="form-group">
            <label class="form-label">\${t.password}</label>
            <input class="form-input" type="password" autocomplete="current-password"
              value="\${escapeHtml(state.loginForm.password)}"
              oninput="state.loginForm.password=this.value">
          </div>
          \${state.loginError?'<div class="error-msg">'+escapeHtml(state.loginError)+'</div>':''}
          <button class="form-btn" type="submit" id="loginBtn" \${state.loginLoading?'disabled':''}>
            \${state.loginLoading?t.loading:t.login}
          </button>
        </form>
      \`;
      setTimeout(()=>{
        document.getElementById('loginBtn').onclick = login;
        document.querySelector('form').onsubmit = login;
      }, 1);
    } else {
      app.innerHTML = \`
        <div class="table-bar">
          <h2 style="text-align:left;margin:0;">\${t.accounts}</h2>
          <button class="btn" onclick="logout()">\${t.logout}</button>
        </div>
        <form class="form" style="margin-bottom:18px;" onsubmit="return false;">
          <div class="form-group" style="display:inline-block;width:38%;">
            <label class="form-label">\${t.email}</label>
            <input class="form-input" type="email" value="\${escapeHtml(state.addForm.email)}"
              placeholder="\${t.email}" oninput="state.addForm.email=this.value">
          </div>
          <div class="form-group" style="display:inline-block;width:36%;margin-left:4%;">
            <label class="form-label">\${t.pwd}</label>
            <input class="form-input" type="password" value="\${escapeHtml(state.addForm.password)}"
              placeholder="\${t.pwd}" oninput="state.addForm.password=this.value">
          </div>
          <div class="form-group" style="display:inline-block;width:18%;vertical-align:bottom;">
            <label class="form-label" style="font-size:13px;">&nbsp;</label>
            <button class="form-btn" type="submit" style="padding:9px 0;font-size:15px;" id="addBtn" \${state.addLoading?'disabled':''}>
              \${state.addLoading?t.loading:t.add}
            </button>
          </div>
          <div class="form-group" style="display:inline-block;width:100%;margin-top:6px;">
            <label style="font-size:13px;margin-right:10px;">
              <input type="checkbox" id="sendChk" \${state.addForm.can_send?'checked':''} 
                onchange="state.addForm.can_send=this.checked"> \${t.allowSend}
            </label>
            <label style="font-size:13px;">
              <input type="checkbox" id="recvChk" \${state.addForm.can_receive?'checked':''} 
                onchange="state.addForm.can_receive=this.checked"> \${t.allowRecv}
            </label>
          </div>
        </form>
        <table class="table">
          <thead>
            <tr>
              <th>\${t.email}</th>
              <th>\${t.allowSend}</th>
              <th>\${t.allowRecv}</th>
              <th>\${t.created}</th>
              <th>\${t.op}</th>
            </tr>
          </thead>
          <tbody>
            \${state.loading?'<tr><td colspan="5" class="loading">'+t.loading+'</td></tr>':(
              state.accounts.length===0?
              '<tr><td colspan="5" class="loading">-</td></tr>':
              state.accounts.map(acc=>\`
                <tr>
                  <td>\${escapeHtml(acc.email)}</td>
                  <td>
                    <label class="switch">
                      <input type="checkbox" \${acc.can_send?'checked':''} onchange="state.accounts.find(a=>a.email=='\${acc.email}').can_send=this.checked?1:0;updateAccount(state.accounts.find(a=>a.email=='\${acc.email}'))">
                      <span class="slider"></span>
                    </label>
                  </td>
                  <td>
                    <label class="switch">
                      <input type="checkbox" \${acc.can_receive?'checked':''} onchange="state.accounts.find(a=>a.email=='\${acc.email}').can_receive=this.checked?1:0;updateAccount(state.accounts.find(a=>a.email=='\${acc.email}'))">
                      <span class="slider"></span>
                    </label>
                  </td>
                  <td>\${formatTime(acc.created_at)}</td>
                  <td>
                    <button class="btn danger" onclick="deleteAccount('\${acc.email}')">\${t.delete}</button>
                  </td>
                </tr>
              \`).join('')
            )}
          </tbody>
        </table>
      \`;
      setTimeout(()=>{
        document.getElementById('addBtn').onclick = addAccount;
        document.querySelector('form').onsubmit = addAccount;
      },1);
    }
  }

  // 初始化挂载全局函数
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
