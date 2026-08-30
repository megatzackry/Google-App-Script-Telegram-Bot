# Google Apps Script Telegram Bot Webhook Template

A minimal, ready-to-deploy **`Code.gs`** template for running a Telegram bot entirely on **Google Apps Script** — no server, no hosting bill, no external database. Updates come in over a webhook, and everything (messages, errors, debug info) gets logged straight into a Google Sheet.

This is a **template repository**. [Use this template](https://github.com/new?template_name=Google-App-Script-Telegram-Bot&template_owner=megatzackry) as the base for feature-specific bots to spin up a new project from it, then build your own logic on top.

## Table of Contents
- [What is this?](#what-is-this)
- [What the code does](#what-the-code-does)
- [Getting Started](#getting-started)
- [Using This as a Template](#using-this-as-a-template)

---

## What is this?

This repo contains a single Google Apps Script file (`Code.gs`) that turns a Google Sheet into the backend for a Telegram bot. Google Apps Script lets you deploy the script as a **Web App**, giving you a public URL that Telegram can call every time your bot receives a message — that's your webhook, and it's completely free to run.

The Sheet itself doubles as your event log, so there's nothing else to provision. Copy the code, plug in your bot token, deploy, and you have a working webhook in a few minutes.

## What the code does

`Code.gs` is built around a few small pieces that handle the plumbing, so you can focus on bot logic:

- **`setup()`** — run once to configure your bot. Paste in your full bot token (e.g. `123456789:AAExample-Token`) and your deployed Web app URL, and it splits the token into a bot id/key pair, stores both in Script Properties, and registers the Telegram webhook for you (listening for `message` and `edited_message` updates). 
- **`doPost(e)`** — the webhook entrypoint. Every Telegram update hits this function first:
  - On an incoming `message`, it replies with the full update as a formatted code block, along with a button labeled `0`.
  - On a `callback_query` (i.e. someone tapping the button), it increments the counter, edits the button's label to the new count, and pops an alert telling the user how many times they've clicked it.
  - After handling the update, it throws an `Errors` so a row describing the update also gets written to the Sheet — this is a quick way to see the exact shape of Telegram's payloads while you build out real logic.
  - Any error thrown along the way is caught and logged via `Errors.handle()`.
- **`Telegram`** — a wrapper around the Telegram Bot API (`send`, `setWebhook`, etc.) that includes:
  - Automatic retries for failed or dropped requests.
  - Handling for Telegram's `429` rate-limit responses, respecting the `retry_after` value Telegram sends back.
  - A guard that stops retrying before Apps Script's ~6-minute execution limit is hit, instead of letting the script get killed mid-request.
  - A constructor that resolves your bot's id on its own by reading a `BOT_ID` Script Property set by `setup()`, so `new Telegram()` works anywhere in your code with no id to remember or hardcode.
- **`Sheet`** — treats the bound Google Sheet as a lightweight database: caches sheet references so you're not re-fetching them constantly, and auto-creates a sheet by name if it doesn't exist yet (`getss(name)`).
- **`Errors`** — a custom `Error` subclass used everywhere in the code. Every error — and, by default, every update `doPost` doesn't explicitly finish handling — gets written as a new row into an `events` sheet: timestamp, a severity flag, the message, extra details, and the raw payload.

Because `doPost` currently throws an `Errors` after every update it processes, **the default behavior of this template is to log every incoming update to the `events` sheet.** That's intentional — it's the fastest way to confirm your webhook is wired up correctly and to inspect real payloads before you replace the demo counter logic with your own.

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
4. Click **Deploy**.

### 5. Authorize access
The web app requires you to authorise access to your data.
1. Click **Authorise access** or **Review permissions**.
2. Google hasn’t verified this app, so go to **Advanced** option on your bottom left, then **Go to [Your Script Name] project (unsafe)**.
3. Select all requested access and **Continue**.
4. Copy the **Web app URL** shown after deployment (looks like `https://script.google.com/macros/s/.../exec`)
5. click **Done**.

### 6. Configure and Run Setup
1. Back in the editor, in the first function `setup()`.
2. Replace `'YOUR_BOT_TOKEN'` with the full token you got from BotFather.
3. Replace `'YOUR_WEBAPP_URL'` with the Web app URL you copied in the previous step.
4. Save the script.
5. On the top navbar of the Apps Script editor, make sure the function selector is set to **`setup`**.
6. Click **Run**, and approve any additional permission prompts.

`setup()` function splits your token into an id and a key, stores them in Script Properties, and registers the webhook with Telegram — all in one run.
Replace YOUR_BOT_TOKEN and **Run** this again any time you rotate your bot token or redeploy to a new URL.

### 6. Test It
1. Once execution completes, open your bot in Telegram and send a message.
2. If the bot was set up correctly, it will reply with the entire update it received, plus a `0` button underneath — tap it a few times and watch the count (and the alert) go up.
3. Check your Google Sheet — a new **`events`** tab will also appear with a row logged for each update your bot receives.

---

## External References

[Google App Script](https://developers.google.com/apps-script/reference)
[Telegram Bot API](https://core.telegram.org/bots/api#getting-updates)

## Using This as a Template

This repo is meant to be a starting point, not a finished bot. Click **Use this template** on GitHub to create a new repository from it, then:
- Replace the demo logic inside `doPost()` — the echoed update and click-counter button — with your actual message and callback handling.
- Extend the `Sheet` class or add new sheet tabs as your feature needs somewhere to store data.

---

Found a bug or have an improvement for the template? Issues and PRs are welcome.