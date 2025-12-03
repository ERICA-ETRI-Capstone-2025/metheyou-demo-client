import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import AnalyzeForm from './components/AnalyzeForm'
import ResultsDisplay from './components/ResultsDisplay'
import Header from './components/Header'
import './App.css'
import hyXetriLogo from './assets/images/hy_x_etri.webp'
import etricaLogo from './assets/images/etrica.webp'

function MainPage() {
  const navigate = useNavigate()
  const handleAnalysisSubmit = (taskId: string, videoId?: string) => {
    navigate(`/processing/${taskId}`, { state: { videoId } })
  }
  return <AnalyzeForm onSubmit={handleAnalysisSubmit} />
}

function ProcessingPage() {
  const { taskid } = useParams<{ taskid: string }>()
  const location = useLocation()
  const videoId = (location.state as any)?.videoId || null
  const navigate = useNavigate()
  return <ResultsDisplay taskId={taskid!} initialVideoId={videoId} onNewAnalysis={() => navigate('/')} onDone={() => navigate(`/done/${taskid}`)} />
}

function DonePage() {
  const { taskid } = useParams<{ taskid: string }>()
  const navigate = useNavigate()
  return <ResultsDisplay taskId={taskid!} onNewAnalysis={() => navigate('/')} done />
}

function App() {
  const location = useLocation()
  const isMainPage = location.pathname === '/'

  return (
    <div className="app">
      <nav className="navbar">
        <img src={hyXetriLogo} alt="HY x ETRI" className="navbar-logo hy-etri-logo" />
        <img src={etricaLogo} alt="ETRICA" className="navbar-logo etrica-logo" />
      </nav>
      <div className={`container ${!isMainPage ? 'header-hidden' : ''}`}>
        {/* Header */}
        <Header isHidden={!isMainPage} />
        {/* Main Content */}
        <main className={`main-content ${!isMainPage ? 'main-content-centered' : ''}`}>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/processing/:taskid" element={<ProcessingPage />} />
            <Route path="/done/:taskid" element={<DonePage />} />
          </Routes>
        </main>
        {/* Footer */}
        <footer className="footer">
          <p>
            <b>METHEYOU:</b> 한양대학교 ERICA 소프트웨어융합학부 × ETRI
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
