# Fix: story generation fails partway through

## What happened

Your last story ("துருவ் குட்டியின் இனிய நாள்", 20 scenes) stopped with a failure.
The cause is confirmed, not a guess: the story writer was asked to write six scenes at
once and hit its output limit mid-sentence, so the half-finished result could not be
read back. The saved error is a broken-text error at character 4507, and the matching
AI request used 5,996 of its 6,000 allowed output words-worth of budget — it ran out
of room.

Tamil scenes use far more of that budget than English, so long Tamil stories fail most.

## The fix

1. Write fewer scenes per request (three instead of six) and raise the output room, so
   a batch can never run out of space mid-scene.
2. If a reply ever does come back cut off, salvage the complete scenes from it and
   simply re-request the rest instead of failing the whole story.
3. Show a friendlier message and a real "Try again" that resumes from where it stopped,
   rather than restarting the whole story.
4. Retry a failed batch once automatically before giving up.

## Technical notes

- `src/lib/ai.server.ts`: `chatJson` gains a repair path — on a JSON parse failure,
  trim to the last complete array element and close the structure; also raise the
  default `max_tokens` and pass through a per-call value.
- `src/lib/story.functions.ts`: `BATCH` 6 -> 3; `scriptBatch` requests a higher token
  ceiling, tolerates a partial `scenes` array (updates what came back, leaves the rest
  as `beat` so the client loop re-requests them), and retries once on a parse error.
- `src/routes/_authenticated/story.$storyId.tsx`: the beat-expansion loop already
  re-runs while any scene is still a beat, so partial batches resume naturally; add a
  guard so it cannot loop forever when no progress is made, and make "Try again" clear
  the failed status and resume instead of a full page reload.

No database or schema changes.
