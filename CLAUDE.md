# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Signify is a real-time sign language interpreter built as a film prop and portfolio piece. It captures hand landmarks from the webcam via MediaPipe `HandLandmarker`, matches them against a pre-recorded gesture library by cosine similarity, and renders the matched label as on-screen translation text. A keyboard manual override exists as the on-set fail-safe — pressing `1`–`9` force-injects pre-written dialogue and bypasses AI inference entirely.

The plan that governs this codebase lives at `C:\Users\USER\.claude\plans\project-signify-ai-driven-iridescent-crystal.md` — refer to it for design rationale before making structural changes.

## Commands

```bash
npm run dev      # Vite dev server (default http://localhost:5173/)
npm run build    # tsc -b && vite build (catches type errors)
npm run lint     # eslint .
npm run preview  # serve the production build locally
```

There is no test runner configured. Verification is manual — see the "Verification plan" section of the plan file.

## Architecture

### Data flow (single direction, no global store)

```
useCamera          → videoRef
                       ↓
useMediaPipe       → HandFrame[]      (numHands=2, GPU delegate, ~30Hz)
                       ↓
                       ├──────────────→ LandmarkOverlay (SVG, every frame)
                       └──────────────→ useGestureMatcher (every 3rd frame)
                                            ↓
                                          MatchResult
                                            ↓
                                          OutputPane.text  ← override (highest priority)
```

`MainView.tsx` is the only place where the four hooks are wired together. State lives there; child components are presentational.

### Override priority — the on-set guarantee

`displayText = override ?? (matchResult.kind === 'match' ? matchResult.label : '')`

The keyboard hook is the **only** writer of `override`. The AI never touches it. Keep this invariant: if you find yourself adding logic that lets the matcher clear or set `override`, you are breaking the fail-safe contract that justifies this whole architecture.

### Two-hand canonicalization (`src/lib/canonicalizeHands.ts`)

MediaPipe returns hands in arbitrary order with `Left`/`Right` labels. To compare gestures consistently, hands are sorted into `[Left, Right]` slots, each normalized per-hand (palm-center translation + scale by wrist→middle-MCP distance), then concatenated into a length-126 vector. Missing hands are zero-padded — cosine similarity then naturally produces low scores when the user shows one hand against a two-handed snapshot, which is the correct behavior.

If you change the vector layout, you **must** invalidate any saved snapshots in `localStorage` (`signify.recorder.snapshots.v1`) and `src/data/snapshots.ts` — the score is meaningless across layouts.

### Gesture library workflow

`src/data/snapshots.ts` exports the baked-in `GestureSnapshot[]`. It starts empty. The `/record` route is the tool the user runs to populate it:

1. Capture poses (Space or button) → `localStorage`
2. Click "JSON 복사" → array on clipboard
3. Paste into `snapshots.ts` to bake in for production

This means `snapshots.ts` is **data, not code** — expect it to be edited by hand-paste, not refactored.

### Throttling rationale

Inference runs every animation frame (the overlay needs it for smoothness). Matching runs every **3rd** frame (~20Hz) — invisible to the viewer but halves the cosine work over a growing library. `useGestureMatcher` enforces this with a frame counter; do not replace with `setTimeout` (drifts under tab-throttling).

The matcher also debounces state updates: identical idle-results and same-label match-results within 0.005 score delta don't cause re-renders. This is what keeps the right-pane typography stable when the score wobbles around the 0.85 threshold.

## Styling rules

- **CSS Modules + CSS variables only.** No Tailwind, no styled-components, no utility-first frameworks. This is intentional — the UI is meant to be tweaked visually on set without recompiling a design system.
- One `Component.tsx` ↔ one colocated `Component.module.css`. camelCase class names (`vite.config.ts` has `localsConvention: 'camelCaseOnly'`).
- Global styles are exactly two files: `src/styles/theme.css` (CSS variables) and `src/styles/reset.css`. Both imported once in `main.tsx`.
- The "cinematic" look is typography (large clamp font sizes, tight letter-spacing, warm off-white on near-black) plus a single accent color. Do not introduce gradients, shadows, or animations unless the user explicitly asks.

## TypeScript conventions

- Strict mode + `noUncheckedIndexedAccess`. Landmark arrays are accessed by numeric index a lot — `lm[0]` is `Landmark | undefined`. Use non-null assertions (`!`) only when a length check has already proven the access is safe (e.g. `if (lm.length !== 21) return lm`).
- Path alias: `@/*` resolves to `src/*` (configured in both `tsconfig.app.json` and `vite.config.ts` — keep them in sync).

## Common pitfalls

- **Model load takes 1–3 seconds on cold start.** The `status === 'loading'` UI in `useMediaPipe` is required, not optional — without it the page looks frozen on take 1.
- **MediaPipe model file must exist at `public/models/hand_landmarker.task`** (~7.8MB, gitignored or handled out-of-band). If missing, `HandLandmarker.createFromOptions` throws and the camera works but no landmarks ever appear.
- **Camera permission denied is unrecoverable in-page.** Browsers do not re-prompt; users must fix it in site settings. The `useCamera` error state surfaces this with explicit copy.
- **Override key handler ignores `<input>` and `<textarea>` targets** so the recorder's label input still works. If you add any new editable element, verify it is not swallowed.
- **Video is mirrored** (`transform: scaleX(-1)` in `ViewportPane.module.css`) so users see themselves naturally. The `LandmarkOverlay` SVG mirrors landmarks at draw time (`x1={1 - p.x}`) to match. Keep both in sync if you change one.

## Out of scope (do not add unless asked)

No tests, no CI, no error monitoring, no i18n framework, no state library, no router beyond the two existing routes, no PWA, no service worker. This is a focused single-purpose tool — resist the urge to generalize.
