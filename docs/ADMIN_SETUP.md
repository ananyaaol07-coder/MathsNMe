# MathsNMe admin setup

The admin login is `/admin/login`; the dashboard is `/admin`. The displayed username is always **Admin**. Firebase authenticates a dedicated email/password account behind that username. Never put a password in the source, an environment variable, or a chat message.

## One-time setup

1. Open the Firebase Console for the same project used by this website. In **Authentication → Users → Add user**, create a dedicated admin account using an email address you control and a strong password you choose privately. Do not create this account through the student registration form. Copy its Firebase **UID**.
2. In the project's existing **Cloud Firestore → Data** (the default database), create collection `admins` and a document whose ID is exactly that UID. Add field `active`, type **boolean**, value **true**. Only a trusted project owner should do this in the Console. An email or a student profile role does not grant admin access.
3. In `.env.local`, add `NEXT_PUBLIC_ADMIN_EMAIL=` followed by that account's email. This email is public configuration, not a secret. **Do not add the password.** Use the same variable in the hosting environment and rebuild when deploying.
4. Review and publish the root `firestore.rules` file using **Cloud Firestore → Rules** in that same project. The browser cannot grant itself admin rights. Without these rules, the dashboard will remain inaccessible. The rules retain student self-profile reads and registration, allow active admins to read students, and protect private review notes. They also prevent students from changing their own learning placement. Future test/worksheet scoring must use trusted backend writes.
5. Restart the development server, visit `/admin/login`, and enter the password you set. The username stays `Admin`.

## Verify before sharing

- Confirm student registration still creates a valid profile.
- Confirm a student can access their own profile but cannot list students, read another student's profile, read admin reviews, or grant admin rights.
- Confirm Admin can list students, combine filters, review a student, save notes, reload, and see those notes persist.
- Confirm setting `admins/{uid}.active` to false removes admin access.
- Confirm a wrong password and an ordinary student account cannot open the dashboard.

The Firebase CLI was unavailable during implementation, so database edition, deployed rules, and live authentication were not verified. Security Rules are a prototype pending emulator/live verification. No remote accounts or database settings were changed.

## Password changes

Manage the dedicated account in Firebase Authentication. For a forgotten password, use the site's existing student login page's **Forgot password** action with the dedicated admin email; this sends Firebase's reset email to that inbox. Continue signing in through `/admin/login` afterwards. Disabling/deleting the account or setting its admin record to inactive revokes access.

## Current scope

The dashboard reads registered student profiles and filters locally by name/email, grade, board, level and pre-test status. It sorts by registration date, name or level and displays 20 rows per page. All student profiles are loaded for accurate filters and counts; for a substantially larger roster, add server-side paging/search.

Review notes and the reviewed checkbox are saved separately in `adminReviews/{studentUid}`. The displayed level is the single current level already stored on each profile. Scores, submissions, and per-programme levels are not invented or generated. Review notes are not student-visible. The dashboard does not change a student's level or account.

## Current project connection

The website uses Firebase project `maths-n-me`. The fixed Admin username maps to `mathsnme2020@gmail.com` through local environment configuration. Password verification uses Firebase Authentication. Student registration creates `users/{uid}` automatically; student pages and the admin dashboard read that same collection. No placeholder user document is necessary. The admin account remains in Authentication and `admins/{uid}`, not in the student list.
