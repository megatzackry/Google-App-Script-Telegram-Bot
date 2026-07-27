function reset() {
  const bot = new Bot(/*'YOUR_BOT_CHAT_ID'*/);
  bot.setWebhook(/*'YOUR_DEPLOYMENT_ID'*/, ['message', 'edited_message']);
}

function doPost(e) {
  const u = new Update(e);
  try {
    switch (u.type) {
      case 'message':
      case 'edited_message':        return handleMessage(u[u.type]);
      case 'callback_query':        return handleCallback(u.callback_query);
      default: throw new Errors(3, 'Unhandled update', `type: ${u.type}`);
    }
  } catch (error) {
    Errors.handle(error, u.raw || e.postData.contents);
  }
}

function handleMessage(msg){
  if (msg.chat.type === 'supergroup') {
    // Handle Group Messages
  } else if (msg.chat.type === 'private') {
    if (msg.text) {
      // Handle Private Text Messages
    }
  }
  const msgType = ['text', 'photo', 'video', 'sticker', 'document', 'audio', 'voice', 'video_note', 'location', 'contact', 'poll'].find(t => msg[t]);
  throw new Errors(1, `Recieved bot ${msgType ?? 'unknown'} message`, `msg: ${JSON.stringify(msg[msgType] ?? 'unknown')}`);
}

class Update {
  constructor(e) {
    this.raw = JSON.parse(e.postData.contents);
    this.type = Object.keys(this.raw).find((k) => k !== 'update_id');
    this[this.type] = this.raw[this.type];
  }
};


class Bot {
  constructor(bot_id) {
    this.start = Date.now();
    this.id = String(bot_id);
    this.token = `${this.id}:${PropertiesService.getScriptProperties().getProperty(this.id)}`;
  }

  setWebhook (deployment_id, allowed_updates) {
    console.log(this.send({ drop_pending_updates: false }, 'deleteWebhook'));
    console.log(this.send({ url: `https://script.google.com/macros/s/${String(deployment_id)}/exec`, allowed_updates }, 'setWebhook'));
  }
  
  sleepCheck (sleeps, error) {
    if ((Date.now() - this.start + sleeps) > 5.5 * 60000) {
      throw new Errors(2, `Execution limit exceed.\nCanceled sleep for ${sleeps/1000}s`, JSON.stringify(error, null, 1));
    }
    Utilities.sleep(sleeps);
  }

  fetch (url, params, i = 1) {
    try {
      return JSON.parse(UrlFetchApp.fetch(url, params).getContentText());
    } catch (e) {
      if (i > 2) throw new Errors(2, JSON.stringify(e, null, 1), url);
      this.sleepCheck(5000 * i, e);
      return this.fetch(url, params, i + 1);
    }
  }

  send (pld, end = 'sendMessage', i = 1) {
    const rsp = this.fetch(`https://api.telegram.org/bot${this.token}/${end}`, { method: 'post', contentType: 'application/json', payload: JSON.stringify(pld), muteHttpExceptions: true }, i);
    if (rsp.ok) return rsp;
    if (rsp.error_code === 429) {
      if (i > 2) return rsp;
      const retryAfter = rsp.parameters?.retry_after || 10;
      this.sleepCheck(retryAfter * 1000, rsp);
      return this.send(pld, end, i + 1);
    } else if (rsp.error_code) {
      new Errors(0, end, JSON.stringify(rsp, null, 1)).log(pld);
      return rsp;
    } else if (i > 2) {
      throw new Errors(3,`Max failed retry ${end}`,JSON.stringify(rsp, null, 1)).log(pld);
    }
    this.sleepCheck(5000 * i, rsp);
    return this.send(pld, end, i + 1);
  }

};

class Cache {
  constructor() { this.cache = CacheService.getDocumentCache(); }
  get(key) { return this.cache.get(String(key)); }
  del(key) { return this.cache.remove(String(key)); }
  set(key, val, sec = 216) { return this.cache.put(String(key), JSON.stringify(val), sec * 100); }
};

class User {
  constructor({ row, uid }) {
    this.row = row;
    this.uid = uid || null;
  }
};

class Sheet {
  constructor() {
    this.ss = {};
    this.cache = new Cache();
    this.doc = SpreadsheetApp.getActiveSpreadsheet();
  }

  getCache(key) {
    const v = this.cache.get(key);
    return v == null ? null : JSON.parse(v);
  }

  getNextRow(ss, range, val) {
    return ss.getRange(range).createTextFinder(val).matchCase(false).matchEntireCell(true).findNext()?.getRow();
  }

  getss(sheet) {
    const s = String(sheet);
    if (!this.ss[s]) {
      this.ss[s] = this.doc.getSheetByName(s);
      if (!this.ss[s]) {
        this.ss[s] = this.doc.insertSheet(s);
      }
    }
    return this.ss[s];
  }

};

class Errors extends Error {
  constructor(flag, message, details) {
    super(message);
    this.flag = flag;
    this.details = details;
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  log(u, str = '') {
    try { str = u ? JSON.stringify(u, null, 1) : ''; } catch (e) { str = '[Circular or Unstringifiable Object]'; }
    new Sheet().getss('logs').appendRow(
      [ new Date(), this.flag, this.message, this.details, str ]
    );
  }

  static handle(error, u) {
    if (error instanceof Errors || error.name === 'Errors') return error.log(u);
    new Errors(3, error.message || 'Unknown Error', error.stack || 'No Stack').log(u);
  }
};
