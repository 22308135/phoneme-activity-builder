# Lighthouse accessibility evidence and video notes

**All four assessed pages now score 100/100 in the tested desktop/mobile and light/dark combinations, with no failed automated accessibility audits.** The original reports are retained alongside the rerun so the changes can be demonstrated.

## Before and after

Audited on 17 September 2026. The scores below were the same at both tested viewport sizes: desktop 1280 × 900 and mobile 390 × 844.

| Page | Before: light | Before: dark | After: light | After: dark |
| --- | ---: | ---: | ---: | ---: |
| Home | 100 | 95 | 100 | 100 |
| Dashboard | 96 | 92 | 100 | 100 |
| Wordle builder | 100 | 96 | 100 | 100 |
| Word Search builder | 100 | 96 | 100 | 100 |

There were 16 initial audits and 16 matching reruns. Some initial pages scored 100 while still reporting the unscored accessible-name warning. We reviewed the individual findings, rather than treating the headline score as the whole result. Lighthouse's [scoring documentation](https://developer.chrome.com/docs/lighthouse/accessibility/scoring) explains that some checks do not affect the score.

## Findings and changes

1. **Dark-mode text contrast — `color-contrast`.** White labels on pale green primary buttons and the logo had a measured contrast ratio of 1.90:1. The builders' dark green status labels on dark panels measured 2.38:1. Both were below the audit's 4.5:1 requirement for this text. Primary buttons and the logo now use dark text on the pale background in dark mode; status text uses the lighter theme colour. The same contrast treatment is applied to focused/hovered phoneme keys. This preserves the existing palette while making controls and progress labels easier to read.
2. **Dashboard metric semantics — `definition-list`.** Explanatory paragraphs were placed directly inside the metric groups in a `<dl>`, where only valid `<dt>`/`<dd>` groups belong. Each metric now has a `<dt>` label and separate `<dd>` elements for its value and description. Styling keeps the same layout while providing valid semantic grouping for assistive technology.
3. **Logo link name — `label-content-name-mismatch`.** The custom `aria-label` did not match the visible logo text as evaluated by Lighthouse. Removing that override lets the link's visible brand text supply its accessible name naturally. The decorative phoneme mark remains hidden from assistive technology. This warning was addressed even though it did not lower the numerical score.

The final rerun reported none of these failures in any of the 16 tested page states. The recorded page widths also matched the viewport widths; no whole-page horizontal overflow was observed in these default states.

## Method

The runner used Lighthouse 13.4.1, Puppeteer Core 25.11.0, Chrome 153.0.8010.47 and Node 24.15.0 on Windows. It audited a production build with a temporary seeded SQLite database, an isolated browser profile and a local server on port 3300. Browser preferences and ordinary saved activities were not changed.

Lighthouse's [snapshot mode](https://github.com/GoogleChrome/lighthouse/blob/main/docs/user-flows.md) checks the currently rendered page. It is appropriate here because the dashboard fetches its content after navigation. The runner waits for data and controls to appear, verifies the actual light/dark theme, then audits the rendered state. It captures the accessibility category only; these are not performance scores. Screen emulation is disabled inside Lighthouse so it retains the explicit desktop/mobile viewport set by the runner.

The normal production build, lint checks and all 29 unit/integration tests passed after the changes. Before and after reports contain their build IDs and browser/tool versions; both builds include uncommitted working-tree changes.

## Reports and reproduction

- [Portable before/after evidence archive](evidence/lighthouse-2026-09-17.zip): 32 native HTML reports, matching JSON results, summaries and server logs. Extract and open any `.html` report in a browser.
- [Before: Dashboard in dark mode](../artifacts/lighthouse/2026-09-17T03-24-25-299Z-before/dashboard-desktop-dark.html)
- [After: Dashboard in dark mode](../artifacts/lighthouse/2026-09-17T03-27-37-010Z-after/dashboard-desktop-dark.html)
- [Audit runner](../scripts/run-lighthouse.mjs)

The local links work in this checkout; use the archive to move the evidence to another computer. To repeat the audit after future changes:

```powershell
npm run test:lighthouse -- --label=check
```

Node 22.19+ and an installed Chrome/Chromium browser are required. Set `CHROME_PATH` if the browser is installed outside the detected locations. Port 3300 must be free. Results are saved under `artifacts/lighthouse/`; the runner stops its own server and removes its temporary database and browser profile when finished.

## Suggested video explanation

“I ran Lighthouse accessibility checks on Home, Dashboard and both builders, on desktop and mobile in light and dark mode. It found low-contrast dark-mode labels, incorrect markup in the dashboard's metric lists, and a mismatch in the logo link's accessible name. I corrected the colours and semantics while keeping the design consistent. The rerun scored 100 on all tested pages and themes. I also checked the individual findings because a score of 100 does not mean every accessibility concern has been resolved.”

## Limits

These results cover the loaded default page states, with seeded activities, at the two specified viewport sizes. They do not cover every open menu, validation message, saved configuration, gameplay state or downloaded HTML file. Lighthouse cannot replace manual keyboard, screen-reader and user testing, and a 100 score is not a certificate of WCAG compliance. Its manual-review items remain manual-review items; they have not been reported as passed here.
