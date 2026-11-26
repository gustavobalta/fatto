import React from 'react'
import { CANAIS } from '../utils/pricing'

function Campo({ label, prefixo, sufixo, valor, onChange, step = '0.01', title }) {
  return (
    <div className="config-group" title={title}>
      <label>{label}</label>
      <div className="input-prefix">
        {prefixo && <span>{prefixo}</span>}
        <input type="number" step={step} min="0" value={valor} onChange={(e) => onChange(e.target.value)} />
        {sufixo && <span>{sufixo}</span>}
      </div>
    </div>
  )
}

// Configurações usadas em todo o cálculo. Ficam salvas neste navegador.
export default function ConfigBar({ cfg, onChange }) {
  const set = (k) => (v) => onChange({ ...cfg, [k]: v })
  return (
    <div className="config-bar">
      <div className="config-group">
        <label>Canal de venda</label>
        <select className="config-select" value={cfg.canal} onChange={(e) => set('canal')(e.target.value)}>
          {Object.entries(CANAIS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
        </select>
      </div>
      <Campo label="Impressora (R$/h)" prefixo="R$" valor={cfg.maquinaHora} onChange={set('maquinaHora')} title="Energia + desgaste por hora de impressão" />
      <Campo label="Perda por falha" sufixo="%" step="1" valor={cfg.falhaPct} onChange={set('falhaPct')} title="Parte das impressões que dá errado e é refeita" />
      <Campo label="Embalagem por pedido" prefixo="R$" valor={cfg.embalagem} onChange={set('embalagem')} />
      <Campo label="Imposto sobre venda" sufixo="%" step="0.1" valor={cfg.impostoPct} onChange={set('impostoPct')} title="MEI paga DAS fixo: deixe 0" />
      {cfg.canal === 'ml' && (
        <>
          <Campo label="Comissão ML" sufixo="%" step="0.5" valor={cfg.mlTaxa} onChange={set('mlTaxa')} title="Clássico ~12%, Premium ~17%; confira a categoria" />
          <Campo label="Tarifa fixa ML" prefixo="R$" valor={cfg.mlFixo} onChange={set('mlFixo')} title={`Cobrada abaixo de R$ ${cfg.mlFixoAte}`} />
        </>
      )}
      <div className="config-hint">
        Custo = (g × R$/g + horas × R$/h) × (1 + perda). Preço sugerido já cobre {CANAIS[cfg.canal]?.fonte}, embalagem e imposto.
      </div>
    </div>
  )
}
