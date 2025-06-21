// admin.js —— 可静态部署，fetch 路径自动拼 window.API_BASE
(() => {
  // 由服务端注入
  const LANGS = { [window.ADMIN_LANG]: window.I18N };
  let lang = window.ADMIN_LANG;
  function t(key) { return (LANGS[lang] && LANGS[lang][key]) || key; }
  function switchLang(to) {
    let url = new URL(window.location);
    url.searchParams.set('lang', to);
    window.location = url.toString();
  }

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
  function qs(sel) { return document.querySelector(sel); }
  function getAPIBase() {
    return (window.API_BASE || '').replace(/\/$/, '');
  }
  const API = {
    async post(path, data) {
      const resp = await fetch(getAPIBase() + path, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(data)
      });
      return resp.json();
    },
    async get(path) {
      const resp = await fetch(getAPIBase() + path, {credentials: 'include'});
      return resp.json();
    }
  };

  let state = {
    page: 'login', // login | list | add | edit
    admin: null,
    users: [],
    editing: null,
    msg: '',
    loading: false
  };
  function setState(obj) {
    Object.assign(state, obj);
    render();
  }

  async function render() {
    const $ = (h, p = {}) => ce(h, p);
    const root = qs('#admin-app');
    if (!root) return;
    root.innerHTML = '';

    // 语言切换
    const langNav = $('nav', {style: {margin: '0 0 12px 0'}});
    langNav.append(
      $('button', {text: t('switch_to_zh'), onClick: () => switchLang('zh'), style: {fontWeight: lang === 'zh' ? 'bold' : 'normal'}}),
      $('button', {text: t('switch_to_en'), onClick: () => switchLang('en'), style: {fontWeight: lang === 'en' ? 'bold' : 'normal', marginLeft: '0.5em'}})
    );
    root.append(langNav);

    // 登录页
    if (state.page === 'login') {
      const form = $('form', {
        onsubmit: async e => {
          e.preventDefault();
          setState({loading: true, msg: ''});
          const username = qs('#admin-username').value.trim();
          const password = qs('#admin-password').value;
          let d = await API.post('/manage/login', {username, password});
          if (d.success) { setState({msg: t('login_success')}); await checkAuth(); }
          else setState({msg: d.error || t('login_fail'), loading: false});
        }
      });
      form.append(
        $('h2', {text: t('login')}),
        $('label', {text: t('username'), attrs: {for: 'admin-username'}}),
        $('input', {id: 'admin-username', type: 'text', required: true, attrs: {autocomplete: 'username', tabindex: '0'}}),
        $('label', {text: t('password'), attrs: {for: 'admin-password'}}),
        $('input', {id: 'admin-password', type: 'password', required: true, attrs: {autocomplete: 'current-password', tabindex: '0'}}),
        $('button', {type: 'submit', text: t('login'), disabled: state.loading}),
        state.msg && $('div', {text: state.msg, style: {color: 'red'}, attrs: {role: 'alert'}})
      );
      root.append(form);
      return;
    }

    // 顶部操作栏
    const nav = $('nav', {style: {margin: '1em 0'}});
    nav.append(
      $('button', {text: t('list_users'), onClick: () => {setState({page: 'list', msg: ''}); loadUsers();}}),
      $('button', {text: t('add_user'), onClick: () => setState({page: 'add', msg: ''})}),
      $('button', {text: t('logout'), onClick: async () => {
        await API.post('/manage/logout', {});
        setState({admin: null, users: [], page: 'login', msg: t('logout_success')});
      }})
    );
    root.append(nav);

    // 用户列表
    if (state.page === 'list') {
      root.append($('h2', {text: t('list_users')}));
      if (state.loading) root.append($('div', {text: t('updating'), attrs: {role: 'status'}}));
      else {
        const table = $('table', {attrs: {role: 'table', tabindex: '0'}, style: {width: '100%', marginTop: '1em'}});
        const head = $('tr');
        head.append(
          $('th', {text: t('email')}),
          $('th', {text: t('can_send')}),
          $('th', {text: t('can_receive')}),
          $('th', {text: t('created_at')}),
          $('th', {text: t('actions')})
        );
        table.append(head);
        for (const u of state.users) {
          const tr = $('tr', {});
          tr.append(
            $('td', {text: u.email}),
            $('td', {text: u.can_send ? "✅" : "❌"}),
            $('td', {text: u.can_receive ? "✅" : "❌"}),
            $('td', {text: u.created_at.replace('T', ' ').slice(0, 19)}),
            $('td', {}).append(
              $('button', {text: t('edit'), onClick: () => setState({page: 'edit', editing: u, msg: ''})}),
              $('button', {text: t('delete'), onClick: () => delUser(u.email), style: {marginLeft: '0.5em'}})
            )
          );
          table.append(tr);
        }
        root.append(table);
      }
      return;
    }

    // 添加/编辑用户
    if (state.page === 'add' || (state.page === 'edit' && state.editing)) {
      const isEdit = state.page === 'edit';
      const user = state.editing || {};
      const form = $('form', {
        onsubmit: async e => {
          e.preventDefault();
          setState({loading: true, msg: ''});
          const email = qs('#user-email').value.trim();
          const password = qs('#user-password')?.value;
          const can_send = qs('#user-can-send').checked;
          const can_receive = qs('#user-can-receive').checked;
          if (isEdit) {
            let r = await API.post('/manage/update', {email, can_send, can_receive});
            if (r.success) { setState({msg: t('success'), page: 'list', editing: null}); loadUsers();}
            else setState({msg: r.error || t('fail'), loading: false});
          } else {
            let r = await API.post('/manage/add', {email, password, can_send, can_receive});
            if (r.success) { setState({msg: t('success'), page: 'list'}); loadUsers();}
            else setState({msg: r.error || t('fail'), loading: false});
          }
        }
      });
      form.append(
        $('h2', {text: isEdit ? t('edit_user') : t('add_user')}),
        $('label', {text: t('email'), attrs: {for: 'user-email'}}),
        $('input', {id: 'user-email', type: 'email', required: true, value: user.email || '', readonly: isEdit, attrs: {'aria-required': 'true', tabindex: '0'}}),
        !isEdit && [
          $('label', {text: t('password'), attrs: {for: 'user-password'}}),
          $('input', {id: 'user-password', type: 'password', required: true, attrs: {'aria-required': 'true', tabindex: '0'}})
        ],
        $('label', {text: t('can_send'), attrs: {for: 'user-can-send'}}),
        $('input', {id: 'user-can-send', type: 'checkbox', checked: user.can_send !== 0, attrs: {tabindex: '0'}}),
        $('label', {text: t('can_receive'), attrs: {for: 'user-can-receive'}}),
        $('input', {id: 'user-can-receive', type: 'checkbox', checked: user.can_receive !== 0, attrs: {tabindex: '0'}}),
        $('button', {type: 'submit', text: t('save'), disabled: state.loading}),
        $('button', {type: 'button', text: t('cancel'), onClick: () => setState({page: 'list', editing: null, msg: ''}), style: {marginLeft: '0.5em'}})
      );
      if (state.msg) form.append($('div', {text: state.msg, style: {color: 'red'}, attrs: {role: 'alert'}}));
      root.append(form);
      return;
    }

    if (state.msg) root.append($('div', {text: state.msg, style: {color: 'red', marginTop: '1em'}, attrs: {role: 'alert'}}));
  }

  // 业务逻辑
  async function checkAuth() {
    let d = await API.get('/manage/check');
    if (d.loggedIn) { setState({admin: true, page: 'list'}); loadUsers(); }
    else setState({admin: null, page: 'login', users: [], msg: t('not_logged_in')});
  }
  async function loadUsers() {
    setState({loading: true});
    let d = await API.get('/manage/list');
    setState({users: d.accounts || [], loading: false});
  }
  async function delUser(email) {
    if (!confirm(t('sure_delete'))) return;
    setState({loading: true});
    let r = await API.post('/manage/delete', {email});
    if (r.success) { setState({msg: t('success')}); loadUsers(); }
    else setState({msg: r.error || t('fail'), loading: false});
  }

  window.addEventListener('DOMContentLoaded', () => {
    render();
    checkAuth();
  });
})();
