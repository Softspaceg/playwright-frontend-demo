# The report format — settled, not reinvented

`report-template.html` is the agreed shape of a QA report for one tab. Copy it, fill the
`{{placeholders}}`, delete the blocks you do not need, build it. **Do not design a new
report per tab.** A format the engineers have learned to read is worth more than a nicer
one they have to learn again.

Agreed with Zainab, 30 Sep – 1 Oct 2026.

## Making one

```bash
cp reports/_template/report-template.html <scratchpad>/<tab>-report.html
# fill it in, then:
node scripts/build-report.mjs <scratchpad>/<tab>-report.html reports/<module>/<tab>-v<N>
```

`build-report.mjs` inlines the screenshots as data URIs, copies `evidence/` beside the
page, redacts session tokens out of every HAR, and leaves traces out. The result is one
folder you can hand over whole.

Earlier versions are never overwritten. `departments-v2` stays when `departments-v3` is
built, so two versions can be compared in a meeting.

## The seven tabs

| Tab | Holds | Addressed to |
|---|---|---|
| **For developers** | Defects **and** shortcomings | Frontend & Backend |
| **Enhancements** | Correct behaviour that could be pleasanter | Frontend & Product |
| **For business** | Questions **and** recommendations | BA & Product |
| **What we need** | Cases blocked until someone provides something | Named per row |
| **Performance** | Measured response times, and inferences labelled as inferences | Backend |
| **What was tested** | Coverage, the failures in full, how to re-run | QA |
| **API reference** | Confirmed endpoint behaviour, and how to open the evidence | Everyone |

## How a finding is classified

Decided once, so it is not argued about per report.

| | What it means |
|---|---|
| **Defect** | The product does something wrong: loses data, shows something untrue, or offers an action that cannot succeed. A failing test always means one of these. |
| **Shortcoming** | Nothing produces a wrong value, but something a user is entitled to expect is not there. **Not optional.** Sits in the developers tab under the defects. |
| **Enhancement** | The behaviour is correct and complete; this would make it pleasanter. Genuinely optional. |
| **Question** | Nobody has settled the rule, so QA cannot say the behaviour is wrong. Never in the defect list. |
| **Recommendation** | QA already has an opinion. Product accepts or rejects it. Never becomes a test assertion. |

The test for shortcoming versus enhancement: **does the product already do this somewhere
else, one click away?** Archive not confirming while Delete does, in the same menu, is a
shortcoming. A missing loading spinner is an enhancement.

## Rules the report follows

- **Explain the problem and give our reading. Do not prescribe the fix.** "The API named
  the field and the screen discarded it, which points at frontend error handling" — not
  "render `detail.errors[].detail` in the field". The team owns the fix; we own the
  evidence.
- **Each finding appears in exactly one place.** If it is a defect it is not also an
  enhancement and not also a question.
- **Quote the wire, never memory.** Request and response bodies come out of the HAR.
  Archive was written up as returning "Archived successfully." for a week; it returns
  "Department updated successfully."
- **Anything found by hand says so on its card.**
- **A claim with no evidence says it has none**, rather than attaching a file that does not
  show it.
- **Inferences are labelled.** "Hypothesis, not a finding."
- **The numbers match the run.** Header counts, tab counts and the coverage table are the
  same numbers.
- **Nothing is dropped silently.** A case that cannot be tested goes in *What we need*,
  stays in the plan, and keeps being counted by `npm run coverage`.

## Mechanics the template already handles

Leave these alone unless there is a reason:

- **Findings start closed.** The whole list of problems fits on one screen; each person
  opens the one they own.
- **The `.wire` block** carries method, path, status, duration, request body, response
  body — so nobody has to open the HAR to reproduce.
- **The `.own` boxes** split the work by team at the top of the finding.
- **Screenshots are ringed in red** and the rest dimmed, with a numbered caption saying
  what the marked area proves. `annotatedShot` in `fixtures/evidence.ts` produces them;
  `absenceShot` is for when the defect is that nothing appeared.
- **Copy for Odoo** turns a finding into plain text, evidence filenames included.
- **Dark mode** works. The page has no external dependency except the fonts.

## Before you call a report finished

- [ ] Every number in the header matches the run it describes
- [ ] No finding appears in two tabs
- [ ] Every request and response is quoted from a recording, not remembered
- [ ] Hand-found findings are labelled
- [ ] Inferences say they are inferences
- [ ] Every blocked case is in *What we need* with a named owner
- [ ] Rendered in a browser: tabs switch, findings open, images load, evidence links
      resolve, copy buttons produce text
