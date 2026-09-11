import { useState } from 'react'
import { useWan22 } from '@/hooks/useWan22'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Video, AlertCircle } from 'lucide-react'

export function Wan22VideoGenerator() {
  const [prompt, setPrompt] = useState('')
  const {
    isGenerating,
    prediction,
    error,
    generateAndWait,
    reset,
  } = useWan22()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim()) return

    try {
      await generateAndWait({
        prompt: prompt.trim(),
        resolution: '720p',
        num_frames: 81,
        go_fast: true,
      })
    } catch (err) {
      // Error already handled in hook
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Wan2.2 Text-to-Video
        </CardTitle>
        <CardDescription>
          Generate 5-second videos from text prompts using Wan2.2-TI2V-5B
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="Describe your video... (e.g., 'A cat walking on the beach at sunset')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              className="min-h-[120px]"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {prompt.length}/2000 characters
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Video'
              )}
            </Button>

            {prediction && (
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                disabled={isGenerating}
              >
                Reset
              </Button>
            )}
          </div>
        </form>

        {prediction?.status === 'succeeded' && prediction.output && (
          <div className="mt-6 space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <video
                src={prediction.output}
                controls
                className="w-full h-full object-cover"
                autoPlay
                loop
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(prediction.output, '_blank')}
                className="flex-1"
              >
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = prediction.output!
                  link.download = `wan22-${prediction.predictionId}.mp4`
                  link.click()
                }}
                className="flex-1"
              >
                Download
              </Button>
            </div>
          </div>
        )}

        {prediction && prediction.status === 'processing' && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Generating your video... (this may take 2-5 minutes)
          </div>
        )}

        {prediction && prediction.status === 'starting' && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Starting generation...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
