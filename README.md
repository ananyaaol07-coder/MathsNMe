# MathsNMe

A Next.js learning platform for Vedic Maths, IB Mathematics, and structured practice.

## Included

- Responsive white-and-gold homepage, learning roadmap, and replayable HCF demo.
- Firebase email/password authentication and student registration.
- Student dashboard and topic interface.
- Admin student search, filters, and review notes.
- Parent webinar registration, reserved time slots, admin completion reminders, and Gmail notification queue (requires server setup).

Some topic, level, worksheet, and pre-test routes remain starter placeholders. Automated weekly reports and diagnostic delivery are not implemented.

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and fill in your Firebase web app configuration.
3. Configure Firebase Authentication and Firestore. See [admin setup](docs/ADMIN_SETUP.md) for admin access and security-rule setup.
4. Run `npm run dev` and open http://localhost:3000.

Never commit `.env.local`, service-account credentials, or passwords. Firebase web configuration is public client configuration; Firestore rules control data access.

## Checks

```sh
npm run lint
node --experimental-strip-types --test tests/admin-students.test.mjs
npm run build
```

If your environment restricts Turbopack worker processes, use `npm run build -- --webpack`.

## Production

Set the environment variables in your hosting environment before building. Review and validate `firestore.rules` before publishing them. Production startup uses `npm run build` followed by `npm start` on a compatible Node.js host.

## Webinar-first enrollment

Register opens `/signup` with the webinar poster and booking form. New learners attend a webinar, receive a payment QR through WhatsApp, and pay the country-based fee. Admin verifies receipt, then the server creates the child’s account with a random password and emails credentials to the parent. Existing student access is preserved.

See [setup and launch requirements](docs/WEBINAR_SETUP.md) for Firebase credentials and rules, Gmail notifications, manual WhatsApp QR sharing, encrypted credential delivery, and the reminder scheduler. These integrations require configuration before public use.

Daily practice commitment, streak/coin rules, worksheet schema, and scheduler setup are documented in [Practice setup](docs/PRACTICE_SETUP.md). XP scoring is proposed there and is not enabled yet.
