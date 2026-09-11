import { useState, useCallback } from 'react'
import { Wan22Client, Wan22Options, Wan22Prediction } from '@/lib/wan22-client'

const wan22 = new Wan22Client()

export function useWan22() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [prediction, setPrediction] = useState<Wan22Prediction | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateVideo = useCallback(async (options: Wan22Options) => {
    setIsGenerating(true)
    setError(null)
    setPrediction(null)

    try {
      const result = await wan22.generateVideo(options)
      setPrediction({ predictionId: result.predictionId, status: 'starting' })
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate video'
      setError(errorMessage)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const pollStatus = useCallback(async (predictionId: string) => {
    try {
      const result = await wan22.pollStatus(predictionId)
      setPrediction(result)
      
      if (result.error) {
        setError(result.error)
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get status'
      setError(errorMessage)
      throw err
    }
  }, [])

  const generateAndWait = useCallback(async (options: Wan22Options) => {
    setIsGenerating(true)
    setError(null)
    setPrediction(null)

    try {
      const result = await wan22.generateAndWait(options)
      setPrediction(result)
      
      if (result.error) {
        setError(result.error)
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate video'
      setError(errorMessage)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsGenerating(false)
    setPrediction(null)
    setError(null)
  }, [])

  return {
    isGenerating,
    prediction,
    error,
    generateVideo,
    pollStatus,
    generateAndWait,
    reset,
  }
}
