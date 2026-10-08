import { useState, useEffect } from 'react'
import { Check, ChevronDown,ChevronUp, Loader2, Pencil, X } from 'lucide-react'
import api from '../../services/api'

const STATUS_STYLES = {
  Aprovado: 'bg-green-100 text-green-700',
  Reprovado: 'bg-red-50 text-rose-600',
  Pendente: 'bg-amber-50 text-amber-600',
}

/**
 * Botão + modal que mostra o histórico de provas de um aluno,
 * um card por combinação disciplina + semestre.
 *
 * Uso:
 *   <HistoricoProvasCard alunoId={aluno.id} />
 *
 * Opcional: filtrar por disciplina (ex: só MATEMATICA na tela de Matemática)
 *   <HistoricoProvasCard alunoId={aluno.id} disciplinaFiltro="MATEMATICA" />
 */
export default function HistoricoProvasCard({ alunoId, alunoNome, aluno, disciplinaFiltro, onAtualizar }) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [provas, setProvas] = useState(null)
  const [nome, setNome] = useState(alunoNome || aluno?.nome || aluno?.name || '')
  const [erro, setErro] = useState('')

  const [editandoProvaId, setEditandoProvaId] = useState(null)
  const [novaNota, setNovaNota] = useState('')
  const [salvandoNota, setSalvandoNota] = useState(false)

  const resolvedAlunoId = alunoId || aluno?.id

  async function abrir(event) {
    event.preventDefault()
    event.stopPropagation()
    setAberto(true)

    // Se já buscou antes, não busca de novo
    if (provas !== null) return

    setCarregando(true)
    setErro('')
    try {
      const { data } = await api.get(`/alunos/${resolvedAlunoId}/historico/`)
      setProvas(data.provas || [])
      if (data.aluno_nome || data.nome || data.aluno?.nome) {
        setNome(data.aluno_nome || data.nome || data.aluno?.nome)
      }
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao carregar histórico.')
    } finally {
      setCarregando(false)
    }
  }

  function fechar() {
    setAberto(false)
    setEditandoProvaId(null)
    if (onAtualizar){
      onAtualizar()
    }
  }

  function iniciarEdicaoProva(prova) {
    setEditandoProvaId(prova.id)
    setNovaNota(prova.nota)
  }

  async function salvarEdicaoProva(provaId) {
    setSalvandoNota(true)
    try {
      const notaFormatada = novaNota !== '' ? Number(novaNota.toString().replace(',', '.')) : null
      
      // Requisição direta para o endpoint do histórico (baseado no seu urls.py)
      await api.patch(`/proficiencia/historico/${provaId}/`, { nota: notaFormatada })

      // Atualiza a nota apenas do card específico na interface sem recarregar tudo
      setProvas((prev) =>
        prev.map((p) => (p.id === provaId ? { ...p, nota: notaFormatada } : p))
      )
      setEditandoProvaId(null)
    } catch (err) {
      console.error("Erro ao salvar nota:", err)
      alert("Erro ao salvar a nota desta prova.")
    } finally {
      setSalvandoNota(false)
    }
  }

  function normalizar(texto) {
    return (texto || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .toUpperCase()
      .trim()
  }

  // 👇 Compara ignorando acento e maiúscula/minúscula
  const provasFiltradas = disciplinaFiltro
    ? (provas || []).filter(
        (p) =>
          normalizar(p.disciplina) === normalizar(disciplinaFiltro) ||
          normalizar(p.disciplina_display) === normalizar(disciplinaFiltro)
      )
    : provas

  return (
    <>
      <button type="button" onClick={abrir} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
        Histórico <ChevronDown size={14} />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={fechar}>
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Histórico de provas: {nome}</h3>
              <button type="button" onClick={fechar} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto flex flex-col gap-2">
              {carregando && <div className="flex items-center gap-2 text-xs text-gray-500 py-2"><Loader2 size={14} className="animate-spin" /> Carregando histórico...</div>}
              {erro && <p className="text-xs text-red-500">{erro}</p>}
              {!carregando && !erro && provasFiltradas && provasFiltradas.length === 0 && (
                <p className="text-xs text-gray-400 py-2">Nenhum registro de prova encontrado.</p>
              )}

              {!carregando && provasFiltradas && provasFiltradas.map((prova) => (
                  <div key={prova.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{prova.disciplina_display || prova.disciplina}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[prova.status] || 'bg-gray-100 text-gray-600'}`}>
                        {prova.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Semestre: <span className="font-medium text-slate-700">{prova.semestre_prova}</span>
                    </div>
                    
                    {/* ÁREA DA NOTA EDITÁVEL */}
                    <div className="text-lg font-bold text-slate-800 mt-2 flex items-center gap-2">
                      {editandoProvaId === prova.id ? (
                        <>
                          <input
                            type="number"
                            step="0.01"
                            value={novaNota}
                            onChange={(e) => setNovaNota(e.target.value)}
                            className="w-20 border border-slate-300 rounded px-2 py-1 text-sm font-normal"
                          />
                          <button onClick={() => salvarEdicaoProva(prova.id)} disabled={salvandoNota} className="p-1 rounded text-green-600 hover:bg-green-100">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditandoProvaId(null)} disabled={salvandoNota} className="p-1 rounded text-red-500 hover:bg-red-100">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          {prova.nota}
                          <button onClick={() => iniciarEdicaoProva(prova)} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
                            <Pencil size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}