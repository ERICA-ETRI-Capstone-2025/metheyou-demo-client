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
        } else if (response.status === 'toolong') {
          setError('영상 길이가 너무 깁니다.')
        }
      } catch (err) {
        setError('상태 조회 중 오류가 발생했습니다.')
      }
    }

    // 즉시 한번 실행
    pollStatus()

    // 5초마다 폴링 (success, error, toolong이 아닐 때만)
    const interval = setInterval(() => {
      if (status !== 'success' && status !== 'error' && status !== 'toolong') {
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
  
  // 동영상 길이 포맷팅 (초 -> mm:ss)
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // 게시 날짜 포맷팅
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  
  // 점수 범위에 따른 분류
  const getSafetyLevel = (score: number) => {
    if (score >= 70) return { level: 'safe', title: '안전한 영상입니다', color: '#10b981', icon: 'check' }
    if (score >= 40) return { level: 'warning', title: '주의가 필요한 영상입니다', color: '#f59e0b', icon: 'warning' }
    return { level: 'dangerous', title: '유해한 영상입니다', color: '#ef4444', icon: 'cross' }
  }
  
  const safetyInfo = getSafetyLevel(analysisResult.score)

  return (
    <div className="results-container fade-in">
      {thumbnailUrl && (
        <div className="video-card">
          <img src={thumbnailUrl} alt="Video thumbnail" className="video-thumbnail" />
          <div className="video-info">
            <h3 className="video-title">{analysisResult.title}</h3>
            <div className="video-metadata">
              <span className="metadata-item">채널: {analysisResult.channel_name}</span>
              <span className="metadata-item">길이: {formatDuration(analysisResult.duration)}</span>
              <span className="metadata-item">게시: {formatDate(analysisResult.published_at)}</span>
            </div>
          </div>
        </div>
      )}
      <div className="result-card">
        <div className="result-header">
          <svg className="check-icon" viewBox="0 0 24 24" width="32" height="32">
            <circle cx="12" cy="12" r="11" fill={safetyInfo.color} />
            {safetyInfo.icon === 'check' ? (
              <path d="M7 12l3 3 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : safetyInfo.icon === 'warning' ? (
              <text x="12" y="16" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial">!</text>
            ) : (
              <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          <div>
            <h2 className="result-title" style={{ color: safetyInfo.color }}>{safetyInfo.title}</h2>
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
