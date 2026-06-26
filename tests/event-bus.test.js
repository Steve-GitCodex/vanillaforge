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

  it('getListeners returns correct counts', () => {
    const bus = new EventBus();
    bus.on('ev', vi.fn());
    bus.once('ev', vi.fn());
    const info = bus.getListeners('ev');
    expect(info.persistent).toBe(1);
    expect(info.once).toBe(1);
    expect(info.total).toBe(2);
  });

  it('getListeners returns zeros for unknown event', () => {
    const bus = new EventBus();
    const info = bus.getListeners('noop');
    expect(info.total).toBe(0);
  });

  it('getStats returns correct totals', () => {
    const bus = new EventBus();
    bus.on('a', vi.fn());
    bus.on('a', vi.fn());
    bus.once('b', vi.fn());
    const stats = bus.getStats();
    expect(stats.totalEvents).toBe(2);
    expect(stats.totalListeners).toBe(3);
    expect(stats.eventStats['a'].total).toBe(2);
    expect(stats.eventStats['b'].once).toBe(1);
  });
});
