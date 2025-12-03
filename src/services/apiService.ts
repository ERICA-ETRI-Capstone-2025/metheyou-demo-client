const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type TaskStatus = 'ready' | 'extract' | 'trans' | 'analysis' | 'saving' | 'success' | 'error';

export interface SubmitAnalysisResponse {
  taskid: number | string;
}

export interface TaskStatusResponse {
  status: TaskStatus;
}

export interface AnalysisInfoResponse {
  video_id: string | number;
  score: number;
  description: string;
  tags: string;
}

// POST /ai_request.php - 분석 요청
export async function submitAnalysis(videoId: string): Promise<SubmitAnalysisResponse> {
  const response = await fetch(`${API_URL}/ai_request.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: videoId })
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return await response.json();
}

// GET /ai_status.php?tid={taskid} - 작업 상태 조회
export async function getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  const response = await fetch(`${API_URL}/ai_status.php?tid=${taskId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return await response.json();
}

// GET /analysis_info.php?tid={taskid} - 분석 결과 조회
export async function getAnalysisInfo(taskId: string): Promise<AnalysisInfoResponse> {
  const response = await fetch(`${API_URL}/analysis_info.php?tid=${taskId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return await response.json();
}

// 상태별 메시지 반환
export function getStatusMessage(status: TaskStatus): string {
  const messages: Record<TaskStatus, string> = {
    ready: '준비 중...',
    extract: '영상 추출 중...',
    trans: '비디오, 오디오 전처리 중...',
    analysis: 'AI 분석 중...',
    saving: 'DB 업데이트 중...',
    success: '분석 완료!',
    error: '오류 발생'
  };
  return messages[status] || '처리 중...';
}
