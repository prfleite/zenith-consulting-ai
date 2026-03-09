

# Recommended Next Improvements

## Priority 1 — Fix Active Console Warnings
The `forwardRef` warnings on every lazy-loaded page are caused by how pages are exported. Each page uses `export default function PageName()` but React.lazy expects a default export that's a proper component. This is a cosmetic warning but pollutes the console on every navigation.

**Fix:** Wrap each lazy page export or suppress via proper component declarations.

## Priority 2 — Dark Mode Toggle
The `ThemeContext` was referenced in earlier batches but never wired into `App.tsx`. Users currently have no way to toggle dark/light mode.

**Implementation:**
- Create `src/contexts/ThemeContext.tsx` (if not present) with localStorage persistence
- Add `ThemeProvider` to `App.tsx`
- Add Sun/Moon toggle button in the AppLayout header bar
- The CSS variables in `index.css` already support dark mode via the `.dark` class

## Priority 3 — Onboarding Tour (First Visit)
New users see 22+ pages with no guidance. A guided tour on first login would dramatically improve adoption.

**Implementation:**
- Use `react-joyride` (lightweight)
- 5 steps: Dashboard overview → Clients → Projects → AI Insights → Settings
- Store `onboarding_completed` in localStorage
- "Skip tour" button

## Priority 4 — Presence Indicators (Who's Online)
Real-time collaboration indicators showing which team members are currently viewing a project/page.

**Implementation:**
- Use Supabase Realtime Presence API
- Show avatar bubbles on ProjectDetail pages
- "Maria is viewing this project" tooltip

## Priority 5 — PDF/Excel Export Buttons in Key Pages
The `exportPDF` and `exportExcel` utilities exist but aren't wired to buttons in most pages.

**Pages to add export buttons:**
- `/clients` — Export client list to Excel
- `/timesheets` — Export timesheet data to Excel/PDF
- `/billing` — Export invoices to PDF
- `/reports` — Export generated reports to PDF

## Priority 6 — Automated Weekly Email Report
Edge function that compiles weekly KPIs (hours logged, revenue, pipeline) and sends via email.

**Implementation:**
- Edge function `send-weekly-report`
- Uses Resend API (requires API key)
- Toggle in Settings → Notifications

## Priority 7 — Security Hardening
- Run a security scan on RLS policies
- Ensure all tables with user data have proper row-level security
- Add rate limiting considerations for edge functions

## Summary of Recommendations (ordered by impact)

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Fix forwardRef warnings | Low | Clean console |
| 2 | Dark mode toggle | Medium | UX polish |
| 3 | Onboarding tour | Medium | User adoption |
| 4 | Presence indicators | Medium | Collaboration |
| 5 | Export buttons on all pages | Low | Functionality |
| 6 | Weekly email reports | High | Automation |
| 7 | Security scan + RLS review | Medium | Security |

I recommend starting with items 1-3 as they have the highest impact-to-effort ratio. Want me to implement any of these?

