# OpenPosta-Page

**OpenPosta-Page** is the frontend demo for the [OpenPosta](https://github.com/openjsw/openposta-worker) lightweight webmail system, powered by Cloudflare Workers and Resend. This frontend enables email login, inbox/sent views, and message sending using native JS + CSS — all easily deployable via Cloudflare Pages.

👉 For Chinese users: [README-ZH.md](./README-ZH.md)

---

## ✨ Features Overview

* **Login via email/password** (multi-user support)
* **Inbox view**: list latest received emails
* **Sent view**: view sent emails
* **Compose & send**: send to local or external mailboxes via Resend
* **Logout support**
* **Lightweight UI**: pure HTML/CSS/JS, no frameworks
* **Navigation bar**: switch between inbox, sent, compose views

---

## 📦 Project Structure

```
index.html        # Main user interface for inbox/sent/compose
admin.html        # Admin dashboard UI (requires login)
README.md         # English documentation (this file)
```

---

## 🚀 Deployment Steps

1. Deploy the backend [OpenPosta Worker](https://github.com/openjsw/openposta-worker)
2. In your frontend code, set `API_BASE` to your deployed backend's URL

---

## 🛠️ Dependencies

* **Frontend**: Pure HTML + CSS + JS (no frameworks)
* **Backend**: Cloudflare Workers + D1 (for data)
* **Mail sending**: Resend API (for external delivery)

---

## 🔗 Related Projects

* [Backend: OpenPosta-Worker](https://github.com/openjsw/openposta-worker)

---

## 📮 FAQ

**Q: Why can't I send to external emails?**
A: You must configure `RESEND_API_KEY` in the backend and enable send permissions for the account.

**Q: How do I reset my email password?**
A: Currently, only administrators can reset it from the backend dashboard. Password recovery features may be added in future updates.

---
