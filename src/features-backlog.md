# Yissian App — Feature Backlog

---

## 2026-05-07

### [x] Implemented (2026-05-07) — Web Translator User Education

**One-line summary:** Permanent hint + smarter empty-state tell users which sites work and why others don't.

### Acceptance Criteria
- [ ] Permanent subtitle under the URL bar: "Works best with Wikipedia, news articles, and blogs"
- [ ] Empty-state (0 blocks extracted) shows specific examples of sites that won't work: Twitter/X, Reddit, YouTube, Gmail
- [ ] Empty-state distinguishes "no content found" (dynamic site) from network/HTTP errors (existing error card)
- [ ] All existing error card behaviour unchanged

### Files to Touch
| File | Change |
|---|---|
| src/screens/WebTranslateScreen.js | Add hint text under bar; split empty-state into "dynamic site" vs existing error |

### Effort Estimate
Small — UI text + one extra conditional branch in render.

---

### [x] Implemented (2026-05-07) — Intensity UX Clarity

**One-line summary:** Rename intensity steps to plain English labels and show a live word-count badge.

### Acceptance Criteria
- [ ] Step buttons labelled Off / Light / Half / Most / Full (replacing 0%/25%/50%/75%/100%)
- [ ] A badge below the buttons shows "~N of M words translated" when intensity is Light/Half/Most
- [ ] Badge hidden at Off and Full (redundant at extremes)
- [ ] Badge updates immediately when intensity or input changes
- [ ] No change to underlying translateWithIntensity logic

### Files to Touch
| File | Change |
|---|---|
| src/screens/TranslateScreen.js | Rename step labels; add word-count badge component |

### Effort Estimate
Small — label rename + computed badge, no logic changes.

---

### [x] Implemented (2026-05-07) — Phrase Library Search

**One-line summary:** Search box above the SectionList filters phrases by content in real time.

### Acceptance Criteria
- [ ] TextInput search bar appears above the phrase list
- [ ] Typing filters both phrase text (English and Yissian) across all categories
- [ ] Matching sections with zero results are hidden entirely (no empty section headers)
- [ ] Clearing search restores all sections
- [ ] Search is case-insensitive

### Files to Touch
| File | Change |
|---|---|
| src/screens/PhrasesScreen.js | Add search state + filtered SECTIONS computation + search input UI |

### Effort Estimate
Small — in-memory filter with useMemo, no new deps.

---

### [ ] Pending — Web URL Translator (Phase 2 — CF Worker)

**One-line summary:** A Cloudflare Worker proxies arbitrary URLs, strips navigation/scripts, and returns plain HTML blocks for the browser to translate client-side.

### Problem
Browsers block `fetch()` to third-party domains (CORS). The mobile app works around this via a React Native networking layer; the web app runs in a sandboxed origin and cannot fetch `https://en.wikipedia.org/...` directly.

### Solution
A Cloudflare Worker at `https://proxy.yissian.tendrid.us/fetch?url=<encoded>`:
1. Receives the target URL as a query param
2. Fetches it server-side (no CORS restriction at Worker level)
3. Strips `<head>/<script>/<style>/<nav>/<footer>/<header>`
4. Returns JSON: `{ blocks: [{ tag, text }] }` where blocks are extracted `<h1–h3|p|li|blockquote|td|th>` elements
5. Browser receives clean block list and translates each block client-side

### Acceptance Criteria
- [ ] Worker deployed at `proxy.yissian.tendrid.us` (new CF Worker + custom domain route)
- [ ] Worker validates URL (must be http/https, no internal IPs)
- [ ] Worker sets `Access-Control-Allow-Origin: https://yissian-web.pages.dev` (or `*` for dev)
- [ ] Web app adds "Web" tab with URL input bar
- [ ] Successful fetch: renders tap-to-toggle blocks (original ↔ translated), matching mobile UX
- [ ] Empty-state (0 blocks): "No readable content — try Wikipedia or a news article"
- [ ] HTTP errors: red error card with status + tappable URL
- [ ] Permanent hint under URL bar (matches mobile)

### Files to Touch
| File | Change |
|---|---|
| New: `worker/index.js` (in yissian-web repo) | CF Worker source — fetch, strip, extract, return JSON |
| New: `wrangler.toml` | Worker name, route, compatibility date |
| `src/WebTranslate.jsx` | New page: URL bar → Worker call → block render |
| `src/App.jsx` | Add "Web" tab to NAV; pass dialect to WebTranslate |
| `src/App.css` | WebTranslate styles (reuse existing card patterns) |

