/**
 * Central Configuration for event-parser-cf
 *
 * GENERATED FROM Task-006: Configuration Centralization
 *
 * All application-wide settings are defined here for easy maintenance.
 * This provides a single source of truth for all configuration values.
 *
 * TRACE: Addresses Separation of Concerns Issue #3.2 from refactoring analysis
 */

/**
 * Centralized application configuration
 *
 * All configuration values are strongly typed and readonly.
 * Environment-specific overrides can be added in the future through ENV variables.
 */
export const CONFIG = {
  /**
   * Bloodinfo parser configuration
   * Site: https://www.bloodinfo.net
   */
  bloodinfo: {
    /** Base URL for bloodinfo.net */
    baseUrl: 'https://www.bloodinfo.net',

    /** URL path template for promotion lists */
    urlPath: '/knrcbs/pr/promtn/progrsPromtnList.do',

    /** Query parameters */
    queryParams: {
      type: 'A',
    },

    /** Promotion category IDs to fetch (mi parameter) */
    categories: [1301, 1303] as const,

    /** CSS selectors */
    selectors: {
      eventLink: 'a.promtnInfoBtn',
      span: '> span',
    },
  },

  /**
   * KTCU (한국교직원공제회) parser configuration
   * Site: https://www.ktcu.or.kr
   */
  ktcu: {
    /** Site URL for KTCU events page */
    siteUrl: 'https://www.ktcu.or.kr/PPW-WFA-100101',

    /** Fetch timeout in milliseconds */
    fetchTimeoutMs: 10000,

    /** CSS class name for event containers */
    eventClass: 'box-event',

    /** CSS selectors */
    selectors: {
      title: 'strong.tit',
      date: 'p.date',
    },
  },

  /**
   * SJAC (세종예술의전당) parser configuration
   * Site: https://www.sjac.or.kr
   * TRACE: SPEC-SJAC-PARSER-001
   */
  sjac: {
    /** Site URL for SJAC ticket open schedule board */
    siteUrl: 'https://www.sjac.or.kr/base/board/list?boardManagementNo=38',

    /** Fetch timeout in milliseconds */
    fetchTimeoutMs: 10000,

    /** CSS selectors */
    selectors: {
      tableBody: 'tbody',
      tableRow: 'tr',
      numberCell: 'td.num',
      titleCell: 'td.tit',
      titleLink: 'a',
      dateCell: 'td.date',
      newMark: 'em.new_mark',
    },
  },

  /**
   * Sejong Lifelong Education Institute (life.sje.go.kr) parser configuration
   */
  lifeSje: {
    /** Base URL for life.sje.go.kr */
    baseUrl: 'https://life.sje.go.kr',

    /** API endpoint path */
    apiPath: '/api/homepageprogramlist',

    /** Manage code required by API */
    manageCode: '150018',

    /** 공연 및 전시 대분류 */
    programMajorCategory: '3',

    /** 접수중(신청중) 상태 필터 */
    programStatusOpen: '1and2',

    /** Default page size */
    pageSize: '60',

    /** Fetch timeout in milliseconds */
    fetchTimeoutMs: 10000,
  },

  /**
   * Telegram bot configuration
   */
  telegram: {
    /** Telegram API base URL */
    apiBaseUrl: 'https://api.telegram.org',

    /** Timeout for Telegram API calls (milliseconds) */
    fetchTimeoutMs: 15000,

    /** Telegram's maximum message length */
    maxMessageLength: 4096,

    /** Safe truncation length (leaving room for "..." suffix) */
    safeTruncateLength: 4000,
  },

  /**
   * KV storage configuration
   */
  kv: {
    /** Number of parallel KV read operations allowed */
    readConcurrency: 5,

    /** TTL for sent event records (in days) */
    ttlDays: 60,

    /** Key prefix for sent event records */
    keyPrefix: 'sent:',
  },
} as const;

/**
 * Type-safe configuration access
 *
 * This type can be used to ensure type safety when accessing configuration.
 */
export type AppConfig = typeof CONFIG;
