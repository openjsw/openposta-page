// ========== 简单 i18n 多语言实现 ==========
const LANGS = {
  zh: {
    title: "简易邮箱",
    login: "登录",
    logout: "退出登录",
    email: "邮箱",
    password: "密码",
    register: "注册",
    inbox: "收件箱",
    sent: "已发送",
    compose: "写信",
    to: "收件人",
    subject: "主题",
    body: "正文",
    send: "发送",
    attachments: "附件",
    upload: "上传",
    details: "详情",
    back: "返回",
    download: "下载",
    reply: "回复",
    language: "语言",
    switch_to_en: "English",
    switch_to_zh: "简体中文",
    html_body: "HTML 正文",
    attach_hint: "可选，支持多文件",
    no_mail: "暂无邮件",
    choose_file: "选择文件",
    sending: "发送中...",
    sent_success: "发送成功",
    sent_fail: "发送失败",
    login_success: "登录成功",
    login_fail: "登录失败",
    register_success: "注册成功",
    register_fail: "注册失败",
    loading: "加载中...",
    confirm_logout: "确定要退出登录吗？"
  },
  en: {
    title: "Simple Mailbox",
    login: "Login",
    logout: "Logout",
    email: "Email",
    password: "Password",
    register: "Register",
    inbox: "Inbox",
    sent: "Sent",
    compose: "Compose",
    to: "To",
    subject: "Subject",
    body: "Body",
    send: "Send",
    attachments: "Attachments",
    upload: "Upload",
    details: "Details",
    back: "Back",
    download: "Download",
    reply: "Reply",
    language: "Language",
    switch_to_en: "English",
    switch_to_zh: "简体中文",
    html_body: "HTML Body",
    attach_hint: "Optional, multi-file supported",
    no_mail: "No mail yet",
    choose_file: "Choose File",
    sending: "Sending...",
    sent_success: "Mail sent",
    sent_fail: "Send failed",
    login_success: "Login success",
    login_fail: "Login failed",
    register_success: "Register success",
    register_fail: "Register failed",
    loading: "Loading...",
    confirm_logout: "Are you sure you want to logout?"
  }
};
let lang = localStorage.getItem('lang') || navigator.language.slice(0,2) || 'en';
if (!(lang in LANGS)) lang = 'en';

function t(key) { return LANGS[lang][key] || key; }
function switchLang(to) { lang = to; localStorage.setItem('lang', lang); render(); }

// ========== DOM helpers ==========
function qs(sel) { return document.querySelector(sel); }
function ce(tag, opts = {}) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(opts)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style') Object.assign(el.style, v);
    else if (k === 'attrs') for (const [kk, vv] of Object.entries(v)) el.setAttribute(kk, vv);
    else el[k] = v;
  }
  return el;
}

// ========== API helpers ==========
const API = {
  async post(path, data) {
    const resp = await fetch(path, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return resp.json();
  },
  async get(path) {
    const resp = await fetch(path, {credentials: 'include'});
    return resp.json();
  },
  async upload(path, files) {
    const fd = new FormData();
    files.forEach(f => fd.append('file', f));
    const resp = await fetch(path, {method:'POST', body:fd, credentials:'include'});
    return resp.json();
  }
};

// ========== 状态 ==========
let state = {
  page: 'login', // login | register | inbox | sent | compose | detail
  user: null,
  inbox: [],
  sent: [],
  currentMail: null,
  attachFiles: [],
  attachments: [],
  loading: false,
  msg: ''
};

function setState(obj) {
  Object.assign(state, obj);
  render();
}

// ========== 无障碍：键盘支持 ==========
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.page === 'detail') setState({page: 'inbox', currentMail: null});
});

