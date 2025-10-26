// GENERATED FROM SPEC-EVENT-COLLECTOR-001
import { describe, it, expect } from 'vitest';
import { parseEvents } from '../src/parser';

describe('HTML Parser - parseEvents()', () => {
  // TEST-AC1-NEW-EVENTS
  it('AC-1: Should extract events with promtnSn, title, and date range', () => {
    const mockHtml = `
      <div class="promtnInfoBtn" data-id="12345">
        <img src="image.jpg" />
        <div>혈액 수급 지원 프로모션</div>
        <div>2025.01.01 ~ 2025.12.31</div>
      </div>
    `;

    const events = parseEvents(mockHtml, 'mi=1301');

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      promtnSn: '12345',
      title: '혈액 수급 지원 프로모션',
      startDate: '2025.01.01',
      endDate: '2025.12.31',
      sourceUrl: 'mi=1301',
    });
  });

  it('AC-1: Should extract multiple events from single page', () => {
    const mockHtml = `
      <div class="promtnInfoBtn" data-id="111">
        <img src="1.jpg" />
        <div>제목1</div>
        <div>2025.01.01 ~ 2025.01.31</div>
      </div>
      <div class="promtnInfoBtn" data-id="222">
        <img src="2.jpg" />
        <div>제목2</div>
        <div>2025.02.01 ~ 2025.02.28</div>
      </div>
    `;

    const events = parseEvents(mockHtml, 'mi=1302');

    expect(events).toHaveLength(2);
    expect(events[0].promtnSn).toBe('111');
    expect(events[1].promtnSn).toBe('222');
  });

  it('AC-1: Should handle missing data gracefully', () => {
    const mockHtml = '<div>No events</div>';

    const events = parseEvents(mockHtml, 'mi=1303');

    expect(events).toHaveLength(0);
  });

  it('AC-1: Should parse date range correctly', () => {
    const mockHtml = `
      <div class="promtnInfoBtn" data-id="999">
        <img src="test.jpg" />
        <div>Test Event</div>
        <div>2025.06.15 ~ 2025.07.20</div>
      </div>
    `;

    const events = parseEvents(mockHtml, 'mi=1301');

    expect(events[0].startDate).toBe('2025.06.15');
    expect(events[0].endDate).toBe('2025.07.20');
  });

  it('AC-1: Should extract title from div text', () => {
    const mockHtml = `
      <div class="promtnInfoBtn" data-id="555">
        <img src="event.jpg" />
        <div>온라인 헌혈 예약 이벤트</div>
        <div>2025.01.01 ~ 2025.01.31</div>
      </div>
    `;

    const events = parseEvents(mockHtml, 'mi=1301');

    expect(events[0].title).toBe('온라인 헌혈 예약 이벤트');
  });
});
