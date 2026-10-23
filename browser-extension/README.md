# Maths n Me Wayground report extension

This development extension watches a completed Wayground result screen, extracts the summary that Wayground renders for the student, and opens the Maths n Me import page. The import page uses the student's existing Firebase sign-in and stores the report in the student's private Reports section.

## Install during development

1. Run Maths n Me with `npm run dev` and sign in as the student.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Select **Load unpacked** and choose this `browser-extension` folder.
5. Complete a quiz on Wayground and stay on the result screen for a moment.

The extension defaults to `http://localhost:3000`. Open its settings to change this to the deployed Maths n Me address. Before Chrome Web Store publication, add the production site to `host_permissions` in `manifest.json`.

The manifest also recognizes the legacy Quizizz and joinmyquiz domains because Wayground continues to support older activity links.

Wayground can change its page markup. The extractor first uses visible result text and then known question-card patterns, so summary capture is resilient while detailed question capture may need selector updates after a Wayground UI change.
