import { useEffect, useState } from 'react'
import './Toast.css'

export interface ToastProps {
  message: string
  onClose?: () => void
  duration?: number
}

function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (!onClose) return
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, duration - 300) // 애니메이션 시간(300ms) 전에 종료 시작

    const closeTimer = setTimeout(() => {
      onClose()
    }, duration)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(closeTimer)
    }
  }, [message, duration, onClose])

  return <div className={`toast-notification ${isExiting ? 'exiting' : ''}`}>{message}</div>
}

export default Toast
