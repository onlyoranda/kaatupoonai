import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Wan22Input {
  prompt: string
  image?: string
  num_frames?: number
  resolution?: '480p' | '720p'
  frames_per_second?: number
  sample_shift?: number
  seed?: number
  go_fast?: boolean
  interpolate_output?: boolean
  disable_safety_checker?: boolean
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const { prompt, image, ...options }: Wan22Input = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required')
    }

    // Validate prompt length
    if (prompt.length > 2000) {
      throw new Error('Prompt must be less than 2000 characters')
    }

    // Call Replicate API
    const replicateResponse = await fetch('https://api.replicate.com/v1/models/wan-video/wan-2.2-ti2v-fast/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${Deno.env.get('REPLICATE_API_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'febae7d9656309cf8c5df4842b27ae4768c0e47a0e1ce443a5ae81f896956134',
        input: {
          prompt,
          ...(image && { image }),
          num_frames: options.num_frames ?? 81,
          resolution: options.resolution ?? '480p',
          frames_per_second: options.frames_per_second ?? 16,
          sample_shift: options.sample_shift ?? 12,
          go_fast: options.go_fast ?? true,
          interpolate_output: options.interpolate_output ?? false,
          disable_safety_checker: options.disable_safety_checker ?? false,
          ...(options.seed !== undefined && { seed: options.seed }),
        },
      }),
    })

    if (!replicateResponse.ok) {
      const errorData = await replicateResponse.text()
      console.error('Replicate API error:', errorData)
      throw new Error(`Replicate API error: ${replicateResponse.status}`)
    }

    const prediction = await replicateResponse.json()

    // Return prediction ID for polling
    return new Response(
      JSON.stringify({
        success: true,
        predictionId: prediction.id,
        status: prediction.status,
        message: 'Video generation started. Poll /functions/wan22-ti2v/status/:predictionId for results.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202,
      }
    )
  } catch (error) {
    console.error('Error generating video:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 400,
      }
    )
  }
})
