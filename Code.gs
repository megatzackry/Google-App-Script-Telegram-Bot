function setup() {
  const bot_token = 'YOUR_BOT_TOKEN'; // Paste your full bot token from @BotFather, e.g. 123456789:AAExample-Token
  const webapp_url = 'YOUR_WEBAPP_URL'; // Paste your deployed Web app URL (shown after you deploy)

  const [bot_id, api_key] = bot_token.split(':');
  if (!bot_id || !api_key) return console.error('Replace YOUR_BOT_TOKEN with your actual bot API token (from @BotFather).');
  if (webapp_url.includes('YOUR_WEBAPP_URL')) return console.error('Replace YOUR_WEBAPP_URL with your deployed Web app URL.');

  const props = PropertiesService.getScriptProperties();
  props.setProperty('BOT_ID', bot_id);
  props.setProperty(bot_id, api_key);

  console.log(`Stored credentials for bot_id ${bot_id}.`);
  new Telegram().setWebhook(webapp_url, ['message', 'edited_message']);
}

function doPost(e) {
  const update = JSON.parse(e.postData.contents);
  try {
    new Sheet().getss('events').appendRow([new Date(), `Received new ${Object.keys(update).find((k) => k !== 'update_id')} updates`, JSON.stringify(update,null,1)]);
    const bot = new Telegram();
    if (update.message) {
      const strUpdate = JSON.stringify(update,null,2);
      bot.send({
        chat_id: update.message.chat.id, reply_parameters: { message_id: update.message.message_id }, text: strUpdate,
        entities: [{ offset: 0, length: strUpdate.length, type: 'code' }],
        reply_markup: { inline_keyboard: [
          [{ text: 'Google Sheets', url: 'https://docs.google.com/spreadsheets/d/1vwyo6oE-o_DWO4lPb295v9nonNYVhTuGAgL2jVI1tN8/edit?usp=sharing'}],
          [{ text: 'GitHub', url: 'https://github.com/megatzackry/Google-App-Script-Telegram-Bot'}],
        ]},
      }, 'sendMessage');
    }
  } catch (error) {
    Errors.handle(error, JSON.stringify(update,null,2) || e.postData.contents);
  }
}

class Telegram {
  constructor(bot_id = PropertiesService.getScriptProperties().getProperty('BOT_ID')) {
    this.start = Date.now();
    if (!bot_id) throw new Errors('No bot configured', 'Run setup() first to store your bot token.');
    this.id = String(bot_id);
    this.token = `${this.id}:${PropertiesService.getScriptProperties().getProperty(this.id)}`;
  }

  setWebhook (url, allowed_updates) {
    console.log(this.send({ drop_pending_updates: false }, 'deleteWebhook'));
    console.log(this.send({ url: String(url), allowed_updates }, 'setWebhook'));
  }

  sleepCheck (sleeps, error) {
    if ((Date.now() - this.start + sleeps) > 5.5 * 60000) {
      throw new Errors(`Execution limit exceed.\nCanceled sleep for ${sleeps/1000}s`, JSON.stringify(error, null, 1));
    }
    Utilities.sleep(sleeps);
  }

  fetch (url, params, i = 1) {
    try {
      return JSON.parse(UrlFetchApp.fetch(url, params).getContentText());
    } catch (e) {
      if (i > 2) throw new Errors(JSON.stringify(e, null, 1), url);
      this.sleepCheck(5000 * i, e);
      return this.fetch(url, params, i + 1);
    }
  }

  send (pld, end, i = 1) {
    const rsp = this.fetch(`https://api.telegram.org/bot${this.token}/${end}`, { method: 'post', contentType: 'application/json', payload: JSON.stringify(pld), muteHttpExceptions: true }, i);
    if (rsp.ok) {
      return new Sheet().getss('events').appendRow([new Date(), `Successful ${end}`, '', JSON.stringify(pld, null, 1), JSON.stringify(rsp, null, 1)]);
    } else if (rsp.error_code === 429) {
      if (i > 2) return rsp;
      const retryAfter = rsp.parameters?.retry_after || 10;
      this.sleepCheck(retryAfter * 1000, rsp);
      return this.send(pld, end, i + 1);
    } else if (rsp.error_code) {
      new Errors(end, JSON.stringify(rsp, null, 1)).log(pld);
      return rsp;
    } else if (i > 2) {
      throw new Errors(`Max failed retry ${end}`,JSON.stringify(rsp, null, 1)).log(pld);
    }
    this.sleepCheck(5000 * i, rsp);
    return this.send(pld, end, i + 1);
  }

};

class Sheet {
  constructor() {
    this.ss = {};
    this.doc = SpreadsheetApp.getActiveSpreadsheet();
  }

  getss(sheet) {
    const s = String(sheet);
    if (!this.ss[s]) {
      this.ss[s] = this.doc.getSheetByName(s);
      if (!this.ss[s]) {
        this.ss[s] = this.doc.insertSheet(s);
        const headers = {
          events: ['Date Time', 'Details', 'Updates', 'Payload', 'Response'],
          errors: ['Date Time', 'Message', 'Details', 'Payload'],
        };
        if (headers[s]) this.ss[s].appendRow(headers[s]);
      }
    }
    return this.ss[s];
  }

};

class Errors extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  log(u) {
    let str = '';
    try { str = u ? JSON.stringify(u, null, 1) : ''; } catch (e) { str = '[Circular or Unstringifiable Object]'; }
    new Sheet().getss('errors').appendRow([new Date(), this.message, this.details, str]);
  }

  static handle(error, u) {
    if (error instanceof Errors) return error.log(u);
    new Errors(error.message || 'Unknown Error', error.stack || 'No Stack').log(u);
  }
};
