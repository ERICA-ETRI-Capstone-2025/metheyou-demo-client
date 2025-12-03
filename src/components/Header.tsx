import './Header.css'

interface HeaderProps {
  isHidden?: boolean
}

function Header({ isHidden = false }: HeaderProps) {
  return (
    <header className={`header fade-in ${isHidden ? 'header-slide-out' : ''}`}>
      <div className="logo-container">
        <div className="logo-text">
          <span style={{fontWeight: 300}}>믿어</span>
          <span style={{color:'#0095f2'}}>유</span>
          <span className="logo-beta">beta</span>
        </div>
      </div>
      <p className="subtitle">
        AI 기반 유튜브 안심 컨텐츠 분석 솔루션
      </p>
    </header>
  )
}

export default Header
