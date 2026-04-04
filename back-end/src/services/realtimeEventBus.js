import { EventEmitter } from 'events';

class RealtimeEventBus {
  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(200);
  }

  publish(channel, payload) {
    this.emitter.emit(channel, payload);
  }

  subscribe(channel, listener) {
    this.emitter.on(channel, listener);
    return () => this.emitter.off(channel, listener);
  }
}

const realtimeEventBus = new RealtimeEventBus();

export default realtimeEventBus;
