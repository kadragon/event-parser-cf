import { describe, expect, it } from 'vitest';
import { parseLifeSjeEvents } from '../src/parsers/life-sje';

describe('Life SJE Parser - parseLifeSjeEvents()', () => {
  it('Should return only 접수중(신청중) programs for 공연/전시', () => {
    const response = {
      RESULT: 'SUCCESS',
      RESULT_LIST: [
        {
          REC_KEY: '254',
          PROGRAM_TITLE:
            '(공연) 모락모락(募樂募樂) - 넌버벌 퍼포먼스 난타(1회차)',
          PROGRAM_STATUS: '1',
          PROGRAM_APPLY_START_DATE: '2026-02-27 10:00:00',
          PROGRAM_APPLY_END_DATE: '2026-03-12 17:00:00',
        },
        {
          REC_KEY: '135',
          PROGRAM_TITLE: '(전시) 체험 및 작가와의 대화(2월)',
          PROGRAM_STATUS: '5',
          PROGRAM_APPLY_START_DATE: '2026-02-11 10:00:00',
          PROGRAM_APPLY_END_DATE: '2026-02-24 17:00:00',
        },
      ],
    };

    const events = parseLifeSjeEvents(response);

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      eventId: '254',
      title: '(공연) 모락모락(募樂募樂) - 넌버벌 퍼포먼스 난타(1회차)',
      startDate: '2026.02.27',
      endDate: '2026.03.12',
      sourceUrl: 'https://life.sje.go.kr/community/events/program-detail/254',
    });
  });
});