// ========== 渲染 ==========
async function render() {
  const $ = (h, p = {}) => ce(h, p);
  const root = qs('#app');
  root.innerHTML = '';
  // Header：多语言 + 导航
  const header = $('header', {attrs: {role: 'banner', 'aria-label': t('title')}, style: {display: 'flex', gap:'1em', alignItems:'center'}});
  header.append(
    $('h1', {text: t('title'), attrs: {tabindex:'0'}}),
    $('nav', {attrs:{'aria-label': t('language')}, style:{marginLeft:'auto'}})
  );
  header.lastChild.append(
    $('button', {text:t('switch_to_zh'), attrs:{tabindex:'0', 'aria-label':'切换简体中文'}, onClick:()=>switchLang('zh'), style:{fontWeight: lang==='zh'?'bold':'normal'}}),
    $('button', {text:t('switch_to_en'), attrs:{tabindex:'0', 'aria-label':'Switch to English'}, onClick:()=>switchLang('en'), style:{fontWeight: lang==='en'?'bold':'normal', marginLeft:'0.5em'}})
  );
  root.append(header);

  // 登录/注册页面
  if (state.page==='login' || state.page==='register') {
    const isReg = state.page==='register';
    const form = $('form', {
      attrs: {role: 'form', 'aria-labelledby': isReg?'reg-title':'login-title'},
      onsubmit: async e => {
        e.preventDefault();
        setState({loading:true,msg:''});
        const email = qs('#email').value.trim();
        const password = qs('#password').value;
        try {
          if (isReg) {
            let d = await API.post('/user/register', {email, password});
            if (d.success) setState({page:'login', msg: t('register_success')});
            else setState({msg: d.error || t('register_fail'), loading:false});
          } else {
            let d = await API.post('/user/login', {email, password});
            if (d.success) { setState({msg: t('login_success')}); await checkAuth();}
            else setState({msg: d.error || t('login_fail'), loading:false});
          }
        } catch (e) {
          setState({msg: t('login_fail'), loading:false});
        }
      }
    });
    form.append(
      $('h2', {text:isReg?t('register'):t('login'), id:isReg?'reg-title':'login-title'}),
      $('label', {text:t('email'), attrs:{for:'email'}}),
      $('input', {id:'email', type:'email', required:true, attrs:{autocomplete:'username', 'aria-required':'true', tabindex:'0'}}),
      $('label', {text:t('password'), attrs:{for:'password'}}),
      $('input', {id:'password', type:'password', required:true, attrs:{autocomplete:'current-password', 'aria-required':'true', tabindex:'0'}}),
      $('button', {type:'submit', text:isReg?t('register'):t('login'), attrs:{tabindex:'0', 'aria-label':isReg?t('register'):t('login')}, disabled:state.loading}),
      $('button', {type:'button', text:isReg?t('login'):t('register'), attrs:{tabindex:'0'}, onClick:()=>setState({page:isReg?'login':'register', msg:''})})
    );
    if(state.msg) form.append($('div',{text:state.msg, style:{color:'red'}, attrs:{role:'alert', tabindex:'0'}}));
    root.append(form);
    return;
  }

  // 导航
  const nav = $('nav', {attrs:{role:'navigation', 'aria-label':'Main'}, style:{margin:'1em 0'}});
  nav.append(
    $('button', {text:t('inbox'), attrs:{tabindex:'0','aria-label':t('inbox')}, onClick:()=>loadInbox()}),
    $('button', {text:t('sent'), attrs:{tabindex:'0','aria-label':t('sent')}, onClick:()=>loadSent()}),
    $('button', {text:t('compose'), attrs:{tabindex:'0','aria-label':t('compose')}, onClick:()=>setState({page:'compose',attachFiles:[],attachments:[],msg:''})}),
    $('button', {text:t('logout'), attrs:{tabindex:'0','aria-label':t('logout')}, onClick:async()=>{
      if(confirm(t('confirm_logout'))) {
        await API.post('/user/logout', {});
        setState({page:'login',user:null,msg:''});
      }
    }})
  );
  root.append(nav);

  // 内容
  const main = $('main', {attrs:{role:'main'}});
  root.append(main);

  // 收件箱/已发送
  if(state.page==='inbox' || state.page==='sent') {
    const isInbox = state.page==='inbox';
    const list = isInbox ? state.inbox : state.sent;
    main.append($('h2', {text:isInbox?t('inbox'):t('sent')}));
    if(state.loading) main.append($('div', {text:t('loading'), attrs:{role:'status'}}));
    else if(!list.length) main.append($('div', {text:t('no_mail'), attrs:{role:'status'}}));
    else {
      const table = $('table', {attrs:{tabindex:'0', role:'table', 'aria-label':'Mail List'}, style:{width:'100%',marginTop:'1em'}});
      const thead = $('tr');
      thead.append(
        $('th', {text: isInbox?t('from'):t('to')}),
        $('th', {text:t('subject')}),
        $('th', {text:'时间'})
      );
      table.append(thead);
      for(const mail of list) {
        const tr = $('tr', {attrs:{tabindex:'0','aria-label':mail.subject||''}, onClick:()=>loadMail(mail.id, isInbox?'inbox':'sent')});
        tr.append(
          $('td', {text: isInbox?mail.mail_from:mail.mail_to}),
          $('td', {text: mail.subject}),
          $('td', {text: mail.created_at.replace('T',' ').slice(0,19)})
        );
        table.append(tr);
      }
      main.append(table);
    }
    return;
  }

  // 写信
  if(state.page==='compose') {
    const form = $('form', {
      attrs: {role:'form', 'aria-labelledby':'compose-title'},
      onsubmit: async e => {
        e.preventDefault();
        setState({loading:true,msg:''});
        let to=qs('#to').value.trim(), subject=qs('#subject').value, body=qs('#body').value, html=qs('#body_html').value;
        let resp = await API.upload('/user/upload-attachment', state.attachFiles);
        let attachments = resp.attachments||[];
        let r = await API.post('/user/send', {to, subject, body, body_html:html, attachments});
        if(r.success) { setState({msg:t('sent_success'), page:'inbox',attachFiles:[],attachments:[]}); await loadInbox();}
        else setState({msg:r.error||t('sent_fail'), loading:false});
      }
    });
    form.append(
      $('h2', {id:'compose-title', text:t('compose')}),
      $('label', {text:t('to'), attrs:{for:'to'}}),
      $('input', {id:'to', type:'email', required:true, attrs:{'aria-required':'true',tabindex:'0'}}),
      $('label', {text:t('subject'), attrs:{for:'subject'}}),
      $('input', {id:'subject', type:'text', attrs:{tabindex:'0'}}),
      $('label', {text:t('body'), attrs:{for:'body'}}),
      $('textarea', {id:'body', rows:6, attrs:{tabindex:'0'}}),
      $('label', {text:t('html_body'), attrs:{for:'body_html'}}),
      $('textarea', {id:'body_html', rows:4, attrs:{tabindex:'0'}}),
      $('label', {text:t('attachments'), attrs:{for:'file'}}),
      $('input', {
        id:'file', type:'file', multiple:true, attrs:{tabindex:'0','aria-describedby':'attach-hint'},
        onchange: e=>{
          setState({attachFiles:Array.from(e.target.files)});
        }
      }),
      $('div',{id:'attach-hint',text:t('attach_hint'), style:{fontSize:'smaller'}}),
      $('button', {type:'submit', text:t('send'), attrs:{tabindex:'0'}, disabled:state.loading})
    );
    if(state.attachFiles.length) {
      const ul = $('ul',{});
      state.attachFiles.forEach(f=>ul.append($('li',{text:`${f.name} (${Math.round(f.size/1024)}KB)`})));
      form.append(ul);
    }
    if(state.msg) form.append($('div',{text:state.msg, style:{color:'red'}, attrs:{role:'alert',tabindex:'0'}}));
    main.append(form);
    return;
  }

  // 邮件详情
  if(state.page==='detail' && state.currentMail) {
    const m = state.currentMail;
    main.append(
      $('h2',{text:t('details')}),
      $('button',{text:t('back'),onClick:()=>setState({page:'inbox',currentMail:null}),attrs:{tabindex:'0'}})
    );
    const tbl = $('table',{style:{margin:'1em 0'}});
    tbl.append(
      $('tr',{}).append($('td',{text:t('from')}),$('td',{text:m.mail_from})),
      $('tr',{}).append($('td',{text:t('to')}),$('td',{text:m.mail_to})),
      $('tr',{}).append($('td',{text:t('subject')}),$('td',{text:m.subject})),
      $('tr',{}).append($('td',{text:'时间'}),$('td',{text:m.created_at.replace('T',' ').slice(0,19)}))
    );
    main.append(tbl);
    main.append(
      $('div',{html:`<strong>${t('body')}:</strong><pre style="white-space:pre-wrap">${m.body||''}</pre>`}),
      $('div',{html:`<strong>${t('html_body')}:</strong><div style="background:#f6f6f6;padding:1em;" tabindex="0" aria-label="${t('html_body')}" role="region">${m.body_html||''}</div>`})
    );
    // 附件
    if(m.attachments && m.attachments.length) {
      main.append($('div',{html:`<strong>${t('attachments')}:</strong>`}));
      const ul = $('ul',{});
      m.attachments.forEach(a=>{
        ul.append($('li',{}).append(
          $('a',{
            text:a.filename,
            attrs:{href:`/api/attachment?id=${m.id}&filename=${encodeURIComponent(a.filename)}`,target:'_blank', download:a.filename, tabindex:'0', 'aria-label':t('download')},
          })
        ));
      });
      main.append(ul);
    }
    main.append(
      $('button',{text:t('reply'),onClick:()=>setState({
        page:'compose',
        msg:'',
        attachFiles:[],
        attachments:[],
        // 自动带出收件人和主题
        composeTo:m.mail_from,
        composeSubject:(m.subject?.startsWith('Re:')?m.subject:`Re: ${m.subject}`)
      }),attrs:{tabindex:'0'}})
    );
    return;
  }
}

// ========== 业务加载函数 ==========
async function checkAuth() {
  let d = await API.get('/user/check');
  if(d.loggedIn) { setState({user:true,page:'inbox'}); await loadInbox();}
  else setState({user:null,page:'login'});
}
async function loadInbox() {
  setState({loading:true, page:'inbox',msg:''});
  let d = await API.get('/user/inbox');
  setState({inbox:d.mails||[],loading:false});
}
async function loadSent() {
  setState({loading:true, page:'sent',msg:''});
  let d = await API.get('/user/sent');
  setState({sent:d.mails||[],loading:false});
}
async function loadMail(id, type) {
  setState({loading:true, page:'detail',currentMail:null});
  let d = await API.get(type==='inbox'?(`/user/mail?id=${id}`):(`/user/sentmail?id=${id}`));
  let m = d.mail || null;
  // 附件字段可能为undefined
  if(m && m.attachments && typeof m.attachments==='string') m.attachments = JSON.parse(m.attachments);
  setState({currentMail:m, loading:false});
}

// ========== 页面加载 ==========
window.addEventListener('DOMContentLoaded', ()=>{
  render();
  checkAuth();
});
