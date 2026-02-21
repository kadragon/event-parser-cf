import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAndParseLifeSjeEvents,
  parseLifeSjeEvents,
} from '../src/parsers/life-sje';

const mockFetch = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).fetch = mockFetch;

describe('Life SJE Parser - parseLifeSjeEvents()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Should return only programs with 접수중 status and 모집인원 400명', () => {
    const response = {
      RESULT: 'SUCCESS',
      RESULT_LIST: [
        {
          REC_KEY: '442',
          PROGRAM_TITLE: '(두번째 씨네뮤지엄) 뉴욕 메트로폴리탄박물관',
          PROGRAM_STATUS: '1',
          RECRUITMENT_PERSONNEL_CNT: '400',
          PROGRAM_APPLY_START_DATE: '2026-02-27 10:00:00',
          PROGRAM_APPLY_END_DATE: '2026-03-12 17:00:00',
        },
        {
          REC_KEY: '999',
          PROGRAM_TITLE: '접수중이지만 모집인원 399',
          PROGRAM_STATUS: '1',
          RECRUITMENT_PERSONNEL_CNT: '399',
          PROGRAM_APPLY_START_DATE: '2026-02-11 10:00:00',
          PROGRAM_APPLY_END_DATE: '2026-02-24 17:00:00',
        },
        {
          REC_KEY: '998',
          PROGRAM_TITLE: '모집인원 400이지만 접수종료',
          PROGRAM_STATUS: '5',
          RECRUITMENT_PERSONNEL_CNT: '400',
          PROGRAM_APPLY_START_DATE: '2026-02-11 10:00:00',
          PROGRAM_APPLY_END_DATE: '2026-02-24 17:00:00',
        },
      ],
    };

    const events = parseLifeSjeEvents(response);

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      eventId: '442',
      title: '(두번째 씨네뮤지엄) 뉴욕 메트로폴리탄박물관',
      startDate: '2026.02.27',
      endDate: '2026.03.12',
      sourceUrl: 'https://life.sje.go.kr/community/events/program-detail/442',
    });
  });

  it('Should request all categories without program_major_category', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ RESULT: 'SUCCESS', RESULT_LIST: [] }),
    });

    await fetchAndParseLifeSjeEvents();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0] as unknown[];
    const options = callArgs[1] as Record<string, unknown>;
    const body = options.body as string;
    const params = new URLSearchParams(body);

    expect(params.get('program_status')).toBe('1and2');
    expect(params.has('program_major_category')).toBe(false);
  });
});
