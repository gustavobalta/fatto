import React from 'react'
import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <img src="fattolab-logo.png" alt="FattoLab" className="logo" style={{ background: '#f5f2ee', borderRadius: 8, padding: 4 }} />
      <div className="header-title">
        <span className="header-sub">Calculadora de Custos — Impressão 3D</span>
      </div>
    </header>
  )
}
