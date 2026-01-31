/**
 * Sejong Lifelong Education Institute (life.sje.go.kr) parser
 * Targets 공연/전시 탭 with 접수중(신청중) 상태
 */

import { CONFIG } from '../config';
import type { SiteEvent, SiteParser } from '../types/site-parser';
import { fetchWithTimeout } from '../utils/fetch';
import { normalizeText } from '../utils/sanitize';

export interface LifeSjeProgram {
  REC_KEY?: string;
  PROGRAM_TITLE?: string;
  PROGRAM_STATUS?: string | number;
  PROGRAM_APPLY_START_DATE?: string;
  PROGRAM_APPLY_END_DATE?: string;
}

export interface LifeSjeProgramListResponse {
  RESULT?: string;
  RESULT_LIST?: LifeSjeProgram[];
}

export interface LifeSjeEvent {
  eventId: string;
  title: string;
  startDate: string;
  endDate: string;
  sourceUrl: string;
}

const OPEN_STATUS = new Set(['1', '2']);

function normalizeDate(value?: string): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/(\d{4})[.-](\d{2})[.-](\d{2})/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return `${year}.${month}.${day}`;
}

function isOpenStatus(status?: string | number): boolean {
  if (status === undefined || status === null) {
    return false;
  }

  const normalized = String(status).trim();
  return OPEN_STATUS.has(normalized);
}

export function parseLifeSjeEvents(
  response: LifeSjeProgramListResponse
): LifeSjeEvent[] {
  if (response.RESULT !== 'SUCCESS' || !Array.isArray(response.RESULT_LIST)) {
    return [];
  }

  return response.RESULT_LIST.flatMap((program) => {
    if (!isOpenStatus(program.PROGRAM_STATUS)) {
      return [];
    }

    const eventId = program.REC_KEY?.trim() || '';
    const title = normalizeText(program.PROGRAM_TITLE || '');
    const startDate = normalizeDate(program.PROGRAM_APPLY_START_DATE);
    const endDate = normalizeDate(program.PROGRAM_APPLY_END_DATE);

    if (!eventId || !title || !startDate || !endDate) {
      return [];
    }

    const sourceUrl = `${CONFIG.lifeSje.baseUrl}${CONFIG.lifeSje.programDetailPath}/${eventId}`;

    return [
      {
        eventId,
        title,
        startDate,
        endDate,
        sourceUrl,
      },
    ];
  });
}

export async function fetchAndParseLifeSjeEvents(): Promise<LifeSjeEvent[]> {
  const body = new URLSearchParams({
    manage_code: CONFIG.lifeSje.manageCode,
    search_type: 'all',
    program_status: CONFIG.lifeSje.programStatusOpen,
    page_no: '1',
    display: CONFIG.lifeSje.pageSize,
    program_major_category: CONFIG.lifeSje.programMajorCategory,
  });

  const response = await fetchWithTimeout(
    `${CONFIG.lifeSje.baseUrl}${CONFIG.lifeSje.apiPath}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: body.toString(),
    },
    CONFIG.lifeSje.fetchTimeoutMs
  );

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${response.statusText} when fetching from ${CONFIG.lifeSje.baseUrl}`
    );
  }

  const json = (await response.json()) as LifeSjeProgramListResponse;
  return parseLifeSjeEvents(json);
}

export class LifeSjeParser implements SiteParser {
  siteId = 'life-sje';
  siteName = '세종특별자치시교육청 평생교육원';

  async fetchAndParse(): Promise<SiteEvent[]> {
    const events = await fetchAndParseLifeSjeEvents();
    return events.map((event) => ({
      siteId: this.siteId,
      siteName: this.siteName,
      eventId: event.eventId,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      sourceUrl: event.sourceUrl,
    }));
  }
}
