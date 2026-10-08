import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'
import ButtonExport from '../../components/Buttons/Buttonexport'
import HistoricoProvasCard from '../../components/HistoricoProvasCard/HistoricoProvasCard';
import './GeneralTableModule.css'
import SearchBar from '../../components/SearchBar/SearchBar';

import api from '../../services/api'

const STATUS_STYLES = {
  Aprovado: 'bg-green-100 text-green-700',
  Reprovado: 'bg-red-50 text-rose-600',
}

// Função robusta que aceita tanto lista simples quanto dados paginados
async function buscarTodos(urlInicial) {
  let url = urlInicial
  let todos = []
  while (url) {
    const { data } = await api.get(url)
    
    // Se a API retornar uma lista pura, usa diretamente
    if (Array.isArray(data)) {
      return data
    }
    
    // Se retornar paginada (DRF padrão)
    todos = [...todos, ...(data.results || [])]
    url = data.next ? data.next.replace(/^https?:\/\/[^/]+/, '') : null
  }
  return todos
}

function RelatorioDataProvider({ render }) {
  const [alunos, setAlunos] = useState([])
  const [selecionados, setSelecionados] = useState([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1) // Novo estado para total de páginas
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState({ campo: 'ra', direcao: 'asc' })
  const [loading, setLoading] = useState(true)

  const [editandoId, setEditandoId] = useState(null)
  const [valoresEdicao, setValoresEdicao] = useState({ 
    nome: '', email: '', notaMatematica: '', notaPortugues: '',
    ra: '', dataProva: '', curso: '', periodoNoSemestre: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [cursos, setCursos] = useState([])

  // Executa o carregamento sempre que a página ou o termo de busca mudarem
  useEffect(() => {
    carregarAlunos()    
  }, [pagina, busca])

  async function carregarAlunos() {
    setLoading(true)
    try {
      // 1 e 2. Paginação e Busca no Servidor
      const endpointAlunos = `/alunos/?page=${pagina}${busca ? `&search=${busca}` : ''}`;
      
      const [respostaAlunos, todasMatriculas, todosCursos] = await Promise.all([
        api.get(endpointAlunos), // Busca apenas 20 registros filtrados
        buscarTodos('/matricula/'), // Alerta: Considere paginar/filtrar na API se a tabela crescer muito
        buscarTodos('/cursos/'),
      ])

      const matriculaPorAluno = {}
      todasMatriculas.forEach((m) => {
        matriculaPorAluno[m.aluno] = m
      })

      setCursos(todosCursos)
      
      // O backend do Django DRF normalmente retorna 'count' com o total absoluto de registros
      const dadosAlunos = respostaAlunos.data;
      const results = Array.isArray(dadosAlunos) ? dadosAlunos : (dadosAlunos.results || []);
      const totalRegistros = !Array.isArray(dadosAlunos) && dadosAlunos.count ? dadosAlunos.count : results.length;
      setTotalPaginas(Math.ceil(totalRegistros / 20) || 1);

      setAlunos(results.map((a) => {
        const matricula = matriculaPorAluno[a.id]
        return {
          id: a.id,
          ra: a.ra ?? '-',
          nome: a.nome,
          email: a.email,
          status: a.aprovado_geral ? 'Aprovado' : 'Reprovado',
          anoRealizacaoProva: a.data_aprovacao_geral ?? '',
          notaMatematica: a.nota_matematica ?? '-',
          notaPortugues: a.nota_portugues ?? '-',
          matriculaId: matricula?.id ?? null,
          cursoId: matricula?.curso ?? '',
          curso: matricula?.curso_nome ?? '-',
          periodoNoSemestre: matricula?.periodo_no_semestre ?? '',
          percentualCurso: matricula?.percentual_curso ?? 0,
        }
      }))
    } catch (err) {
      console.error("Erro ao carregar alunos:", err)
    } finally {
      setLoading(false)
    }
  }

  function iniciarEdicao(aluno) {
    setEditandoId(aluno.id)
    setValoresEdicao({
      nome: aluno.nome,
      email: aluno.email,
      notaMatematica: aluno.notaMatematica === '-' ? '' : aluno.notaMatematica,
      notaPortugues: aluno.notaPortugues === '-' ? '' : aluno.notaPortugues,
      ra: aluno.ra === '-' ? '' : aluno.ra,
      dataProva: aluno.anoRealizacaoProva || '',
      curso: aluno.cursoId || '',
      periodoNoSemestre: aluno.periodoNoSemestre || '',
    })
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setValoresEdicao({
      nome: '', email: '', notaMatematica: '', notaPortugues: '',
      ra: '', dataProva: '', curso: '', periodoNoSemestre: '',
    })
  }

  async function salvarEdicao(id) {
    const confirmou = window.confirm('Tem certeza que deseja salvar as alterações feitas neste aluno?')
    if (!confirmou) return

    setSalvando(true)
    try {
      const aluno = alunos.find((a) => a.id === id)
      const playLoadAluno = {
        nome: valoresEdicao.nome,
        email: valoresEdicao.email,
        nota_matematica: valoresEdicao.notaMatematica !== '' ? Number(valoresEdicao.notaMatematica.toString().replace(',', '.')): null,
        nota_portugues: valoresEdicao.notaPortugues !== '' ? Number(valoresEdicao.notaPortugues.toString().replace(',', '.')): null,
        ra: valoresEdicao.ra || null,
        data_aprovacao_geral: valoresEdicao.dataProva || null,
      }
      const { data: alunoAtualizado } = await api.patch(`/alunos/${id}/`, playLoadAluno)
      console.log("Servidor salvou:", alunoAtualizado)
      
      let matriculaAtualizada = null
      if (aluno?.matriculaId) {
        const { data } = await api.patch(`/matricula/${aluno.matriculaId}/`, {
          curso: valoresEdicao.curso,
          periodo_no_semestre: valoresEdicao.periodoNoSemestre,
        })
        matriculaAtualizada = data
      }
      
      setAlunos((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                nome: valoresEdicao.nome,
                email: valoresEdicao.email,
                notaMatematica: valoresEdicao.notaMatematica || '-',
                notaPortugues: valoresEdicao.notaPortugues || '-',
                ra: valoresEdicao.ra || '-',
                anoRealizacaoProva: valoresEdicao.dataProva || '',
                cursoId: matriculaAtualizada?.curso ?? a.cursoId,
                curso: matriculaAtualizada?.curso_nome ?? a.curso,
                periodoNoSemestre: matriculaAtualizada?.periodo_no_semestre ?? a.periodoNoSemestre,
                percentualCurso: matriculaAtualizada?.percentual_curso ?? a.percentualCurso,
              }
            : a
        )
      )
      setEditandoId(null)
    } catch (err) {
      console.error("Erro completo da API:", err.response?.data);
      
      const errorData = err.response?.data;
      let mensagem = 'Erro ao salvar alterações.';
      
      if (errorData) {
        if (typeof errorData === 'object') {
          // Transforma o dicionário de erros do DRF em uma string legível
          mensagem = Object.entries(errorData)
            .map(([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
        } else if (errorData.detail) {
          mensagem = errorData.detail;
        }
      }
      
      alert(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return render({
    state: {
      alunos,
      loading,
      pagina,
      totalPaginas,
      editandoId,
      valoresEdicao,
      salvando,
      busca,
    },
    actions: {
      setPagina,
      setValoresEdicao,
      iniciarEdicao,
      cancelarEdicao,
      salvarEdicao,
      setBusca,
    }
  })
}

export default function GeneralTable() {
  return (
    <RelatorioDataProvider 
      render={({ state, actions }) => {
        const { alunos, loading, pagina, totalPaginas, editandoId, valoresEdicao, salvando, busca } = state;
        const { setPagina, iniciarEdicao, cancelarEdicao, salvarEdicao, setBusca, setValoresEdicao } = actions;

        return (
          // 3. Contêiner raiz para prevenir vazamento de layout: max-w-full com grid isolado.
          <div className="w-full max-w-full grid grid-cols-1 overflow-hidden">
            <div className="w-full bg-white rounded-lg shadow-[0px_4px_4px_0px_rgba(69,75,87,0.12)] flex flex-col min-w-0">
              
              <SearchBar 
                busca={busca} 
                onBusca={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }} 
              />
              
              <div className="w-full overflow-x-auto relative">
                <div className="min-w-[1050px] w-full">
                  
                  {/* Cabeçalho da tabela */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/75 border-b border-slate-200">
                    <div className="w-8 text-start text-xs font-semibold text-gray-900 uppercase tracking-wide">RA</div>
                    <div className="w-58 pl-6 flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">Nome</div>
                    <div className="w-50 text-xs text-start font-semibold text-gray-600 uppercase tracking-wide">Email</div>
                    <div className="w-24 text-xs text-center font-semibold text-gray-600 uppercase tracking-wide">nota Mat</div>
                    <div className="w-24 text-xs text-center font-semibold text-gray-600 uppercase tracking-wide">nota Port</div>
                    <div className="w-28 flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</div>
                    <div className="w-20 text-right mr-7 text-xs font-semibold text-gray-600 uppercase tracking-wide">Data Prova</div>
                    <div className="w-20 text-right mr-8 text-xs font-semibold text-gray-600 uppercase tracking-wide">Curso</div>
                    <div className="w-24 text-start text-xs font-semibold text-gray-600 uppercase tracking-wide">% de Curso</div>
                    <div className="w-16 text-start text-xs font-semibold text-gray-600 uppercase tracking-wide">Ações</div>
                  </div>

                  {loading ? (
                    <div className="p-5 text-sm text-gray-500 text-center w-full">Carregando dados...</div>
                  ) : (
                    // Alterado de alunosPaginados (inexistente) para "alunos" (que já vêm paginados pela API)
                    alunos.map((aluno, index) => {
                      const emEdicao = editandoId === aluno.id

                      return (
                        <div key={aluno.id} className="flex flex-col">
                          <div className={`flex items-center gap-5 px-5 py-1 h-16 ${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                            
                            {/* RA */}
                            <div className="w-9 text-sm text-start font-medium text-[var(--text-dark)]">
                              {emEdicao ? (
                                <input
                                  type="text"
                                  value={valoresEdicao.ra}
                                  onChange={(e) => setValoresEdicao((prev) => ({ ...prev, ra: e.target.value }))}
                                  placeholder="RA"
                                  className="w-full border border-slate-300 rounded px-1 py-1 text-sm"
                                />
                              ) : (
                                aluno.ra
                              )}
                            </div>

                            {/* Nome */}
                            <div className="w-48 text-sm text-start font-medium text-[var(--text-dark)]">
                              {emEdicao ? (
                                <input
                                  type="text"
                                  value={valoresEdicao.nome}
                                  onChange={(e) => setValoresEdicao((prev) => ({ ...prev, nome: e.target.value }))}
                                  className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                                />
                              ) : (
                                <span className="truncate block">{aluno.nome}</span>
                              )}
                            </div>

                            {/* Email */}
                            <div className="w-50 text-sm text-start text-[var(--text-dark)]">
                              {emEdicao ? (
                                <input
                                  type="email"
                                  value={valoresEdicao.email}
                                  onChange={(e) => setValoresEdicao((prev) => ({ ...prev, email: e.target.value }))}
                                  className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                                />
                              ) : (
                                <span className="truncate block" title={aluno.email}>{aluno.email}</span>
                              )}
                            </div>

                            {/* Nota Matemática */}
                            <div className="w-20 text-sm text-[var(--text-dark)]">
                              <span className="truncate block">{aluno.notaMatematica}</span>
                            </div>

                            {/* Nota Português */}
                            <div className="w-20 text-sm text-[var(--text-dark)]">
                              <span className="truncate block">{aluno.notaPortugues}</span>
                            </div>

                            {/* Status */}
                            <div className="w-12">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[aluno.status]}`}>
                                {aluno.status}
                              </span>
                            </div>
                            
                            <div className="w-28 text-right text-sm text-[var(--text-dark)]">
                              {aluno.anoRealizacaoProva || '—'}
                            </div>
                            <div className="w-28 text-right text-sm text-[var(--text-dark)]">{aluno.curso}</div>
                            <div className="w-24 text-right text-sm text-[var(--text-dark)]">{aluno.percentualCurso}%</div>

                            {/* Botões de Ação */}
                            <div className="w-16 flex items-center justify-end gap-1">
                              {emEdicao ? (
                                <>
                                  <button
                                    onClick={() => salvarEdicao(aluno.id)}
                                    disabled={salvando}
                                    className="p-1 rounded text-green-600 hover:bg-green-50 disabled:opacity-40"
                                    title="Salvar"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={cancelarEdicao}
                                    disabled={salvando}
                                    className="p-1 rounded text-red-500 hover:bg-red-50 disabled:opacity-40"
                                    title="Cancelar"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => iniciarEdicao(aluno)}
                                  className="p-1 rounded text-slate-500 hover:bg-slate-100"
                                  title="Editar"
                                >
                                  <Pencil size={16} />
                                </button>
                              )}
                            </div>
                        </div>

                        {/* Histórico de provas por semestre */}
                        <div className={`pl-19 botao-historico ${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                          <HistoricoProvasCard alunoId={aluno.id} alunoNome={aluno.nome} />
                        </div>
                              
                          
                      </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-start gap-3 h-12 bg-white border-t border-gray-100 px-5">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1 || loading}
                  className="p-1 rounded disabled:opacity-40 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium text-[var(--text-dark)]">{pagina} de {totalPaginas}</span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina >= totalPaginas || loading}
                  className="p-1 rounded disabled:opacity-40 hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )
      }} 
    />
  )
}