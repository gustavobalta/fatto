import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) {
      setErro(error.status === 400 ? 'E-mail ou senha incorretos' : 'Não foi possível entrar. Tente de novo.')
      setSenha('')
    }
    // Com sucesso, o App recebe a sessão por onAuthStateChange.
  }

  return (
    <div className="login-bg">
      <form className="login-card" onSubmit={handleSubmit}>
        <img src="fattolab-logo.png" alt="FattoLab" className="login-logo" />
        <p className="login-sub">Calculadora de Custos</p>
        <div className="login-field">
          <input
            className={`login-input ${erro ? 'login-input-erro' : ''}`}
            type="email"
            placeholder="E-mail"
            autoComplete="username"
            value={email}
            autoFocus
            required
            onChange={e => { setEmail(e.target.value); setErro(null) }}
          />
          <input
            className={`login-input ${erro ? 'login-input-erro' : ''}`}
            type="password"
            placeholder="Senha"
            autoComplete="current-password"
            value={senha}
            required
            onChange={e => { setSenha(e.target.value); setErro(null) }}
          />
          {erro && <span className="login-erro">{erro}</span>}
        </div>
        <button className="login-btn" type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
