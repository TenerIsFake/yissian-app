---
name: yis
description: Feature lifecycle tool for the Yissian Translator mobile app (React Native / Expo SDK 54). Use when working on any feature for yissian-app — brainstorming ideas, writing specs, implementing features, or testing them. Invoke as /yis [brainstorm|spec|implement|test] [description]. Also triggers when user says "add feature", "new idea", "spec this out", "implement this feature", or "test the app" in the context of yissian-app.
argument-hint: [brainstorm|spec|implement|test] [description]
allowed-tools: [Read, Bash, Edit, Write, Glob, Grep]
---

# Yissian Feature Lifecycle — /yis

Arguments received: $ARGUMENTS

## Project Context

**App:** Yissian Translator — translates English into Yissian dialect via `yissian-engine` npm package.
**Stack:** React Native 0.81.5 / Expo SDK 54 / bare workflow / Android primary target.
**Entry point:** `App.js` → bottom-tab navigator (Translate, History, Rules tabs).
**Key files:**
- `src/components/BannerAd.js` — AdMob banner (react-native-google-mobile-ads)
- `src/screens/` — tab screens (check with Glob if unsure)
- `app.json` — Expo config, top-level `react-native-google-mobile-ads` key for AdMob
- `android/` — bare workflow native directory (committed to git)
- `eas.json` — EAS build profiles (production = Play Store)

**Build pipeline:** `npx eas-cli build --platform android --profile production` → EAS cloud build.
**Local dev:** `npx expo start` → scan QR with Expo Go, or `npx expo run:android` for native.

---

## Mode Detection

Parse the first word of `$ARGUMENTS` to determine the mode. If no arguments, print the **Status** view.

| First word | What to do |
|---|---|
| `brainstorm` | Run Brainstorm mode |
| `spec` | Run Spec mode |
| `implement` | Run Implement mode |
| `test` | Run Test mode |
| *(empty)* | Run Status mode |

The rest of `$ARGUMENTS` after the mode word is the **topic** for that mode.

---

## Status Mode (no arguments)

Read `$ARGUMENTS` — if empty, print a quick project summary:

1. Run `git log --oneline -5` to show recent commits.
2. Run `git status` to show dirty files.
3. Check `src/features-backlog.md` if it exists; if not, say no backlog file yet.
4. Suggest next step: "Run `/yis brainstorm <idea>` to explore a new feature, or `/yis spec <feature>` to write a spec for one."

---

## Brainstorm Mode

**Goal:** Rapidly explore ideas for a new feature before committing to any implementation.

1. **Understand the idea.** The topic is everything after "brainstorm" in `$ARGUMENTS`. If it's empty, ask the user what feature area they want to explore.

2. **Read relevant screens.** Use Glob to find the relevant screen files in `src/` that the feature would touch. Skim them to understand existing patterns.

3. **Generate 3–5 options.** For each option, give:
   - One-sentence description
   - Rough effort (S / M / L — where S = few hours, M = 1-2 days, L = multi-day)
   - Key tradeoff or risk

4. **Pick a recommendation.** State which option you'd implement and why.

5. **Offer to spec it.** End with: "Run `/yis spec <feature-name>` to turn this into a formal spec."

---

## Spec Mode

**Goal:** Produce a code-ready spec with acceptance criteria and a file-level implementation plan.

1. **Clarify scope.** The topic from `$ARGUMENTS` is the feature name. Ask 2–3 targeted questions if the scope is unclear — but if the brainstorm context is fresh in the conversation, extract answers from it instead of asking again.

2. **Write the spec** in this exact format:

```
## Spec: <Feature Name>

**One-line summary:** <what it does>

### Acceptance Criteria
- [ ] <testable criterion 1>
- [ ] <testable criterion 2>
- [ ] ...

### Files to Touch
| File | Change |
|---|---|
| src/screens/Foo.js | Add X component |
| App.js | Register new tab |

### Effort Estimate
<Low / Medium / High> — <1-sentence reason>

### Open Questions
- <anything that needs a decision before coding>
```

3. **Append to backlog.** Append the spec block to `src/features-backlog.md` (create the file if it doesn't exist), prefixed with today's date and a status of `[ ] Pending`.

4. **Offer next step.** "Run `/yis implement <feature-name>` when ready to build this."

---

## Implement Mode

**Goal:** Execute the approved spec cleanly — no scope creep, no unrequested refactors.

1. **Load the spec.** Find the feature in `src/features-backlog.md`. If none exists, ask the user to run `/yis spec <name>` first.

2. **Confirm before starting.** Show the acceptance criteria list and ask: "Ready to implement this? I'll touch: [list of files from spec]."

3. **Implement.** Follow the files-to-touch list from the spec. Prefer editing existing files over creating new ones. Do not add features or refactors beyond the spec.

4. **Mark spec as done.** Update the status in `src/features-backlog.md` from `[ ] Pending` to `[x] Implemented (YYYY-MM-DD)`.

5. **Offer to test.** "Run `/yis test` to verify the feature works."

---

## Test Mode

**Goal:** Verify the feature works on Android and check for regressions.

1. **Manual test checklist.** Based on the most recently implemented spec (or the topic in `$ARGUMENTS`), generate a checklist of what to manually verify on the device/emulator. Format as:

```
Manual Test Checklist — <Feature Name>

Golden path:
- [ ] <step 1>
- [ ] <step 2>

Edge cases:
- [ ] <empty state>
- [ ] <error state>

Regression checks:
- [ ] Translate tab still works
- [ ] History tab still works
- [ ] Rules tab still works
- [ ] AdMob banner appears at bottom
```

2. **Start dev server.** Run `npx expo start` suggestion — remind the user to scan with Expo Go or use `npx expo run:android`.

3. **Build option.** If the feature touches native code (anything in `android/`, `app.json` plugins, or new native dependencies), note: "This feature touches native code — a local Expo run may not reflect all changes. Recommend `npx eas-cli build --platform android --profile production` to verify the full production build."

4. **EAS build shortcut.** If the user says "build it" or "run eas", offer to trigger the EAS build:
   ```
   npx eas-cli build --platform android --profile production --non-interactive
   ```
   Then monitor the result.
