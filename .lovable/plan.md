# Stuck 20-scene story: what happened and what to change

## What the check showed

Your story "துருவின் அன்பான குடும்பம்" (20 scenes) is marked failed with the message
"Out of AI credits: Not enough credits". That message came back from the AI service itself,
not from a bug in the app.

The workspace balance right now is 1.10 credits remaining today out of a 5.00 daily allowance,
and the free monthly AI allowance for this billing period is already used. So while the account
does have some credits, there were not enough at that moment to pay for the pictures and
narration of a 20-scene story. A full-length story is the most expensive thing the app can do:
every scene needs one illustration plus one narration clip.

Nothing in the story was lost. The scenes already finished are saved, and the app can pick up
from the last finished scene once credits are available.

## What I propose to change

1. **Honest credit message.** When the AI service says there are not enough credits, the story
   page will say so in plain words: how many scenes are done, that the rest is paused, and that
   it will continue once credits are topped up. No generic "something went wrong".

2. **Pause instead of fail.** A credits stop will mark the story as paused rather than failed, so
   it clearly reads as "waiting to continue", and the Try again button becomes "Continue story".

3. **No wasted retries.** The app currently retries once automatically when the writer fails. On a
   credits stop it will not retry, because a retry cannot succeed and only adds noise.

4. **Warn before a long story.** On the create screen, choosing the full-length option will show a
   short note that a long story uses a lot more AI credits than the short one, so you can pick
   knowingly.

5. **Resume from where it stopped.** Confirm the existing Continue path skips scenes that already
   have a picture and narration, so continuing never pays twice for the same scene.

## What you can do right now

Top up credits (or wait for tomorrow's daily credits), open the story from My stories, and press
Continue. With 20 scenes remaining work will need a meaningful amount of credit, so a top-up is
the practical route.

## Technical notes

- `src/lib/ai.server.ts`: tag gateway 402 responses with a distinguishable error type instead of a
  plain message string, and treat 402/403 as terminal (no retry).
- `src/lib/story.functions.ts`: `markFailed` accepts a reason; credit stops write status `paused`
  with a clear message. `scriptBatch` skips its second attempt on a terminal credit error.
  `renderScene` already skips scenes with existing `image_path`/`audio_path`.
- `src/routes/_authenticated/story.$storyId.tsx`: render the paused state and relabel the action to
  "Continue story"; keep the existing resume loop.
- `src/routes/index.tsx`: add the cost note next to the full-length option.
- No database schema change; `status` is a free-text column.
