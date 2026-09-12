# Stuck 20-scene story: what happened and what to change

## What the check showed

Your story "துருவின் அன்பான குடும்பம்" (20 scenes) is marked failed with the message
"Out of AI credits: Not enough credits". That message came straight back from the AI service,
so it is a real balance stop, not a bug in the app.

Why it still failed when you had 5 credits: a full 20-scene story is the most expensive thing this
app does — every scene needs one picture plus one narration clip. Across this month the story
work has already spent about 3.2 credits on pictures and voices, and the workspace balance is now
1.10 credits left out of the 5 daily ones. Building and planning messages draw from the same pot,
so the 5 credits you had were partly spent before the long story reached its last scenes, and the
run stopped mid-way. Roughly, a 20-scene story needs several credits available at once; a short
story needs a fraction of that.

Nothing is lost. Finished scenes are saved, and the story can carry on from the last finished one.

## What I propose to change

1. **Honest credit message.** When the AI service says there are not enough credits, the story page
   will say so plainly: how many scenes are done, that the rest is paused, and that it continues
   once credits are available — instead of looking like a crash.

2. **Pause instead of fail.** A credit stop marks the story "paused" rather than "failed", and the
   button reads "Continue story".

3. **No wasted retries.** Today the app retries once automatically when the writer fails. On a
   credit stop it will not retry, since a retry cannot succeed and burns nothing but time.

4. **Warn before a long story.** On the create screen the full-length option gets a short note that
   it uses far more credits than the short one, so the choice is informed.

5. **Never pay twice.** Confirm the continue path skips scenes that already have a picture and
   narration.

## What you can do right now

Wait for tomorrow's daily credits or top up, then open the story from My stories and press Continue.
With 20 scenes it will likely need more than one day's free credits, so a top-up is the practical
route — or make a short story, which finishes well within a day's credits.

## Technical notes

- `src/lib/ai.server.ts`: mark gateway 402/403 responses as a terminal credit error type; no retry.
- `src/lib/story.functions.ts`: `markFailed` takes a reason; credit stops write status `paused` with
  a clear message. `scriptBatch` skips its second attempt on a terminal credit error.
  `renderScene` already skips scenes that have `image_path` and `audio_path`.
- `src/routes/_authenticated/story.$storyId.tsx`: render the paused state, relabel the action to
  "Continue story", keep the existing resume loop.
- `src/routes/index.tsx`: cost note beside the full-length option.
- No schema change; `status` is free text.
