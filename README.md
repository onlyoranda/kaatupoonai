# Kaatupoonai

AI-powered story generation app with text-to-video capabilities using Wan2.2-TI2V-5B.

## Features

- 🎬 **Text-to-Video Generation** - Powered by Wan2.2-TI2V-5B via Replicate
- 📖 **Story Creation** - Generate stories with AI assistance
- 🔐 **Secure Authentication** - Supabase Auth with RLS
- ⚡ **Edge Functions** - Serverless inference with Supabase Functions

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI Models**: Wan2.2-TI2V-5B (Replicate)
- **UI**: shadcn/ui components

## Quick Start

### Prerequisites

- Node.js 18+
- Bun or npm
- Supabase CLI
- Replicate API account

### Installation

```bash
# Clone the repository
git clone https://github.com/onlyoranda/kaatupoonai.git
cd kaatupoonai

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Edit .env and add your Replicate API token
# REPLICATE_API_TOKEN=r8_your-token-here

# Start development server
bun dev
```

### Configure Supabase Secrets

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref cuffrpftebcmezppalwk

# Set Replicate API token
supabase secrets set REPLICATE_API_TOKEN=r8_your-token-here

# Deploy Edge Functions
supabase functions deploy wan22-ti2v
supabase functions deploy wan22-ti2v-status
```

## Usage

### Generate a Video

```tsx
import { Wan22VideoGenerator } from '@/components/Wan22VideoGenerator'

function App() {
  return <Wan22VideoGenerator />
}
```

### Programmatic Usage

```tsx
import { useWan22 } from '@/hooks/useWan22'

const { generateVideo, pollStatus } = useWan22()

const result = await generateVideo({
  prompt: "A cat walking on the beach at sunset",
  resolution: "720p",
  num_frames: 81,
})

// Poll for completion
const status = await pollStatus(result.predictionId)
if (status.status === 'succeeded') {
  console.log('Video URL:', status.output)
}
```

## Documentation

- [Wan2.2 Setup Guide](docs/WAN22_SETUP.md) - Complete integration guide
- [Supabase Docs](https://supabase.com/docs)
- [Replicate API](https://replicate.com/docs)

## Project Structure

```
kaatupoonai/
├── src/
│   ├── components/
│   │   └── Wan22VideoGenerator.tsx  # Video generation UI
│   ├── hooks/
│   │   └── useWan22.ts              # React hook for Wan2.2
│   └── lib/
│       └── wan22-client.ts          # API client
├── supabase/
│   └── functions/
│       ├── wan22-ti2v/              # Video generation endpoint
│       └── wan22-ti2v-status/       # Status polling endpoint
├── docs/
│   └── WAN22_SETUP.md               # Setup documentation
└── .env.example                     # Environment template
```

## API Reference

### Wan22Options

```ts
interface Wan22Options {
  prompt: string                    // Required: Text description
  image?: string                    // Optional: Image URL
  num_frames?: number               // Default: 81
  resolution?: '480p' | '720p'      // Default: '480p'
  frames_per_second?: number        // Default: 16
  sample_shift?: number             // Default: 12
  seed?: number                     // Optional
  go_fast?: boolean                 // Default: true
  interpolate_output?: boolean      // Default: false
  disable_safety_checker?: boolean  // Default: false
}
```

## Pricing

Replicate charges ~$0.05-0.15 per 5-second video (480p). See [replicate.com/pricing](https://replicate.com/pricing) for current rates.

## License

Apache 2.0

## Links

- [GitHub](https://github.com/onlyoranda/kaatupoonai)
- [Lovable Project](https://lovable.dev/projects/your-project-id)
- [Wan2.2 Model](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B)
