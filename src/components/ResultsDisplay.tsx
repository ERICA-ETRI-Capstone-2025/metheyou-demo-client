import { useState, useEffect } from 'react'
import './ResultsDisplay.css'
import { getTaskStatus, getAnalysisInfo, getStatusMessage } from '../services/apiService'
import type { TaskStatus, AnalysisInfoResponse } from '../services/apiService'

interface ResultsDisplayProps {
  taskId: string
  initialVideoId?: string
  onNewAnalysis: () => void
  onDone?: () => void
  done?: boolean
}

function ResultsDisplay({ taskId, initialVideoId, onNewAnalysis, onDone, done }: ResultsDisplayProps) {
  const [status, setStatus] = useState<TaskStatus>(done ? 'success' : 'ready')
  const [statusMessage, setStatusMessage] = useState(done ? '분석 완료!' : '준비 중...')
  const [analysisResult, setAnalysisResult] = useState<AnalysisInfoResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [initialVideoIdState] = useState<string | null>(initialVideoId || null)

  // 진행 중일 때 5초마다 상태 폴링
  useEffect(() => {
    if (!taskId || done) return

    const pollStatus = async () => {
      try {
        const response = await getTaskStatus(taskId)
        setStatus(response.status)
        setStatusMessage(getStatusMessage(response.status))

        if (response.status === 'success') {
          // 1초 후 done 페이지로 이동
          setTimeout(() => {
            if (onDone) onDone()
          }, 1000)
        } else if (response.status === 'error') {
          setError('분석 중 오류가 발생했습니다.')
        }
      } catch (err) {
        setError('상태 조회 중 오류가 발생했습니다.')
      }
    }

    // 즉시 한번 실행
    pollStatus()

    // 5초마다 폴링 (success, error가 아닐 때만)
    const interval = setInterval(() => {
      if (status !== 'success' && status !== 'error') {
        pollStatus()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [taskId, done, status, onDone])

  // done 페이지에서 분석 결과 가져오기
  useEffect(() => {
    if (!done || !taskId) return

    const fetchAnalysisInfo = async () => {
      try {
        const response = await getAnalysisInfo(taskId)
        if (response.video_id === -1 || response.video_id === '-1') {
          setError('존재하지 않는 작업 ID입니다.')
          return
        }
        setAnalysisResult(response)
        setVideoId(String(response.video_id))
      } catch (err) {
        setError('분석 결과를 불러오는 중 오류가 발생했습니다.')
      }
    }

    fetchAnalysisInfo()
  }, [done, taskId])

  const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hq720.jpg` : null

  // 에러 상태
  if (error) {
    return (
      <div className="results-container fade-in">
        <div className="error-card">
          <div className="error-message-display">{error}</div>
          <button className="new-analysis-btn" onClick={onNewAnalysis}>
            다시 분석하기
          </button>
        </div>
      </div>
    )
  }

  // 진행 중 상태 (done이 아닐 때)
  if (!done) {
    const displayThumbnailUrl = initialVideoIdState ? `https://i.ytimg.com/vi/${initialVideoIdState}/hq720.jpg` : null
    return (
      <div className="results-container fade-in">
        <div className="loading-message">
          {displayThumbnailUrl && (
            <div className="loading-thumbnail-container">
              <img src={displayThumbnailUrl} alt="Video thumbnail" className="loading-thumbnail" />
            </div>
          )}
          <div className="spinner"></div>
          <p>{statusMessage}</p>
        </div>
      </div>
    )
  }

  // 결과 로딩 중
  if (!analysisResult) {
    return (
      <div className="results-container fade-in">
        <div className="loading-message">
          <div className="spinner"></div>
          <p>결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 분석 결과 표시
  const tags = analysisResult.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
  const isSafe = analysisResult.score >= 50

  return (
    <div className="results-container fade-in">
      {thumbnailUrl && (
        <div className="video-card">
          <img src={thumbnailUrl} alt="Video thumbnail" className="video-thumbnail" />
        </div>
      )}
      <div className="result-card">
        <div className="result-header">
          <svg className="check-icon" viewBox="0 0 24 24" width="32" height="32">
            <circle cx="12" cy="12" r="11" fill={isSafe ? "#10b981" : "#ef4444"} />
            {isSafe ? (
              <path d="M7 12l3 3 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          <div>
            <h2 className="result-title">{isSafe ? '이 영상은 안전합니다!' : '주의가 필요한 영상입니다'}</h2>
            <div className="result-score">{analysisResult.score}/100</div>
          </div>
        </div>
        <div className="result-details">
          <div 
            className="detail-item"
            dangerouslySetInnerHTML={{ __html: analysisResult.description }}
          />
        </div>
        {tags.length > 0 && (
          <div className="result-tags">
            {tags.map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
        )}
        <button className="new-analysis-btn" onClick={onNewAnalysis}>
          다시 분석하기
        </button>
      </div>
    </div>
  )
}

export default ResultsDisplay