### Effort Estimate
Medium — Worker is ~50 lines; web component mirrors mobile implementation; custom domain setup is 1 CF step.

### Open Questions
- Should the Worker allowlist only known safe domains (Wikipedia, BBC…), or allow any URL with IP/localhost blocked?
- Rate-limiting strategy: CF free tier Workers are 100K req/day — acceptable for now, add KV-based throttle in Phase 3?

---

### [ ] Pending — Android SDK Homepage Widget (SRV-2)

**One-line summary:** SRV-2 exposes Android SDK health as a JSON endpoint; SRV-1 homepage shows a widget card.

### Acceptance Criteria
- [ ] SRV-2 serves `GET http://10.0.0.155:3010/api/android-health` returning JSON with: java_version, sdk_path, disk_gb, last_build_at, last_build_status
- [ ] SRV-1 homepage dashboard shows an "Android Build" card in the SRV-2 section
- [ ] Card displays: Java version, disk usage, last build timestamp + status
- [ ] Card polls every 5 minutes (consistent with other service cards)

### Files to Touch
| File | Change |
|---|---|
| SRV-2: ~/scripts/android-health-server.py | New: tiny Flask/http.server exposing health JSON |
| SRV-2: cron | Add entry to keep server running |
| SRV-1: projects/Homepage-claude/... | New widget card + nginx proxy route |

### Effort Estimate
Medium — two machines involved; SRV-2 side is simple, SRV-1 homepage needs nginx + widget.

### Open Questions
- Does SRV-2 already have Flask installed, or should this use Python's built-in `http.server`?

---

## 2026-05-06

### [x] Implemented (2026-05-06) — Dialect Intensity Selector

**One-line summary:** Step buttons (0/25/50/75/100%) control how many words get translated.

### Acceptance Criteria
- [x] 5 step buttons visible between input and output on TranslateScreen
- [x] Active step is highlighted; changing step re-translates immediately
- [x] At 0%, output equals input; at 100%, full dialect translation
- [x] History entry records the active intensity's output

### Files Touched
| File | Change |
|---|---|
| src/screens/TranslateScreen.js | `translateWithIntensity()` helper + intensity state + step buttons |

---

### [x] Implemented (2026-05-06) — Favorites / Pinned Translations

**One-line summary:** Star any history entry to pin it to the top of the History tab.

### Acceptance Criteria
- [x] Star button (⭐/☆) on every history card
- [x] Tapping star toggles starred state; persisted to AsyncStorage
- [x] Starred cards use a distinct border color and float to top of list
- [x] Unstarred cards retain recency order below

### Files Touched
| File | Change |
|---|---|
| src/hooks/useHistory.js | `starred` field in entries, `toggleStar(id)`, sorted output |
| src/screens/HistoryScreen.js | Star button + cardStarred style + receives `toggleStar` |

---

### [x] Implemented (2026-05-06) — Share as Formatted Card

**One-line summary:** Share button wraps original + translation in a styled text card.

### Acceptance Criteria
- [x] Tapping Share sends a formatted multi-line message with both texts
- [x] Message includes app attribution line

### Files Touched
| File | Change |
|---|---|
| src/screens/TranslateScreen.js | `handleShare` builds card string before calling `Share.share()` |

---

### [x] Implemented (2026-05-06) — Word-by-Word Tooltip Mode

**One-line summary:** Toggle renders output as tappable chips; each chip reveals the original English word.

### Acceptance Criteria
- [x] "📝 Words" toggle button in output header row
- [x] When active, output renders as individual word chips (flex-wrap)
- [x] Tapping a chip shows the original English word below it
- [x] Chips where original == translated do not show tooltip
- [x] Toggle is disabled when output is empty

### Files Touched
| File | Change |
|---|---|
| src/screens/TranslateScreen.js | `WordChips` component + `tooltipMode` state + toggle button |

---

### [x] Implemented (2026-05-06) — Phrase Library

**One-line summary:** New "Phrases" tab with 5 category packs of pre-translated common phrases.

### Acceptance Criteria
- [x] New 💬 Phrases tab in bottom navigator (between History and Rules)
- [x] Phrases organized by category with sticky section headers
- [x] Each phrase shows English + Yissian translation
- [x] Copy button per phrase copies the Yissian text

### Files Touched
| File | Change |
|---|---|
| src/data/phrases.js | 5 phrase packs, 7 phrases each |
| src/screens/PhrasesScreen.js | SectionList with sticky headers + PhraseItem + copy |
| App.js | Import PhrasesScreen, add Phrases tab |
