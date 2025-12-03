import { useState } from 'react'
import './AnalyzeForm.css'
import { submitAnalysis } from '../services/apiService'

interface AnalyzeFormProps {
  onSubmit: (taskId: string, videoId?: string) => void
}

function AnalyzeForm({ onSubmit }: AnalyzeFormProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
      /(?:youtu\.be\/)([^?]+)/
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!youtubeUrl.trim()) {
      setError('유튜브 주소를 입력해 주세요.')
      return
    }
    if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
      setError('올바른 유튜브 주소를 입력해 주세요.')
      return
    }
    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) {
      setError('올바른 유튜브 주소를 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await submitAnalysis(videoId)
      if (response.taskid === -1 || response.taskid === '-1') {
        setError('분석 요청 중 오류가 발생했습니다. 다시 시도해 주세요.')
        return
      }
      onSubmit(String(response.taskid), videoId)
    } catch (err) {
      setError('서버 연결에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="analyze-form-container fade-in">
      <div className="card analyze-form-card">
        <form onSubmit={handleSubmit} className="analyze-form">
          <div className="input-group">
            <label htmlFor="youtube-url">분석할 유튜브 주소를 입력하세요</label>
            <input
              id="youtube-url"
              type="text"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          {error && (
            <div className="error-message">{error}</div>
          )}
          <button
            type="submit"
            className="btn btn-primary btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>분석중...</>
            ) : (
              <>분석 시작</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AnalyzeForm
