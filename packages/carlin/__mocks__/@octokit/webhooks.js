'use strict';

class Webhooks {
  constructor() {
    this._handlers = {};
    this._errorHandlers = [];
  }

  on(event, handler) {
    const events = Array.isArray(event) ? event : [event];
    for (const e of events) {
      if (!this._handlers[e]) this._handlers[e] = [];
      this._handlers[e].push(handler);
    }
  }

  onError(handler) {
    this._errorHandlers.push(handler);
  }

  async receive({ name, payload, id }) {
    const eventNames = [name];
    if (payload && payload.action) {
      eventNames.push(`${name}.${payload.action}`);
    }
    for (const eventName of eventNames) {
      for (const handler of this._handlers[eventName] || []) {
        await handler({ payload, id, name: eventName });
      }
    }
  }
}

// eslint-disable-next-line no-undef
module.exports = { Webhooks };
