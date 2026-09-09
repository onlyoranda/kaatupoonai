# Cartoon Story Maker

Turn a written idea into a long, child-friendly animated story with narration and sound, in a 90s cartoon look.

## One important reality check

Today's AI video tools generate clips of about 5-10 seconds each. A true 12-15 minute fully-animated film would mean roughly 100+ separate clips per story — that would cost hundreds of dollars and take hours for a single story, and the characters would drift and look different from scene to scene.

So the plan builds the length you want a different way:

- The story (12-15 minutes of narration) is written by AI and read aloud by a warm, child-friendly narrator voice.
- Each scene gets a hand-drawn-looking 90s cartoon illustration, with slow gentle camera motion (pan/zoom) so it feels animated rather than static.
- A handful of key moments — the opening and a few highlights — are generated as real animated clips.
- Ambient sound and gentle sound effects run underneath.

Result: a full-length 12-15 minute cartoon story that stays affordable and keeps characters looking consistent. If you later want more moving scenes, the number of animated clips per story can be raised.

## What the user does

1. Types an idea ("a shy dragon who is afraid of fireworks").
2. Picks a cartoon style: 90s Saturday-morning 2D, 90s anime, 90s claymation-look, or 90s comic-book.
3. Picks a narrator: Indian English or Coimbatore Tamil, and a male, female, or child voice.
4. Picks a length (short ~5 min / full ~12-15 min) and an age band, so the tone stays gentle and child-safe.
5. Presses Create. A progress panel shows each step: writing the story, casting the characters, drawing scenes, recording narration, assembling.
6. Watches the finished story in a player with chapter markers, and downloads it.

## Narration voices

Two language flavours, each with three voice types:

- Indian English — male, female, child.
- Coimbatore Tamil — male, female, child. The story text itself is written in Tamil with everyday Kongu/Coimbatore phrasing (not formal literary Tamil), so the narration sounds local rather than textbook.

The voice choice is set once per story and stays the same across every scene. A short sample can be previewed before generating the full story, so nobody waits 15 minutes to find out the voice was wrong.

Note: the child voice is an adult voice steered to sound young and bright, not an actual child recording. If it doesn't feel convincing enough, the alternative is a higher-pitched female voice presented as the "young narrator".


## Safety

Every idea is checked before generation, and the story-writing instructions enforce no violence, no scary imagery, no unsafe behaviour, and a warm resolution. Blocked ideas get a friendly explanation.

## Saving and password protection

- Download is always available.
- "Save to my library" is optional. Saved stories live behind a login (email + password), and each person only ever sees their own.
- Nothing is public.

## Character consistency

Characters and settings are described once at the start of each story ("a round-cheeked dragon with teal scales, 90s cel-animation look, thick outlines, flat colours") and that exact description is reused in every scene image, so the cast stays recognisable throughout.

## Build order

1. Home page: idea box, style picker, length and age controls.
2. Story generation: script split into scenes, each with narration text, image description, and sound notes.
3. Scene illustrations in the chosen 90s style.
4. Narration audio per scene.
5. Player that plays scenes in sequence with motion, narration, captions and ambience.
6. Downloadable single video file.
7. Accounts and private library.
8. Animated clips for the highlight scenes.

## Technical notes

- Lovable Cloud provides the login, the story/scene database, and storage for images, audio and finished videos. All records owner-scoped with RLS; media in a private bucket served via signed URLs.
- Story script: Lovable AI Gateway chat model returning a strict scene schema (narration, image prompt, sound cue, duration estimate).
- Images: AI Gateway image generation, one per scene, shared character/style prefix in every prompt.
- Narration: AI Gateway text-to-speech per scene, stored as audio files.
- Highlight clips: AI Gateway video generation (`google/gemini-omni-1.1-flash`), a small fixed number per story, created sequentially and stored immediately (gateway URLs expire).
- Generation runs as a job: each stage is a server function, the client polls and renders progress, and partial results are saved so a story resumes rather than restarting.
- Playback is a timeline in the browser (images + motion + audio). The downloadable single file is rendered in-browser from that same timeline.
- Cost guard: a confirmation step showing the estimated cost before a full-length story starts, and generation only ever fires from an explicit button press.
