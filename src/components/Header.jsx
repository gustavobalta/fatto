import React from 'react'
import './Header.css'

const ESTADOS = {
  salvo: { cls: 'status-ok', txt: 'Salvo' },
  pendente: { cls: 'status-saving', txt: 'Alterações pendentes...' },
  salvando: { cls: 'status-saving', txt: 'Salvando...' },
  erro: { cls: 'status-error', txt: 'Erro ao salvar, tentando de novo' },
}

export default function Header({ estado, aba, onAba, onLogout }) {
  const e = ESTADOS[estado] || ESTADOS.salvo
  return (
    <header className="header">
      <img src="fattolab-logo.png" alt="FattoLab" className="logo" style={{ background: '#f5f2ee', borderRadius: 8, padding: 4 }} />
      <nav className="header-nav">
        <button className={`nav-btn ${aba === 'produtos' ? 'nav-btn-active' : ''}`} onClick={() => onAba('produtos')}>
          Produtos
        </button>
        <button className={`nav-btn ${aba === 'simulador' ? 'nav-btn-active' : ''}`} onClick={() => onAba('simulador')}>
          Simulador e MakerWorld
        </button>
      </nav>
      <div className="header-status">
        <span className={e.cls}>{e.txt}</span>
      </div>
      <button className="nav-btn" onClick={onLogout} title="Sair">Sair</button>
    </header>
  )
}
