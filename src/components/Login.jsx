import React, { useState } from 'react'
import './Login.css'

const SENHA = '6020'

export default function Login({ onLogin }) {
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (valor === SENHA) {
      onLogin()
    } else {
      setErro(true)
      setValor('')
    }
  }

  return (
    <div className="login-bg">
      <form className="login-card" onSubmit={handleSubmit}>
        <img src="fattolab-logo.png" alt="FattoLab" className="login-logo" />
        <p className="login-sub">Calculadora de Custos</p>
        <div className="login-field">
          <input
            className={`login-input ${erro ? 'login-input-erro' : ''}`}
            type="password"
            placeholder="Senha"
            value={valor}
            autoFocus
            onChange={e => { setValor(e.target.value); setErro(false) }}
          />
          {erro && <span className="login-erro">Senha incorreta</span>}
        </div>
        <button className="login-btn" type="submit">Entrar</button>
      </form>
    </div>
  )
}
