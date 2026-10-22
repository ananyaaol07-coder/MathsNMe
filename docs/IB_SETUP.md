# IB Mathematics section foundation

Entry: `/topics/ib-mathematics`. Cards cover grades 3–12. Registered grade comes from the server profile; other grades need an approved `ibGradeRequests/{uid}_{grade}` record. Admin's **IB grade requests** tab approves or declines pending requests with reviewer/time audit. Repeated pending requests are idempotent. Declined requests require contacting admin; resubmission/reconsideration UI is not implemented.

**Deploy the updated Firestore rules before launch.** Grade was previously a client-editable profile field. It is now immutable to students so it cannot be changed to bypass grade access. All new IB collections remain client-inaccessible under the existing default-deny rule. No remote rules deployment was performed.

The optional catch-all page handles:

`/topics/ib-mathematics/{grade}/{module}/{chapter}/{exercise}/{topic}`

Each stage reads `/api/ib?path=...`. Grade permission and every ancestor's prerequisite are checked on the server. All modules are available. Chapters, exercises and topics unlock sequentially within their parent. A chapter is complete only after its chapter test is passed; an exercise requires its exercise test to be passed. Completing child items makes the parent retest available, but never automatically completes the parent. Empty containers never count as complete.

## Curriculum content

Add each grade's ordered tree to `ibCurricula/{grade}` under `modules`. Array order is learning order. Each node has a unique sibling `id`, `title`, and `children`. Depths: module → chapter → exercise → topic. Topic children are empty. IDs use lowercase letters, digits or hyphens and must remain stable once progress exists.

Structural example, **not an authored syllabus**:

```json
{
  "modules": [
    {
      "id": "module-1", "title": "Module 1", "children": [
        {
          "id": "chapter-1", "title": "Chapter 1", "children": [
            {
              "id": "exercise-1", "title": "Exercise 1", "children": [
                { "id": "topic-1", "title": "Topic 1", "children": [] }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Until content is configured, every grade displays numbered placeholder cards: 3 modules, 6 chapters per module, 3 exercises per chapter, and 3 topics per exercise. These are temporary structural counts, not a syllabus. Missing or empty child lists receive the same numbered defaults. Configured titles, IDs, order, and nonempty child lists are preserved. Rename titles while retaining IDs to preserve progress. No database seeding is required. A curriculum editor is not included in this foundation.

## Top-down assessment flow

1. Chapter test first, with questions covering every exercise. Passing clears the chapter and opens the next chapter. Failure opens exercise 1.
2. Exercise test first, covering every topic. Passing clears the exercise and opens the next exercise. Failure opens topic 1.
3. Topic pre-test first. Passing clears the topic without requiring worksheets, and worksheets remain available optionally.
4. Failed pre-test requires completing all ten distinct worksheets (any order), then passing the post-test.
5. Failed post-test clears the current round's worksheet checklist: complete all ten again before retesting. The pre-test cannot be reused as a bypass.
6. Completing every topic enables the exercise retest. Completing every exercise enables the chapter retest. Failed parent retests start a fresh round of their child assessments. Attempt history is retained in sessions.

All modules are independently accessible. Sequential restrictions still apply to chapters, exercises and topics unless a passed ancestor test has already cleared the entire scope; those descendants remain available for optional review.

## Per-test content and criteria

`ibActivities/{grade}_{module}_{chapter}[_{exercise}][_{topic}]_{activity}` holds published content. Activity names: `chapter-test`, `exercise-test`, `pre-test`, `post-test`, `worksheet-1` through `worksheet-10`. The stable path IDs determine the document name.

Example schema (illustrative criteria only, no global 95% default):

```json
{
  "published": true,
  "title": "Chapter 1 test",
  "criteria": { "minScore": 95, "minAccuracy": 90, "maxSeconds": 600 },
  "questions": [
    { "id": "q1", "prompt": "2 + 2", "answer": "4", "points": 2, "coverage": "exercise-1" }
  ]
}
```

Chapter-test questions must collectively cover all exercise IDs. Exercise-test questions must collectively cover all topic IDs. Add questions for every child; the one-question schema example is insufficient for a chapter with multiple exercises. `coverage` is unnecessary on topic activities. Tests require their own criteria; worksheets do not. Questions use the existing short-answer/numeric grader, not symbolic algebra or essay marking. Points must be positive and at most 100 per question.

Score is earned marks / total marks. Accuracy is correct answers / total questions. Passing requires all three score, accuracy and elapsed-time criteria, evaluated without rounding; timing uses server timestamps and includes submission/network time. A reopened test resumes the same session and clock. Content and criteria are snapshotted at start. The configuration currently lives in server-managed Firestore documents, not an admin curriculum editor.

No real assessment content or criteria have been published by this code change. Unconfigured activities show “Being prepared”.

## Persistence and security

Current progress is stored at `ibProgress/{uid}/grades/{grade}` under `nodes`, keyed by full module/chapter/exercise/topic path. Topic state records pre/post passes, worksheet checklist, practice-required flag and revision. Parent state records test attempts and passes. The older placeholder-only `topics.completed` flags do not grant test passes in this flow.

`ibSessions/{id}` contains owner, grade/path, activity, private answer-key snapshot, server start/completion times, submitted answers and immutable result. Duplicate submission returns the stored result. Ancestor/node revision checks reject stale attempts after a remediation round or concurrent progress update. Current node maps are replaced atomically so failed parent tests truly clear descendant progress, while attempt history remains intact.

`POST /api/ib/activities` starts/completes activities and enforces grade access and progression. No client-supplied pass flag, score, duration or completion status is accepted. Completed IB worksheets also feed the existing daily commitment reward transaction; assessments themselves do not award the worksheet commitment bonus. General practice endpoints continue to exclude IB so they cannot bypass these gates.

## Verification

The unit suite covers early skips, direct-path locks, required remediation, distinct worksheet checks, repeated failures, mandatory parent retests, optional practice and independently configurable criteria. TypeScript and targeted lint checks also apply. Authenticated Firestore transactions and actual assessment delivery need staging verification with configured content. Keep all IB collections denied to direct client writes.
