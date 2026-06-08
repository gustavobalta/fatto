import React from 'react'
import './Header.css'

export default function Header({ saving, error, aba, onAba }) {
  return (
    <header className="header">
      <img src="fattolab-logo.png" alt="FattoLab" className="logo" style={{ background: '#f5f2ee', borderRadius: 8, padding: 4 }} />
      <nav className="header-nav">
        <button className={`nav-btn ${aba === 'produtos' ? 'nav-btn-active' : ''}`} onClick={() => onAba('produtos')}>
          Produtos
        </button>
        <button className={`nav-btn ${aba === 'simulador' ? 'nav-btn-active' : ''}`} onClick={() => onAba('simulador')}>
          Simulador
        </button>
      </nav>
      <div className="header-status">
        {error && <span className="status-error">{error}</span>}
        {saving && !error && <span className="status-saving">Salvando...</span>}
        {!saving && !error && <span className="status-ok">Salvo</span>}
      </div>
    </header>
  )
}
