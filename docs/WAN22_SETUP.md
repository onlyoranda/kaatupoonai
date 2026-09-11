# Wan2.2-TI2V-5B Integration Guide

This guide walks you through setting up Wan2.2 text-to-video generation in your Lovable app using Replicate API and Supabase Edge Functions.

## Prerequisites

1. **Replicate Account** - Sign up at [replicate.com](https://replicate.com)
2. **Supabase Project** - Already configured in your Lovable app
3. **GitHub Repository** - Your `kaatupoonai` repo

## Step 1: Get Your Replicate API Token

1. Go to [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Click "Create API Token"
3. Copy your token (starts with `r8_`)

## Step 2: Configure Environment Variables

### Local Development

Copy `.env.example` to `.env` and add your Replicate token:

```bash
cp .env.example .env
```

Edit `.env`:
```env
REPLICATE_API_TOKEN=r8_your-actual-token-here
```

### Supabase Edge Functions (Production)

Set the secret in your Supabase project:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref cuffrpftebcmezppalwk

# Set the secret
supabase secrets set REPLICATE_API_TOKEN=r8_your-actual-token-here
```

Or via Supabase Dashboard:
1. Go to [supabase.com/dashboard/project/cuffrpftebcmezppalwk](https://supabase.com/dashboard/project/cuffrpftebcmezppalwk)
2. Navigate to **Edge Functions** → **Secrets**
3. Add new secret: `REPLICATE_API_TOKEN` = `r8_your-token`

## Step 3: Deploy Edge Functions

```bash
# Deploy wan22-ti2v function
supabase functions deploy wan22-ti2v --project-ref cuffrpftebcmezppalwk

# Deploy wan22-ti2v-status function
supabase functions deploy wan22-ti2v-status --project-ref cuffrpftebcmezppalwk
```

## Step 4: Use in Your App

### React Component Example

```tsx
import { Wan22VideoGenerator } from '@/components/Wan22VideoGenerator'

function App() {
  return (
    <div className="p-8">
      <Wan22VideoGenerator />
    </div>
  )
}
```

### Custom Hook Example

```tsx
import { useWan22 } from '@/hooks/useWan22'

function MyComponent() {
  const { generateVideo, pollStatus, isGenerating, prediction, error } = useWan22()

  const handleGenerate = async () => {
    try {
      // Start generation
      const { predictionId } = await generateVideo({
        prompt: "A cat walking on the beach at sunset",
        resolution: "720p",
        num_frames: 81,
      })

      // Poll for results
      const interval = setInterval(async () => {
        const result = await pollStatus(predictionId)
        
        if (result.status === 'succeeded') {
          console.log('Video URL:', result.output)
          clearInterval(interval)
        } else if (result.status === 'failed') {
          console.error('Generation failed:', result.error)
          clearInterval(interval)
        }
      }, 2000)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <button onClick={handleGenerate} disabled={isGenerating}>
      {isGenerating ? 'Generating...' : 'Generate Video'}
    </button>
  )
}
```

## API Reference

### Wan22Options

```ts
interface Wan22Options {
  prompt: string                    // Required: Text description
  image?: string                    // Optional: Image URL for image-to-video
  num_frames?: number               // Default: 81 (frames)
  resolution?: '480p' | '720p'      // Default: '480p'
  frames_per_second?: number        // Default: 16
  sample_shift?: number             // Default: 12
  seed?: number                     // Optional: For reproducibility
  go_fast?: boolean                 // Default: true (faster generation)
  interpolate_output?: boolean      // Default: false
  disable_safety_checker?: boolean  // Default: false
}
```

### Prediction Status

```ts
interface Wan22Prediction {
  predictionId: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed'
  output?: string      // Video URL when status is 'succeeded'
  error?: string       // Error message when status is 'failed'
  createdAt?: string
  completedAt?: string
}
```

## Pricing

Replicate charges per second of GPU time. Wan2.2-TI2V-Fast pricing (as of 2026):

- **T4 GPU**: ~$0.0005/sec
- **A10G GPU**: ~$0.0014/sec
- **A100 GPU**: ~$0.0040/sec

A typical 5-second video (480p, 81 frames) takes 2-5 minutes and costs ~$0.05-0.15.

Check current pricing at: [replicate.com/pricing](https://replicate.com/pricing)

## Troubleshooting

### "Unauthorized" Error

- Ensure you're authenticated with Supabase Auth
- Check that JWT token is being sent in requests

### "Replicate API error: 401"

- Verify `REPLICATE_API_TOKEN` is set correctly
- Check token hasn't expired or been revoked

### Video Generation Times Out

- Increase `maxAttempts` in `generateAndWait()`
- Use polling with `generateVideo()` + `pollStatus()` instead
- Check Replicate dashboard for failed predictions

### CORS Issues

- Ensure Edge Functions have proper CORS headers (already configured)
- Check your Lovable app's domain is allowed

## Resources

- [Wan2.2 Model on Replicate](https://replicate.com/wan-video/wan-2.2-ti2v-fast)
- [Replicate API Documentation](https://replicate.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Wan2.2 Paper](https://arxiv.org/abs/2503.20314)

## Support

For issues:
1. Check Supabase Logs in Dashboard
2. Review Replicate predictions at [replicate.com/predictions](https://replicate.com/predictions)
3. Open an issue on GitHub
