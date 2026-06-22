import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../src/core/event-bus.js';

describe('EventBus', () => {
  it('delivers emitted events to subscribers', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('ping', handler);
    bus.emit('ping', { n: 1 });
    expect(handler).toHaveBeenCalledWith({ n: 1 });
  });

  it('unsubscribes via the returned function', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const off = bus.on('ping', handler);
    off();
    bus.emit('ping');
    expect(handler).not.toHaveBeenCalled();
  });

  it('honours once()', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.once('ping', handler);
    bus.emit('ping');
    bus.emit('ping');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls higher-priority listeners first', () => {
    const bus = new EventBus();
    const calls = [];
    bus.on('e', () => calls.push('low'), { priority: 0 });
    bus.on('e', () => calls.push('high'), { priority: 10 });
    bus.emit('e');
    expect(calls).toEqual(['high', 'low']);
  });

  it('isolates listener errors from other listeners', () => {
    const bus = new EventBus();
    const ok = vi.fn();
    bus.on('e', () => {
      throw new Error('boom');
    });
    bus.on('e', ok);
    expect(() => bus.emit('e')).not.toThrow();
    expect(ok).toHaveBeenCalled();
  });
});
