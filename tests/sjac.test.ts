// GENERATED FROM SPEC-SJAC-PARSER-001
import { describe, it, expect } from 'vitest';
import { parseSjacEvents } from '../src/parsers/sjac';

describe('SJAC Parser - parseSjacEvents()', () => {
  // TEST-SJAC-001: AC-2 이벤트 ID 추출 (performanceNo)
  it('AC-2: Should extract performanceNo from URL as eventId', () => {
    const mockHtml = `
      <table>
        <tbody>
          <tr>
            <td class="num">176</td>
            <td class="tit">
              <a href="https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=585&menuLevel=2&menuNo=76" target="_blank">
                Test Event
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
              2025.11.03
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const events = parseSjacEvents(mockHtml);

    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe('585');
  });

  // TEST-SJAC-002: AC-3 제목 추출 및 정규화
  it('AC-3: Should extract and normalize event title', () => {
    const mockHtml = `
      <table>
        <tbody>
          <tr>
            <td class="num">175</td>
            <td class="tit">
              <a href="https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=581&menuLevel=2&menuNo=76">
                겨울밤의 소프라노&amp;테너와 함께하는 12월 야민락 콘서트
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
              2025.11.03
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const events = parseSjacEvents(mockHtml);

    expect(events[0].title).toBe('겨울밤의 소프라노&테너와 함께하는 12월 야민락 콘서트');
  });

  // TEST-SJAC-003: AC-3 새 게시물 마커 제거
  it('AC-3: Should remove new marker from title', () => {
    const mockHtml = `
      <table>
        <tbody>
          <tr>
            <td class="num">176</td>
            <td class="tit">
              <a href="https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=585&menuLevel=2&menuNo=76">
                Test Event<em class="new_mark">N</em>
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
              2025.11.03
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const events = parseSjacEvents(mockHtml);

    expect(events[0].title).toBe('Test Event');
    expect(events[0].title).not.toContain('N');
  });

  // TEST-SJAC-004: AC-3 HTML 엔티티 디코딩
  it('AC-3: Should decode HTML entities in title', () => {
    const mockHtml = `
      <table>
        <tbody>
          <tr>
            <td class="num">174</td>
            <td class="tit">
              <a href="https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=580&menuLevel=2&menuNo=76">
                뮤지컬 &lt;미세스 다웃파이어&gt;
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
              2025.10.24
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const events = parseSjacEvents(mockHtml);

    expect(events[0].title).toBe('뮤지컬 <미세스 다웃파이어>');
  });

  // TEST-SJAC-005: AC-4 날짜 추출
  it('AC-4: Should extract ticket open date', () => {
    const mockHtml = `
      <table>
        <tbody>
          <tr>
            <td class="num">176</td>
            <td class="tit">
              <a href="https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=585&menuLevel=2&menuNo=76">
                Test Event
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
              2025.11.03
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const events = parseSjacEvents(mockHtml);

    expect(events[0].date).toBe('2025.11.03');
  });

  // TEST-SJAC-006: AC-5 eventId 필수 검증
  it('AC-5: Should skip events without performanceNo', () => {
    const mockHtml = `
      <table>
        <tbody>
          <tr>
            <td class="num">176</td>
            <td class="tit">
              <a href="/invalid/url/without/performanceNo">
                Invalid Event
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
              2025.11.03
            </td>
          </tr>
          <tr>
            <td class="num">175</td>
            <td class="tit">
              <a href="https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=585&menuLevel=2&menuNo=76">
                Valid Event
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
              2025.11.03
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const events = parseSjacEvents(mockHtml);

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Valid Event');
  });

  // TEST-SJAC-007: 제목 누락시 스킵
  it('Should skip events without title', () => {
    const mockHtml = `
      <table>
        <tbody>
          <tr>
            <td class="num">176</td>
            <td class="tit">
              <a href="https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=585&menuLevel=2&menuNo=76">
                <!-- Empty title -->
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
              2025.11.03
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const events = parseSjacEvents(mockHtml);

    expect(events).toHaveLength(0);
  });

  // TEST-SJAC-008: 날짜 누락시 스킵
  it('Should skip events without date', () => {
    const mockHtml = `
      <table>
        <tbody>
          <tr>
            <td class="num">176</td>
            <td class="tit">
              <a href="https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=585&menuLevel=2&menuNo=76">
                Test Event
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const events = parseSjacEvents(mockHtml);

    expect(events).toHaveLength(0);
  });

  // TEST-SJAC-009: 다중 이벤트 파싱
  it('Should parse multiple events correctly', () => {
    const mockHtml = `
      <table>
        <tbody>
          <tr>
            <td class="num">176</td>
            <td class="tit">
              <a href="https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=585&menuLevel=2&menuNo=76">
                Event One
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
              2025.11.03
            </td>
          </tr>
          <tr>
            <td class="num">175</td>
            <td class="tit">
              <a href="https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=581&menuLevel=2&menuNo=76">
                Event Two
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
              2025.10.24
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const events = parseSjacEvents(mockHtml);

    expect(events).toHaveLength(2);
    expect(events[0].eventId).toBe('585');
    expect(events[0].title).toBe('Event One');
    expect(events[0].date).toBe('2025.11.03');
    expect(events[1].eventId).toBe('581');
    expect(events[1].title).toBe('Event Two');
    expect(events[1].date).toBe('2025.10.24');
  });

  // TEST-SJAC-010: 빈 테이블
  it('Should return empty array for empty table', () => {
    const mockHtml = `
      <table>
        <tbody>
        </tbody>
      </table>
    `;

    const events = parseSjacEvents(mockHtml);

    expect(events).toHaveLength(0);
  });

  // TEST-SJAC-011: sourceUrl 생성
  it('Should generate correct sourceUrl from href', () => {
    const mockHtml = `
      <table>
        <tbody>
          <tr>
            <td class="num">176</td>
            <td class="tit">
              <a href="https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=585&menuLevel=2&menuNo=76">
                Test Event
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
              2025.11.03
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const events = parseSjacEvents(mockHtml);

    expect(events[0].sourceUrl).toBe('https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=585&menuLevel=2&menuNo=76');
  });

  // TEST-SJAC-012: 상대 URL을 절대 URL로 변환
  it('Should convert relative URL to absolute URL', () => {
    const mockHtml = `
      <table>
        <tbody>
          <tr>
            <td class="num">176</td>
            <td class="tit">
              <a href="/base/nrr/performance/read?performanceNo=585&menuLevel=2&menuNo=76">
                Test Event
              </a>
            </td>
            <td class="date">
              <span>티켓오픈일</span>
              2025.11.03
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const events = parseSjacEvents(mockHtml);

    expect(events[0].sourceUrl).toBe('https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=585&menuLevel=2&menuNo=76');
  });
});
