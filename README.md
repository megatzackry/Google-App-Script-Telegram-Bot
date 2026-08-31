# Google Apps Script Telegram Bot Webhook Template

A minimal, ready-to-deploy **`Code.gs`** template for running a Telegram bot entirely on **Google Apps Script** — no server, no hosting bill, no external database. Updates come in over a webhook, and everything (messages, errors, debug info) gets logged straight into a Google Sheet.

This is a **template repository**. [Use this template](https://github.com/new?template_name=Google-App-Script-Telegram-Bot&template_owner=megatzackry) as the base for feature-specific bots to spin up a new project from it, then build your own logic on top.

> ## 🚀 Live Demo
>
> A working deployment of this exact template is live and open for anyone to try:
>
> - **Try the bot** → [@GoogleAppScriptTemplateBot](https://t.me/GoogleAppScriptTemplateBot) — send it any message and it'll echo the raw update straight back to you.
> - **Watch it work in real time** → [Open the connected Google Sheet](https://docs.google.com/spreadsheets/d/1vwyo6oE-o_DWO4lPb295v9nonNYVhTuGAgL2jVI1tN8/edit?usp=sharing) — every update the bot receives, and every reply it sends, is logged there live as you interact with it in Telegram. The bot's own reply also links straight back to this Sheet, plus the [source on GitHub](https://github.com/megatzackry/Google-App-Script-Telegram-Bot).

## Table of Contents
- [What is this?](#what-is-this)
- [Live Demo](#-live-demo)
- [What the code does](#what-the-code-does)
- [Getting Started](#getting-started)
- [Using This as a Template](#using-this-as-a-template)

---

## What is this?

This repo contains a single Google Apps Script file (`Code.gs`) that turns a Google Sheet into the backend for a Telegram bot. Google Apps Script lets you deploy the script as a **Web App**, giving you a public URL that Telegram can call every time your bot receives a message — that's your webhook, and it's completely free to run.

The Sheet itself doubles as your event log, so there's nothing else to provision. Copy the code, plug in your bot token, deploy, and you have a working webhook in a few minutes.

## What the code does

`Code.gs` is built around a few small pieces that handle the plumbing, so you can focus on bot logic:

- **`setup()`** — run once to configure your bot. Paste in your full bot token (e.g. `123456789:AAExample-Token`) and your deployed Web app URL, and it splits the token into a bot id/key pair, stores both in Script Properties, and registers the Telegram webhook for you (listening for `message` and `edited_message` updates). Run this again any time you rotate your bot token or redeploy to a new URL.
- **`doPost(e)`** — the webhook entrypoint. Every Telegram update hits this function first:
  - It immediately logs a row to the `events` sheet noting which kind of update just came in.
  - On an incoming `message`, it replies with the full update as a formatted code block, along with inline keyboard link buttons pointing to the project's Google Sheet and GitHub repo.
  - Any error thrown along the way is caught and logged via `Errors.handle()`.
- **`Telegram`** — a wrapper around the Telegram Bot API (`send`, `setWebhook`, etc.) that includes:
  - Automatic retries for failed or dropped requests.
  - Handling for Telegram's `429` rate-limit responses, respecting the `retry_after` value Telegram sends back.
  - A guard that stops retrying before Apps Script's ~6-minute execution limit is hit, instead of letting the script get killed mid-request.
  - A constructor that resolves your bot's id on its own by reading a `BOT_ID` Script Property set by `setup()`, so `new Telegram()` works anywhere in your code with no id to remember or hardcode.
  - On every successful API call, it logs a confirmation row (with the outgoing payload and Telegram's response) to the `events` sheet.
- **`Sheet`** — treats the bound Google Sheet as a lightweight database: caches sheet references so you're not re-fetching them constantly, and auto-creates a sheet by name if it doesn't exist yet (`getss(name)`). The first time it creates the `events` or `errors` sheet, it also writes a header row (`Date Time`, `Details`, `Updates`, `Payload`, `Response` for events; `Date Time`, `Message`, `Details`, `Payload` for errors) so the log is readable from row one.
- **`Errors`** — a custom `Error` subclass used everywhere in the code. Any error — a Telegram API failure, a rate limit exhausted after retries, a misconfigured bot, etc. — gets written as a new row into a dedicated `errors` sheet: timestamp, message, extra details, and the raw payload.

Because every update logs an `events` row on the way in and every outgoing API call logs another on the way out, **the default behavior of this template is a running, readable audit trail of everything your bot does.** That's intentional — it's the fastest way to confirm your webhook is wired up correctly and to inspect real payloads before you replace the demo counter logic with your own.

---

## Getting Started

### Prerequisites
- A Telegram account
- A Google account

### 1. Create a Telegram Bot
1. Start a chat with [@BotFather](https://t.me/BotFather).
2. Send the command `/newbot`.
3. Choose a name and a username for your bot.
4. Grab your bot token — BotFather will give you something in the form `123456789:AAExample-Token`. Keep the whole string; you'll paste it directly into the script later, no need to split it yourself.

### 2. Set Up Your Google Sheet
1. Create a blank [Google Sheet](https://docs.google.com/spreadsheets/u/0/create).
2. Open the **Extensions** menu from the top navbar and click **Apps Script**.

### 3. Add the Code
1. Copy `Code.gs` from this repository and paste it in, replacing the existing default code.
2. Save the script.

### 4. Deploy as a Web App
1. Open the **Deploy** menu at the top right and click **New deployment**.
2. Click the gear icon next to **Select type** and choose **Web app**.
3. Leave **Execute as** set to **Me**, and set **Who has access** to **Anyone**.
4. Click **Deploy**, then **Authorize access**.
5. If you see a "Google hasn't verified this app" warning, click **Advanced**, then **Go to project (unsafe)**.
6. Select all requested access and continue.
7. Copy the **Web app URL** shown after deployment (looks like `https://script.google.com/macros/s/.../exec`) and click **Done**.

### 5. Configure and Run Setup
1. Back in the editor, open `function setup()`.
2. Replace `'YOUR_BOT_TOKEN'` with the full token you got from BotFather.
3. Replace `'YOUR_WEBAPP_URL'` with the Web app URL you copied in the previous step.
4. Save the script.
5. On the top navbar of the Apps Script editor, make sure the function selector is set to **`setup`**.
6. Click **Run**, and approve any additional permission prompts.

`setup()` splits your token into an id and a key, stores them in Script Properties, and registers the webhook with Telegram — all in one run. You don't need to touch Script Properties or your bot's numeric id manually at any point.

### 6. Test It
1. Once execution completes, open your bot in Telegram and send a message.
2. If the bot was set up correctly, it will reply with the entire update it received, plus a couple of link buttons underneath pointing back to the project's Sheet and GitHub repo.
3. Check your Google Sheet — an **`events`** tab (with a header row already in place) will appear, logging both the incoming update and the bot's outgoing reply. If anything goes wrong, look for a matching **`errors`** tab instead.

---

## External References

[Google App Script](https://developers.google.com/apps-script/reference)
[Telegram Bot API](https://core.telegram.org/bots/api#getting-updates)

## Using This as a Template

This repo is meant to be a starting point, not a finished bot. Click **Use this template** on GitHub to create a new repository from it, then:
- Replace the demo logic inside `doPost()` — the echoed update and link buttons — with your actual message and callback handling.
- Extend the `Sheet` class or add new sheet tabs as your feature needs somewhere to store data.

---

Found a bug or have an improvement for the template? Issues and PRs are welcome.
