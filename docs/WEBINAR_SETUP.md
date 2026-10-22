# Registration, webinar, payment and access

## User journey

`Register` opens `/signup`, which contains the white-and-gold webinar poster and booking form. `/webinar` redirects there. The separate downloadable poster and webinar navigation entry have been removed.

1. Parent books a one-to-one, 60-minute Zoom webinar. No account or payment is created at booking.
2. Admin sends the Zoom link manually. All times are IST: 06:00, 07:00, 18:00, 19:00, 20:00.
3. After the scheduled end, admin confirms attendance and marks the session done.
4. In Payments or the completed webinar, admin clicks **Open WhatsApp to share QR**. A chat with the parent’s registered number opens with a prepared payment message. Admin attaches the appropriate QR image from their device and presses Send in WhatsApp. Opening the chat does not record delivery. India fee: ₹1,000; other countries: US$25, using an appropriate international QR.
5. Parent pays and sends their receipt/reference to admin on WhatsApp. Admin checks the bank account, then clicks **Verify payment & email credentials** and enters the bank reference.
6. The server generates a random password, provisions the child’s account using the student email (parent email when shared at registration), and emails credentials only to the parent. It does not mark the learning policy as accepted on their behalf.
7. If account provisioning or email fails, the admin uses **Retry account & credential email**. The private enrollment link now displays status only. Existing active accounts retain access.

## Availability and reminders

Availability refreshes every 10 seconds and is checked atomically again on submission. Reserved slots stay red until admin marks them done. Completed slots turn green, labelled Completed, and remain disabled. Unbooked past slots are grey and disabled. A slot on a different date is independent.

The admin dashboard shows a reminder at the scheduled end. A persisted notification job also emails rameshaol@gmail.com when the scheduler next runs. This is based on scheduled end time, not detection of the actual Zoom meeting ending. The registration notification goes to the same address.

## Required launch configuration

Payment QR sharing is manual and requires no WhatsApp Business API, approved template, or hosted QR URL. Keep the correct merchant QR images on the admin’s device and check the recipient and currency before sending.

- Set Firebase server credentials privately: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, or Application Default Credentials on Google hosting. Never commit credentials or paste private keys in chat.
- Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` on the server. Google requires 2-Step Verification for App Passwords; some managed accounts prohibit them. [Google setup](https://support.google.com/mail/answer/185833), [Nodemailer Gmail guide](https://nodemailer.com/guides/using-gmail).
- Generate `ENROLLMENT_CREDENTIAL_KEY` with `openssl rand -hex 32`. Store it as a server secret and keep it stable until all pending credential emails finish. Never commit it.
- New Razorpay orders and parent-controlled account activation are disabled. Legacy callbacks/webhooks record captured payments as awaiting admin review; they do not create accounts.
- Set `NEXT_PUBLIC_SITE_URL` and a strong random `CRON_SECRET`. Configure a server scheduler to call `GET /api/cron/webinar-notifications` every minute with `Authorization: Bearer <CRON_SECRET>`. Keep the scheduler running when the dashboard is closed.
- **Deploy the updated `firestore.rules` before opening registration.** Client-side creation of `users` must be disabled. Otherwise a user could bypass the new server-only provisioning path using the old public Firebase API. Existing profile reads and permitted updates remain available. Webinar, invitation, payment mapping and notification collections remain denied to browser clients under the default catch-all.

Rules are a prototype pending emulator/staging verification. No remote rules, credentials, merchant settings or scheduler have been configured by this implementation.

## Data and retry behavior

- `webinarRegistrations/{requestId}` stores private booking data, status, order/payment details and account activation audit.
- `webinarSlots/{date_time}` is the unique reservation lock.
- `webinarLimits/{hashedParentEmailAndDate}` allows one booking per parent email per date.
- `webinarNotifications/{id-kind}` stores notification jobs. A lease prevents concurrent sends; failed jobs retry. SMTP is at-least-once: an interruption after Gmail accepts a message but before delivery is recorded can cause a duplicate.
- `webinarInvites/{hashedToken}` maps a private 256-bit invitation token to a registration. The token is in a URL fragment, then sent through a request header, not a query string. Treat the link as private. It cannot approve payment or create an account.
- `webinarOrders/{orderId}` maps verified webhook orders to registrations.
- `users/{uid}` is provisioned only after payment. New accounts carry an immutable `enrollmentId`.

`enrollmentCredentials/{bookingId}` is a server-only outbox containing an AES-256-GCM encrypted random password and a processing lease. Successful email acceptance removes the encrypted credential. Admin retries reuse the same password without resetting an existing account. A deterministic UID prevents duplicate accounts; another account owning the same email requires admin resolution. Approval stores the verifying admin, timestamp, and bank reference.

WhatsApp sharing happens manually outside the website; the website does not track whether the message or QR was sent. SMTP is an at-least-once external operation: provider acceptance followed by a database failure can lead to a duplicate email on retry. Failed credential emails require admin retry; the cron handles webinar notifications only.

No cancellation/rescheduling, refunds, recurring billing, or automatic refund-based access revocation is implemented. Admin lists the latest 500 registrations; older records remain stored. Configure public endpoint rate limits/CAPTCHA before broad launch; the current form has validation, a honeypot and a per-parent/date booking limit, not identity verification.

## Verification

Local checks cover input validation, IST dates, contact reuse, fee selection, signature validation and exact captured-payment matching. Live concurrent Firestore bookings, manual WhatsApp sharing, admin payment approval, email delivery, account provisioning and deployed rules require staging validation with configured credentials. No real payment or email was initiated during development.

The dependency audit previously reported Next.js and Firebase/transitive advisories. Resolve and retest those before public deployment; do not blindly apply a suggested breaking Firebase downgrade.
