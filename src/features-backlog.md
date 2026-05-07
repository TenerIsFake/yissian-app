# Yissian App — Feature Backlog

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
