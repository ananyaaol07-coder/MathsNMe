# IB Mathematics section

Entry: `/topics/ib-mathematics`. Cards cover grades 3–12. A child automatically receives their registered grade and the immediately previous available IB grade. For example, Grade 6 receives Grades 5 and 6; Grade 3 receives only Grade 3 because Grade 2 is outside this section. Other grades require an approved `ibGradeRequests/{uid}_{grade}` record.

The two automatic grades have different learning modes:

- **Current grade:** no chapter tests. Every exercise must be cleared in sequence to complete a chapter.
- **Previous grade:** each chapter begins with a chapter pre-test. It opens the exercises. After clearing every exercise, the child takes the chapter post-test to complete the chapter.
- **Other admin-approved grades:** use the current-grade exercise flow. Chapter tests are reserved for the immediately previous grade.

## Curriculum structure

The route is `/topics/ib-mathematics/{grade}/{module}/{chapter}/{exercise}`. There are no topic nodes. Each `ibCurricula/{grade}` document stores an ordered `modules` tree with three depths: module → chapter → exercise. Exercise children must be empty.

```json
{
  "modules": [
    {
      "id": "module-1", "title": "Module 1", "children": [
        {
          "id": "chapter-1", "title": "Chapter 1", "children": [
            { "id": "exercise-1", "title": "Exercise 1", "children": [] }
          ]
        }
      ]
    }
  ]
}
```

IDs use lowercase letters, digits or hyphens and must remain stable once progress exists. Until content is configured, each grade shows 3 modules, 6 chapters per module and 3 exercises per chapter. These are structural placeholders rather than syllabus content.

## Exercise assessment flow

Each exercise directly contains a pre-test, worksheets 1–10 and a post-test.

1. Passing the pre-test clears the exercise; its worksheets remain available as optional practice.
2. Failing the pre-test requires all ten distinct worksheets, then the post-test.
3. Failing the post-test starts a fresh practice round and clears that round's worksheet checklist.
4. Passing the post-test clears the exercise and unlocks the next exercise.
5. In the current grade, clearing every exercise completes the chapter and unlocks the next chapter.
6. In the previous grade, clearing every exercise unlocks the chapter post-test.

All modules remain independently accessible. Chapters and exercises unlock sequentially within their parent.

## Activity documents

`ibActivities/{grade}_{module}_{chapter}[_{exercise}]_{activity}` stores published content. Activities are `chapter-pre-test`, `chapter-post-test`, `pre-test`, `post-test`, and `worksheet-1` through `worksheet-10`.

Chapter-test questions must collectively cover every exercise ID in that chapter using the question's `coverage` field. Exercise activities do not need `coverage`. Every test has a fixed minimum score of **90%**. Accuracy and time limits remain independently configurable for each test; worksheets have no pass criteria.

```json
{
  "published": true,
  "title": "Chapter 1 test",
  "criteria": { "minAccuracy": 90, "maxSeconds": 600 },
  "questions": [
    { "id": "q1", "prompt": "2 + 2", "answer": "4", "points": 2, "coverage": "exercise-1" }
  ]
}
```

The accuracy and timing values above are illustrative. Any stored `minScore` value is ignored and the application uses 90%. Score is earned marks divided by total marks; accuracy is correct answers divided by total questions. The 90% score, configured accuracy, and configured time thresholds must all be met without rounding.

## Persistence and security

Progress is stored at `ibProgress/{uid}/grades/{grade}` under `nodes`, keyed by module/chapter/exercise path. Existing topic-depth progress and old `exercise-test` activities are no longer used. Assessment attempts remain in `ibSessions/{id}`.

Grade permission and prerequisites are checked server-side. The API does not accept client-provided pass flags, scores, durations or completion status. Deploy the Firestore rules before launch and keep IB collections denied to direct client writes.
