# Google Apps Script Telegram Bot Webhook Template

A minimal, ready-to-deploy **`Code.gs`** template for running a Telegram bot entirely on **Google Apps Script** — no server, no hosting bill, no external database. Updates come in over a webhook, and everything (messages, errors, debug info) gets logged straight into a Google Sheet.

This is a **template repository**. Use it as the base for feature-specific bots to spin up a new project from it, then build your own logic on top.
[Use this template](https://github.com/new?template_name=Google-App-Script-Telegram-Bot-Webhook&template_owner=megatzackry)

## Table of Contents
- [What is this?](#what-is-this)
- [What the code does](#what-the-code-does)
- [Getting Started](#getting-started)
- [Using This as a Template](#using-this-as-a-template)
- [Repository Structure](#repository-structure)

---

## What is this?

This repo contains a single Google Apps Script file (`Code.gs`) that turns a Google Sheet into the backend for a Telegram bot. Google Apps Script lets you deploy the script as a **Web App**, giving you a public URL that Telegram can call every time your bot receives a message — that's your webhook, and it's completely free to run.

The Sheet itself doubles as your database and your logs, so there's nothing else to provision. Copy the code, plug in your bot token, deploy, and you have a working webhook in a few minutes.

## What the code does

`Code.gs` is built around a few small classes that handle the plumbing, so you can focus on bot logic:

- **`doPost(e)`** — the webhook entrypoint. Every Telegram update hits this function first. It parses the request, figures out what kind of update it is, and routes it to the right handler, catching and logging anything that goes wrong along the way.
- **`Update`** — a thin wrapper around the raw webhook payload. It works out whether the update is a `message`, `edited_message`, etc., and exposes it directly (e.g. `update.message`).
- **`handleMessage(msg)`** — where message handling lives. It already branches on `chat.type` (`supergroup` vs `private`) and detects the content type of the message (`text`, `photo`, `video`, `sticker`, `document`, `audio`, `voice`, `video_note`, `location`, `contact`, `poll`). Out of the box it doesn't act on these yet — it logs them (see below), so you can see exactly what Telegram sends before writing your own logic.
- **`Bot`** — a wrapper around the Telegram Bot API (`sendMessage`, `setWebhook`, `deleteWebhook`, etc.) that includes:
  - Automatic retries for failed or dropped requests.
  - Handling for Telegram's `429` rate-limit responses, respecting the `retry_after` value Telegram sends back.
  - A guard that stops retrying before Apps Script's ~6-minute execution limit is hit, instead of letting the script get killed mid-request.
- **`Sheet`** — treats the bound Google Sheet as a lightweight database: caches sheet references so you're not re-fetching them constantly, auto-creates a sheet if it doesn't exist yet, and includes a helper to find a row by searching for a value.
- **`Cache`** — a thin wrapper over Apps Script's `CacheService`, for short-lived key/value storage (handles JSON in, JSON out).
- **`Errors`** — a custom `Error` subclass used everywhere in the code. Every error — and, by default, every message your handlers don't explicitly deal with — gets written as a new row into a `logs` sheet: timestamp, a severity flag, the message, extra details, and the raw payload.

Because `handleMessage` currently throws an `Errors` for any message it doesn't explicitly handle, **the default behavior of this template is to log every incoming message to the `logs` sheet.** That's intentional — it's the fastest way to see the exact shape of Telegram's payloads before you start writing real handling logic for text, photos, callbacks, and so on.

---

## Getting Started

### Prerequisites
- A Telegram account
- A Google account

### 1. Create a Telegram Bot
1. Start a chat with [@BotFather](https://t.me/BotFather).
2. Send the command `/newbot`.
3. Choose a name and a username for your bot.
4. Grab your bot token — BotFather will give you something in the form `123456789:AAExample-Token`.

### 2. Set Up Your Google Sheet
1. Create a blank [Google Sheet](https://docs.google.com/spreadsheets/u/0/create).
2. Open the **Extensions** menu from the top navbar and click **Apps Script**.
3. Go to **Project Settings** (the gear icon in the left sidebar).
4. Click **Add script property**.
5. As the **Property**, enter the first few digits of your bot token — the part **before** the `:`.
6. As the **Value**, paste the rest of the token — the part **after** the `:`.
7. Save the script properties, then head back to the **Editor**.

### 3. Add & Configure the Code
1. Copy `Code.gs` from this repository and paste it in, replacing the existing default code.
2. In `function reset()`, replace the commented `/*'YOUR_BOT_CHAT_ID'*/` with the same digits you used as the Property above (the part of your token before the `:`).
3. Save the script.

### 4. Deploy as a Web App
1. Open the **Deploy** menu at the top right and click **New deployment**.
2. Click the gear icon next to **Select type** and choose **Web app**.
3. Leave **Execute as** set to **Me**, and set **Who has access** to **Anyone**.
4. Click **Deploy**, then **Authorize access**.
5. If you see a "Google hasn't verified this app" warning, click **Advanced**, then **Go to project (unsafe)**.
6. Select all requested access and continue.
7. Copy the **Deployment ID** and click **Done**.
8. Paste the Deployment ID in place of the commented `/*'YOUR_DEPLOYMENT_ID'*/` in `reset()`.

### 5. Register the Webhook
1. Save the script again.
2. On the top navbar of the Apps Script editor, make sure the function selector is set to **`reset`**.
3. Click **Run**, and approve any additional permission prompts.

### 6. Test It
1. Once execution completes, open your bot in Telegram and send it any message.
2. Check your Google Sheet — a new **`logs`** tab will appear with the full update your bot just received.

---

## Using This as a Template

This repo is meant to be a starting point, not a finished bot. Click **Use this template** on GitHub to create a new repository from it, then:
- Fill in the `supergroup` / `private` branches inside `handleMessage()` with your actual logic.
- Extend `Sheet` or add new sheet tabs as your feature needs somewhere to store data.

## Repository Structure

```
Code.gs   → the entire bot: webhook entrypoint, Bot/Sheet/Cache/Errors helpers, update routing
```

---

Found a bug or have an improvement for the template? Issues and PRs are welcome.
