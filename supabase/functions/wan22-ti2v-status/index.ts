import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow GET
    if (req.method !== 'GET') {
      throw new Error('Method not allowed')
    }

    // Extract prediction ID from URL
    const url = new URL(req.url)
    const predictionId = url.pathname.split('/').pop()

    if (!predictionId || predictionId === 'wan22-ti2v-status') {
      throw new Error('Prediction ID is required')
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

    // Poll Replicate API for prediction status
    const replicateResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${Deno.env.get('REPLICATE_API_TOKEN')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!replicateResponse.ok) {
      const errorData = await replicateResponse.text()
      console.error('Replicate API error:', errorData)
      throw new Error(`Replicate API error: ${replicateResponse.status}`)
    }

    const prediction = await replicateResponse.json()

    // Return prediction status and output
    return new Response(
      JSON.stringify({
        success: true,
        predictionId: prediction.id,
        status: prediction.status, // 'starting', 'processing', 'succeeded', 'failed'
        output: prediction.output, // video URL when status is 'succeeded'
        error: prediction.error,
        createdAt: prediction.created_at,
        completedAt: prediction.completed_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error checking prediction status:', error)
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
