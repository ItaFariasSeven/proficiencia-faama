import { useState } from 'react'
import api from '../../services/api'

/**
 * Recebe uma lista de itens de preview vindos do backend e permite
 * ao operador escolher vínculo, criação ou edição antes de confirmar.
 *
 * Cada item tem:
 *   - id (gerado no frontend)
 *   - acao: 'vincular' | 'conferir' | 'criar'
 *   - dados_planilha: { nome, email, ra, curso, semestre_referencia, ... }
 *   - aluno_existente: objeto ou null
 *   - candidatos: array de alunos parecidos
 */
export default function ScreenConferenciaImport({ preview, arquivoName, onConcluido }) {
  const [itens, setItens] = useState(
    preview.map((item, idx) => ({ ...item, id: idx, acao_escolhida: item.acao, aluno_escolhido: item.aluno_existente?.id || null }))
  )
  const [salvando, setSalvando] = useState(false)

  function escolherAcao(itemId, acao, alunoId = null) {
    setItens((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, acao_escolhida: acao, aluno_escolhido: alunoId } : item
      )
    )
  }

  function editarDadosPlanilha(itemId, campo, valor) {
    setItens((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, dados_planilha: { ...item.dados_planilha, [campo]: valor } }
          : item
      )
    )
  }

  async function confirmarImportacao() {
    // Valida se todos os itens de conferência foram resolvidos
    const pendentes = itens.filter((i) => i.acao_escolhida === 'conferir' && !i.aluno_escolhido)
    if (pendentes.length > 0) {
      alert(`Ainda existem ${pendentes.length} alunos pendentes de conferência.`)
      return
    }

    const payload = itens.map((item) => ({
      acao: item.acao_escolhida === 'conferir' ? 'vincular' : item.acao_escolhida,
      aluno_id: item.aluno_escolhido,
      dados_planilha: item.dados_planilha,
    }))

    setSalvando(true)
    try {
      const { data } = await api.post('/proficiencia/confirmar-importacao/', {
        arquivo_name: arquivoName,
        itens: payload,
      })
      onConcluido?.(data)
    } catch (err) {
      console.error(err)
      alert('Erro ao confirmar importação.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-zinc-800">Conferência de importação</h2>
        <button
          onClick={confirmarImportacao}
          disabled={salvando}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Confirmar importação'}
        </button>
      </div>

      {itens.map((item) => (
        <div
          key={item.id}
          className={`border rounded-lg p-4 ${
            item.acao_escolhida === 'criar'
              ? 'border-green-200 bg-green-50'
              : item.acao_escolhida === 'vincular'
              ? 'border-blue-200 bg-blue-50'
              : 'border-yellow-200 bg-yellow-50'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Nome</label>
              <input
                type="text"
                value={item.dados_planilha.nome}
                onChange={(e) => editarDadosPlanilha(item.id, 'nome', e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">E-mail</label>
              <input
                type="email"
                value={item.dados_planilha.email}
                onChange={(e) => editarDadosPlanilha(item.id, 'email', e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">RA</label>
              <input
                type="text"
                value={item.dados_planilha.ra || ''}
                onChange={(e) => editarDadosPlanilha(item.id, 'ra', e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Curso</label>
              <input
                type="text"
                value={item.dados_planilha.curso}
                disabled
                className="w-full border rounded px-2 py-1 text-sm bg-gray-100"
              />
            </div>
          </div>

          {item.acao_escolhida === 'conferir' && (
            <div className="space-y-3">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ Possível aluno já existente. Escolha uma ação:
              </p>

              <div className="flex gap-3 mb-3">
              <button
                onClick={() => escolherAcao(item.id, 'criar')}
                className={`px-3 py-1.5 text-sm rounded border ${
                  item.acao_escolhida === 'criar'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-green-700 border-green-300'
                }`}
              >
                Criar novo aluno
              </button>
            
              {item.acao === 'conferir' && (
                <button
                  onClick={() => escolherAcao(item.id, 'conferir', null)}
                  className={`px-3 py-1.5 text-sm rounded border ${
                    item.acao_escolhida === 'conferir'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-blue-700 border-blue-300'
                  }`}
                >
                  Voltar para conferência
                </button>
              )}
            </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Candidatos encontrados</p>
                {item.candidatos.map((candidato) => (
                  <label
                    key={candidato.id}
                    className={`flex items-center justify-between p-3 rounded border cursor-pointer ${
                      item.aluno_escolhido === candidato.id
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-sm">
                      <p className="font-medium text-zinc-800">{candidato.nome}</p>
                      <p className="text-gray-500">{candidato.email} — RA: {candidato.ra || '-'}</p>
                    </div>
                    <input
                      type="radio"
                      name={`candidato-${item.id}`}
                      checked={item.aluno_escolhido === candidato.id}
                      onChange={() => escolherAcao(item.id, 'vincular', candidato.id)}
                      className="size-4"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {item.acao_escolhida === 'vincular' && (
            <p className="text-sm text-blue-700">
              ✅ Vínculo automático com 
              <strong>
                {
                  item.aluno_escolhido
                    ? item.candidatos.find(c => c.id === item.aluno_escolhido)?.nome || item.aluno_existente?.nome
                    : item.aluno_existente?.nome
                }
              </strong>
            </p>
          )}

          {item.acao_escolhida === 'criar' && (
            <p className="text-sm text-green-700">
              ➕ Será criado como novo aluno.
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
