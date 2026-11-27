import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Login.css'

// Login só com senha: todos entram com o mesmo usuário do Supabase Auth.
// O e-mail não é segredo (vai no site); quem protege é a senha + o RLS do banco.
// O Supabase exige no mínimo 6 caracteres, então a senha digitada ganha um prefixo fixo.
// No painel, a senha do usuário é SENHA_PREFIXO + a senha que se digita aqui.
export const LOGIN_EMAIL = 'equipe@fattolab3d.web.app'
export const SENHA_PREFIXO = 'fattolab-'

export default function Login() {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.auth.signInWithPassword({ email: LOGIN_EMAIL, password: SENHA_PREFIXO + senha })
    setEnviando(false)
    if (error) {
      setErro(error.status === 400 ? 'Senha incorreta' : 'Não foi possível entrar. Tente de novo.')
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
          <input type="hidden" name="username" autoComplete="username" value={LOGIN_EMAIL} readOnly />
          <input
            className={`login-input ${erro ? 'login-input-erro' : ''}`}
            type="password"
            placeholder="Senha"
            autoComplete="current-password"
            value={senha}
            autoFocus
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
