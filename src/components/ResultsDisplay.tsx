import { useState, useEffect } from 'react'
import './ResultsDisplay.css'
import Toast from './Toast'
import { getTaskStatus, getAnalysisInfo, getStatusMessage, submitFeedback } from '../services/apiService'
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
  
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ message: string; id: number } | null>(null)
  
  const [feedbackCounts, setFeedbackCounts] = useState({ upvote: 0, downvote: 0 })
  const [userVote, setUserVote] = useState<number>(0)

  const showToast = (message: string) => {
    setToastMessage({ message, id: Date.now() })
  }

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
        
        if (response.feedback) {
          setFeedbackCounts(response.feedback)
        }
        if (response.voted !== undefined && response.voted !== 0) {
          setHasVoted(true)
          setUserVote(response.voted)
        }
      } catch (err) {
        setError('분석 결과를 불러오는 중 오류가 발생했습니다.')
      }
    }

    fetchAnalysisInfo()
  }, [done, taskId])

  const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hq720.jpg` : null
  const displayThumbnailUrl = initialVideoIdState ? `https://i.ytimg.com/vi/${initialVideoIdState}/hq720.jpg` : null
  const targetThumbnailUrl = done ? thumbnailUrl : displayThumbnailUrl

  useEffect(() => {
    if (!targetThumbnailUrl) return

    const img = new Image()
    img.src = targetThumbnailUrl
    img.onload = () => {
      const bgElem = document.getElementById('dynamic-page-bg')
      if (bgElem) {
        bgElem.style.backgroundImage = `url(${targetThumbnailUrl})`
        // 짧은 지연 후 opacity 적용 (CSS transition 트리거용)
        requestAnimationFrame(() => {
          bgElem.classList.add('loaded')
        })
      }
    }
  }, [targetThumbnailUrl])

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

  const handleVote = async (type: 'upvote' | 'downvote') => {
    if (!videoId || isVoting) return;

    setIsVoting(true);
    try {
      const response = await submitFeedback(videoId, type);
      if (response.status === 'success') {
        const action = response.action;
        if (action === 'added') {
          showToast('평가해 주셔서 감사합니다!');
          setUserVote(type === 'upvote' ? 1 : -1);
          setFeedbackCounts(prev => ({
            upvote: prev.upvote + (type === 'upvote' ? 1 : 0),
            downvote: prev.downvote + (type === 'downvote' ? 1 : 0),
          }));
        } else if (action === 'updated') {
          showToast(`${type === 'upvote' ? '유익' : '유해'}한 비디오로 변경되었습니다.`);
          setUserVote(type === 'upvote' ? 1 : -1);
          setFeedbackCounts(prev => ({
            upvote: prev.upvote + (type === 'upvote' ? 1 : -1),
            downvote: prev.downvote + (type === 'downvote' ? 1 : -1),
          }));
        } else if (action === 'removed') {
          showToast('평가가 취소되었습니다.');
          setUserVote(0);
          setFeedbackCounts(prev => ({
            upvote: prev.upvote - (type === 'upvote' ? 1 : 0),
            downvote: prev.downvote - (type === 'downvote' ? 1 : 0),
          }));
        }
        setHasVoted(userVote !== 0);
      }
    } catch (err: any) {
      showToast('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = feedbackCounts.upvote + feedbackCounts.downvote;
  let feedbackText = "사용자 평가가 아직 없는 비디오예요";
  let feedbackColorClass = "text-gray";
  if (totalVotes > 0) {
    if (feedbackCounts.upvote > feedbackCounts.downvote) {
      feedbackText = `${totalVotes}명 중 ${feedbackCounts.upvote}명이 유익하다고 판단한 비디오예요`;
      feedbackColorClass = "text-lightblue";
    } else if (feedbackCounts.upvote === feedbackCounts.downvote) {
      feedbackText = `${totalVotes}명 중 절반이 유익하다고 판단한 비디오예요`;
      feedbackColorClass = "text-gray";
    } else {
      feedbackText = `${totalVotes}명 중 ${feedbackCounts.downvote}명이 유해하다고 판단한 비디오예요`;
      feedbackColorClass = "text-red";
    }
  }

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
        
        <div className={`feedback-stats-text ${feedbackColorClass}`}>
          {feedbackText}
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
        
        <div className="feedback-wrapper">
          <span className="feedback-text">이 영상, 실제로 어떠셨나요?</span>
          <div className="youtube-pill-container">
            <button 
              className={`youtube-pill-btn left ${userVote === 1 ? 'active' : ''}`} 
              onClick={() => handleVote('upvote')}
              disabled={isVoting}
              title="유익"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="youtube-icon">
                <path d="M7 10v12"/>
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>
              </svg>
              유익
            </button>
            <div className="youtube-pill-divider"></div>
            <button 
              className={`youtube-pill-btn right ${userVote === -1 ? 'active' : ''}`} 
              onClick={() => handleVote('downvote')}
              disabled={isVoting}
              title="유해"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="youtube-icon">
                <path d="M17 14V2"/>
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/>
              </svg>
              유해
            </button>
          </div>
        </div>

        <button className="new-analysis-btn" onClick={onNewAnalysis}>
          다시 분석하기
        </button>
      </div>

      {toastMessage && (
        <Toast
          key={toastMessage.id}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  )
}

export default ResultsDisplay
