import { getSessionStatus, getCountdown } from '../useSessionStatus';

describe('getSessionStatus', () => {
  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;
  const oneMinuteMs = 60 * 1000;

  test('should return UPCOMING when current time is before start time', () => {
    const startTime = new Date(now + oneHourMs);
    const status = getSessionStatus(startTime, 60, now);
    expect(status).toBe('UPCOMING');
  });

  test('should return LIVE when current time is within session window', () => {
    const startTime = new Date(now - oneMinuteMs);
    const status = getSessionStatus(startTime, 60, now);
    expect(status).toBe('LIVE');
  });

  test('should return ENDED when current time is after end time', () => {
    const startTime = new Date(now - oneHourMs - oneMinuteMs);
    const status = getSessionStatus(startTime, 60, now);
    expect(status).toBe('ENDED');
  });

  test('should return ENDED when current time equals end time', () => {
    const startTime = new Date(now - oneHourMs);
    const status = getSessionStatus(startTime, 60, now);
    expect(status).toBe('ENDED');
  });

  test('should return ENDED when current time equals start time (edge case)', () => {
    const startTime = new Date(now);
    const status = getSessionStatus(startTime, 60, now);
    expect(status).toBe('LIVE'); // At exactly start time, it's LIVE
  });

  test('should return ENDED for invalid start time', () => {
    const status = getSessionStatus(null as any, 60, now);
    expect(status).toBe('ENDED');
  });

  test('should return ENDED for invalid duration', () => {
    const startTime = new Date(now + oneHourMs);
    const status = getSessionStatus(startTime, 0, now);
    expect(status).toBe('ENDED');
  });

  test('should return ENDED for negative duration', () => {
    const startTime = new Date(now + oneHourMs);
    const status = getSessionStatus(startTime, -60, now);
    expect(status).toBe('ENDED');
  });

  test('should handle ISO string input for start time', () => {
    const startTime = new Date(now + oneHourMs).toISOString();
    const status = getSessionStatus(startTime, 60, now);
    expect(status).toBe('UPCOMING');
  });

  test('should handle custom current time for testing', () => {
    const customNow = new Date('2024-01-01T12:00:00Z').getTime();
    const startTime = new Date('2024-01-01T13:00:00Z');
    const status = getSessionStatus(startTime, 60, customNow);
    expect(status).toBe('UPCOMING');
  });
});

describe('getCountdown', () => {
  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;
  const oneMinuteMs = 60 * 1000;

  test('should return formatted countdown for upcoming session', () => {
    const startTime = new Date(now + oneHourMs + oneMinuteMs);
    const countdown = getCountdown(startTime, now);
    expect(countdown).toMatch(/\d{2} : \d{2} : \d{2}/);
  });

  test('should return empty string when session has started', () => {
    const startTime = new Date(now - oneMinuteMs);
    const countdown = getCountdown(startTime, now);
    expect(countdown).toBe('');
  });

  test('should return empty string when session time has passed', () => {
    const startTime = new Date(now - oneHourMs);
    const countdown = getCountdown(startTime, now);
    expect(countdown).toBe('');
  });

  test('should return empty string for invalid start time', () => {
    const countdown = getCountdown(null as any, now);
    expect(countdown).toBe('');
  });

  test('should handle ISO string input', () => {
    const startTime = new Date(now + oneHourMs).toISOString();
    const countdown = getCountdown(startTime, now);
    expect(countdown).toMatch(/\d{2} : \d{2} : \d{2}/);
  });

  test('should format hours, minutes, seconds correctly', () => {
    const startTime = new Date(now + (2 * oneHourMs) + (30 * oneMinuteMs) + (15 * 1000));
    const countdown = getCountdown(startTime, now);
    expect(countdown).toBe('02 : 30 : 15');
  });
});
