# Daily commitment and practice

After login, a learner must choose a daily time and IANA time zone, and acknowledge the reward rules. The commitment starts on the next local calendar day. Learners cannot move the time to escape a missed window; schedule editing is intentionally not exposed yet. Administrators can review a requested change separately.

A successful day means **submitting a fully answered, published worksheet** within 10 minutes before or after the scheduled time. Server receipt time is authoritative; opening the page or starting a worksheet does not qualify. Correctness is recorded but is not a condition for the commitment bonus. Boundaries are inclusive. Extra practice stays available at all times.

- First qualifying completion each day: +70 coins and +1 streak day.
- No qualifying completion when the window closes: −20 coins, floored at zero, and streak reset to zero.
- Early practice does not incur an immediate penalty; a later on-time completion can still qualify.
- Extra practice after an earned daily bonus does not remove that bonus or streak.
- Missing multiple days deducts once per day, including days spent offline. The next successful day restarts the streak at 1.
- A retry of the same completed session returns its recorded result without another reward or worksheet count.
- Cross-midnight windows belong to the date of the scheduled time. For DST, repeated local times use the first occurrence; nonexistent local times shift forward by the clock gap.

## Launch requirements

Use the existing Firebase Admin credentials and deployed default-deny rules. New collections are accessible only through authenticated server routes. These changes do not deploy Firebase rules or create production content.

**Publish real worksheets before enabling commitments for students.** The previous worksheet routes were Next.js placeholders. This implementation supplies a listing and answer/submission flow, but does not fabricate or publish curriculum content. A worksheet is stored in `practiceWorksheets/{id}` with the following server-managed schema:

```json
{
  "title": "Teacher-approved worksheet title",
  "topicId": "vedic-maths",
  "levelId": 1,
  "published": true,
  "questions": [
    { "id": "q1", "prompt": "2 + 2", "answer": "4" }
  ]
}
```

This is a schema example, not a published lesson. IDs must use letters, digits, underscores or hyphens. Publish 1–100 questions with unique IDs. The first release uses short text/numeric answers, normalized for whitespace/case and decimal numeric values. It does not evaluate algebraic equivalence, fractions or proof-based questions. Questions and answer keys are copied into a private session at start, so changing the source cannot change grading mid-session. The client never receives answer keys. Listing is capped at 100 published worksheets; add pagination before growing the catalogue beyond that limit.

The dashboard’s **Practise now** opens `/dashboard/practice`. Topic level and worksheet routes use the same flow. Existing pre-test/placement pages are outside this change and remain unfinished. Starting a session requires a commitment but does not restrict practice to the time window. Sessions expire after 24 hours. Refreshing or leaving a worksheet currently discards the browser's answers; do not reload before submission.

Schedule authenticated `GET /api/cron/practice` every minute with `Authorization: Bearer <CRON_SECRET>`. Each call processes up to 100 overdue commitments; repeat if `moreMayRemain` is true. Dashboard and completion requests also reconcile overdue days, so missed-day deductions are correct even after scheduler downtime. No live scheduler was configured by this change.

Server collections:
- `practiceCommitments/{uid}`: fixed schedule, next unsettled date/deadline, streak, coin balance, success/miss counts and completed worksheets.
- `practiceSessions/{id}`: owner UID, source worksheet ID, private snapshot, submitted answers, timestamps and immutable result.

Rewards and missed-day reconciliation use Firestore transactions, preventing concurrent requests from rewarding or penalizing the same commitment twice. Client profile writes cannot change these counters. Keep these collections denied to direct client writes. Add session rate limiting/retention before a broad launch.

## XP proposal — not enabled

Keep XP separate from spendable coins and punctuality:
- 20 XP for completing a new worksheet.
- 5 XP per correct answer on that first completion.
- 10 XP bonus for at least 80% accuracy; 20 XP instead for 100%.
- No XP deductions for missing the time window. Learning at any time earns XP.
- Repeating the same worksheet should earn XP only for newly corrected answers, once each, to prevent farming.

Confirm this scoring model before enabling it. Current XP remains unchanged; weekly minutes and aggregate accuracy are also still placeholders from the existing dashboard. The new live counters are streak, coins and completed worksheets.

## Verification

Run `node --experimental-strip-types --test tests/*.test.mjs`, `npx tsc --noEmit`, and ESLint on the changed files. Unit tests cover inclusive/exclusive boundaries, midnight, fractional time zones, DST, consecutive days, offline misses, duplicate daily rewards, zero-floor balances, required answers and grading. Firebase transactions, authenticated end-to-end flows and cron delivery need staging verification with configured credentials/content.
