# jianMail 简邮前端 DEMO

这是一个基于 Cloudflare Workers 后端 + Resend 邮件代发服务的**简单邮箱系统**前端 DEMO。你可以用它体验自建邮局的基础收发邮件、会话管理、发件箱/收件箱展示等功能。

## ✨ 功能概览

- **邮箱登录**：邮箱账号/密码登录（支持多用户）
- **收件箱**：显示最近邮件列表，查看邮件详情
- **发件箱**：展示已发送邮件
- **写信发件**：支持发信至本地及外部邮箱（依赖后端 Resend 代发）
- **登出**：安全退出账号
- **美观简洁 UI**：原生 JS+CSS，无依赖
- **菜单导航**：切换收件箱、发件箱、写信界面


## 📦 项目结构


index.html        # 用户端前端首页（收发邮件/写信/发件箱）
admin.html        # 管理后台前端（需管理员登录）
README.md         # 本说明



## 🚀 部署步骤
1. 部署好[emails worker后端](https://github.com/toewpq/jianMail-back)
2. 将API_BASE改成你的部署的后端emails worker地址

---

## 🛠️ 主要依赖

- 前端：**原生 HTML + CSS + JS**
- 后端接口：Cloudflare Workers + D1 数据库
- 发件服务：Resend（REST API 调用，支持发往外部邮箱）

---

## 🌟 在线演示

- 前端demo： [https://emails.jsw.quest](https://emails.jsw.quest)
收件箱：
https://picbed.jsw.quest/file/AgACAgUAAyEGAASZ0FDZAANNaDZ1nY-G7PAxzaYqncgUw2vTe_MAAqLMMRuqcrFVL-HBG-0xSMoBAAMCAAN3AAM2BA.png
发件箱：
https://picbed.jsw.quest/file/AgACAgUAAyEGAASZ0FDZAANOaDZ2HEftAAGF_e3YOlMpdaDLlYCeAAKkzDEbqnKxVc2GLRs3GVxcAQADAgADdwADNgQ.png
写信:
https://picbed.jsw.quest/file/AgACAgUAAyEGAASZ0FDZAANPaDZ2kd7IpPvYO1v9AoPCqzLY6GEAAqnMMRuqcrFV0_qtB4auSzYBAAMCAAN3AAM2BA.png

---

## 🔗 相关项目

- [后端 Worker/Cloudflare 版本 README.md（待补充）](./backend/README.md)

---

## 📮 常见问题

- **Q: 为什么不能发件到外部邮箱？**  
  A: 需后台配置好 `RESEND_API_KEY` 环境变量并开通对应邮箱账号的发信权限。
- **Q: 邮箱密码忘记如何重置？**  
  A: 目前仅支持管理员后台重置，后续可扩展自助找回。

---

