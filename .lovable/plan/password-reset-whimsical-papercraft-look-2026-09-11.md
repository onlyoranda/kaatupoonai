# Password reset + Whimsical Papercraft look

## 1. Forgotten password

Add a way to get back into an account when the password is lost.

- On the sign-in card: a "Forgot password?" link that opens a small form asking for the email, then sends a reset link and shows "Check your email".
- A new page at `/reset-password` where the link lands: enter a new password twice, save, then go straight into the app.
- The reset page is public (no sign-in needed) and handles the recovery link arriving from the email.

Note: reset emails currently go out with the default sender. If you want them branded with the app name, say so and I'll set that up too (needs an email domain).

## 2. Whimsical Papercraft template

Rework the look of the site to the direction you picked, applied across the home, sign-in, library, and story pages so it feels like one app:

- Soft cream paper background, white cards with dashed cut-out borders and gentle drop shadows.
- Rounded friendly headings with a hand-drawn wavy underline on the main title.
- Bright, flat colour tiles for the choice buttons (art style, language, voice, length, age) with a slight tilt and lift on hover.
- Chunky pill-shaped main button with a bold accent colour.
- Floating paper circles and confetti-ish shapes as light decoration.

## 3. 90s cartoon doodle background

A repeating, very light sketch layer sitting behind everything on every page: simple black-line doodles in that Saturday-morning-cartoon spirit — a boombox, a TV set, a skateboard, a rocket, a star, a lightning bolt, a smiling cloud, a cassette tape, a paper plane, a squiggle.

- Drawn as a subtle tiled pattern so it never competes with the text.
- Sits behind the content, fixed so it stays put while scrolling.
- Doodles are original simple sketches, not copies of any existing cartoon characters.

## Technical notes

- `src/routes/auth.tsx`: add reset-request mode calling `resetPasswordForEmail` with `redirectTo: ${origin}/reset-password`.
- New public route `src/routes/reset-password.tsx` using `supabase.auth.updateUser({ password })`, with its own `head()` metadata.
- `src/styles.css`: retune the token palette to the papercraft direction, add `paper-card` / `doodle-bg` utilities, and an inline SVG data-URI tiled doodle pattern on `body::before`.
- Update `src/routes/index.tsx`, `_authenticated/library.tsx`, `_authenticated/story.$storyId.tsx` styling only — no changes to story generation logic.
