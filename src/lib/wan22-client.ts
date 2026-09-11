/**
 * Wan2.2-TI2V-5B Client for Lovable/React
 * 
 * Usage:
 * ```ts
 * const wan22 = new Wan22Client()
 * 
 * // Generate video
 * const { predictionId } = await wan22.generateVideo({
 *   prompt: "A cat walking on the beach at sunset",
 *   resolution: "720p",
 *   num_frames: 81,
 * })
 * 
 * // Poll for results
 * const result = await wan22.pollStatus(predictionId)
 * if (result.status === 'succeeded') {
 *   console.log('Video URL:', result.output)
 * }
 * ```
 */

export interface Wan22Options {
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

export interface Wan22Prediction {
  predictionId: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed'
  output?: string // video URL when succeeded
  error?: string
  createdAt?: string
  completedAt?: string
}

export class Wan22Client {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || ''
  }

  /**
   * Generate a video using Wan2.2-TI2V-5B
   */
  async generateVideo(options: Wan22Options): Promise<{ predictionId: string }> {
    const response = await fetch(`${this.baseUrl}/functions/v1/wan22-ti2v`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate video')
    }

    return response.json()
  }

  /**
   * Poll for prediction status
   */
  async pollStatus(predictionId: string): Promise<Wan22Prediction> {
    const response = await fetch(
      `${this.baseUrl}/functions/v1/wan22-ti2v-status/${predictionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get status')
    }

    return response.json()
  }

  /**
   * Generate video and wait for completion (polling with delay)
   * 
   * @param options - Generation options
   * @param pollInterval - Milliseconds between polls (default: 2000)
   * @param maxAttempts - Maximum poll attempts (default: 150 = 5 minutes)
   */
  async generateAndWait(
    options: Wan22Options,
    pollInterval: number = 2000,
    maxAttempts: number = 150
  ): Promise<Wan22Prediction> {
    const { predictionId } = await this.generateVideo(options)

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      
      const result = await this.pollStatus(predictionId)
      
      if (result.status === 'succeeded' || result.status === 'failed') {
        return result
      }
    }

    throw new Error('Video generation timed out')
  }
}
