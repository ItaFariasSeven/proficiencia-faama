// Todos os alunos - Matemática
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'
import SearchBar from '../../components/SearchBar/SearchBar';
import FilterSelect from '../../components/Filter/FilterSelect';
import api from '../../services/api'


// 👇 Mapeia o status pra cor do badge (evita repetir lógica de cor em cada linha)
const STATUS_STYLES = {
  Aprovado: 'bg-green-100 text-green-700',
  Reprovado: 'bg-red-50 text-rose-600',
}

const DISCIPLINA = 'MATEMATICA'

export default function TableTotalStudentsMath() {
    const [provas, setProvas] = useState([])
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1) 
    const [ordenacao, setOrdenacao] = useState({ campo: 'ra', direcao: 'asc' })
    const [filtros, setFiltros] = useState({ periodo: '', curso: '', status: '' })
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState('')

    const [editandoId, setEditandoId] = useState(null)
    const [valoresEdicao, setValoresEdicao] = useState({
      nota: '',
      semestre: '',
    })
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
      carregarProvas()
    }, [pagina, busca, filtros])

    async function carregarProvas() {
      setLoading(true)
      try {
        // Atenção ao prefixo da sua URL, ajuste se no seu backend for diferente
        // Estamos pedindo APENAS as notas de MATEMÁTICA
        let urlParams = `?disciplina=${DISCIPLINA}&page=${pagina}`;
        
        if (busca) urlParams += `&search=${busca}`;

        // APLICAR OS FILTROS NA API
        if (filtros.status) urlParams += `&status=${filtros.status.toLowerCase()}`;
        if (filtros.curso) urlParams += `&curso=${filtros.curso}`;
        if (filtros.periodo) urlParams += `&semestre=${filtros.periodo}`; // <- Nome do param no Django

        const { data } = await api.get(`/proficiencia/historico/${urlParams}`)

        const totalRegistros = data.count || data.results?.length || 0;
        setTotalPaginas(Math.ceil(totalRegistros / 20) || 1);

        const results = Array.isArray(data) ? data : (data.results || []);

        setProvas(results.map((p) => ({
          id: p.id,
          ra: p.aluno_ra || p.aluno, 
          nome: p.aluno_nome,
          email: p.aluno_email,
          status: p.status,
          nota: p.nota || '—', 
          anoRealizacaoProva: p.semestre_prova || '',
          curso: p.curso_nome || '-',
          percentualCurso: p.percentual_curso || 0,
        })))
      } catch (err) {
        console.error("Erro na API de provas:", err)
      } finally {
        setLoading(false)
      }
    }

  // 👇 Aplica a ordenação sobre os alunos já trazidos da API
  const provasOrdenadas = [...provas].sort((a, b) => {
    const { campo, direcao } = ordenacao
    const valorA = a[campo]
    const valorB = b[campo]

    if (typeof valorA === 'string') {
      return direcao === 'asc'
        ? valorA.localeCompare(valorB)
        : valorB.localeCompare(valorA)
    }
    return direcao === 'asc' ? valorA - valorB : valorB - valorA
  })

  // Alterna a ordenação ao clicar no cabeçalho
  function handleOrdenar(campo) {
    setOrdenacao((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc',
    }))
  }

  // Edita no BD
  function iniciarEdicao(prova) {
    setEditandoId(prova.id)
    setValoresEdicao({
      nota: prova.nota === '—' ? '' : prova.nota,
      semestre: prova.anoRealizacaoProva || '',
    })
  }
  
  // Cancela a edição
  function cancelarEdicao() {
    setEditandoId(null)
    setValoresEdicao({ nota: '', semestre: '' })
  }
  
  // Salva a edição
  async function salvarEdicao(id) {
    const confirmou = window.confirm('Tem certeza que deseja salvar as alterações desta prova?')
    if (!confirmou) return

    setSalvando(true)
    try {
      const payload = {
        nota: valoresEdicao.nota !== '' ? Number(valoresEdicao.nota.toString().replace(',', '.')) : null,
        semestre_prova: valoresEdicao.semestre || null,
      }

      const { data } = await api.patch(`/proficiencia/historico/${id}/`, payload)

      setProvas((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                nota: data.nota ?? '-',
                anoRealizacaoProva: data.semestre_prova || '',
                status: data.status || p.status,
              }
            : p
        )
      )
      setEditandoId(null)
    } catch (err) {
      console.error("Erro ao salvar prova:", err.response?.data)
      alert('Erro ao salvar alterações.')
    } finally {
      setSalvando(false)
    }
  }

  
  return (
    <div className="w-full bg-white rounded-lg shadow-[0px_4px_4px_0px_rgba(69,75,87,0.12)] overflow-hidden">
      
    {/* Barra de pesquisa */}
    <div className='grid grid-cols-2 text-end items-center'>
        <div>
            <SearchBar
                busca={busca}
                onBusca={(e) => {
                    setBusca(e.target.value);
                    setPagina(1);
                }} />
        </div>

        <div className="pr-4">
            <FilterSelect
                filtros={filtros}
                onAplicarFiltros={(novosFiltros) => {
                  setFiltros(novosFiltros);
                  setPagina(1);
                }}
            />
        </div>
    </div>

      {/* Cabeçalho da tabela */}
      <div className="flex items-center gap-2 px-5 py-2 bg-slate-50/75 border-b border-slate-200">

        <div className="w-12 text-start text-xs font-semibold text-gray-900 uppercase tracking-wide">RA</div>

        <button
            onClick={() => handleOrdenar('nome')} 
            className="w-64 flex items-center text-start gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Nome 
          {ordenacao.campo === 'nome' ? (
            ordenacao.direcao === 'asc' ? <ChevronDown size={14} className='rotate-180' /> : <ChevronDown size={14} />
          ):(
            <ChevronDown size={14} className='opacity-30' />
          )}
        </button>

        <div className="w-80 text-xs text-start font-semibold text-gray-600 uppercase tracking-wide">
          Email
        </div>

        <div className="w-20 text-xs text-center font-semibold text-gray-600 uppercase tracking-wide">
          Nota
        </div>

        <button 
            onClick={() => handleOrdenar('status')} 
            className="w-28 flex items-center gap-1 text-xs text-center justify-center font-semibold text-gray-600 uppercase tracking-wide">
          Status 
          {ordenacao.campo === 'status' ? (
            ordenacao.direcao === 'asc' ? <ChevronDown size={14} className='rotate-180' /> : <ChevronDown size={14} />
          ):(
            <ChevronDown size={14} className='opacity-30' />
          )}
        </button>

        <button
          onClick={() => handleOrdenar('anoRealizacaoProva')} 
          className="w-28 flex items-center justify-center text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Data Prova
          {ordenacao.campo === 'status' ? (
            ordenacao.direcao === 'asc' ? <ChevronDown size={14} className='rotate-180' /> : <ChevronDown size={14} />
          ):(
            <ChevronDown size={14} className='opacity-30' />
          )}
        </button>

        <div className="w-28 text-center mr-8 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Curso
        </div>

        <div className="w-24 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
          % de Curso
        </div>
      </div>

      {/* Linhas */}
      {loading ? (
        <div className="p-5 text-sm text-gray-500 text-center w-full">Carregando dados...</div>
      ) : (
        provasOrdenadas.map((prova, index) => {
          const emEdicao = editandoId === prova.id

          return (
            <div
              key={prova.id}
              className={`flex items-center gap-2 px-5 py-1 h-16 ${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
            >
              <div className="w-12 text-sm text-start font-medium text-[var(--text-dark)]">{prova.ra}</div>
              <div className="w-64 text-sm text-start font-medium text-[var(--text-dark)] truncate" title={prova.nome}>{prova.nome}</div>
              <div className="w-80 text-sm text-start text-[var(--text-dark)] truncate" title={prova.email}>{prova.email}</div>

              {/* Nota */}
              <div className="w-20 text-sm text-center text-[var(--text-dark)]">
                {emEdicao ? (
                  <input
                    type="text"
                    value={valoresEdicao.nota}
                    onChange={(e) => setValoresEdicao((prev) => ({ ...prev, nota: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-1 py-1 text-sm text-center"
                  />
                ) : (
                  <span className="truncate block">{prova.nota}</span>
                )}
              </div>

              <div className="w-28 text-center">
                <span className={`inline-flex items-center rounded-full text-xs text-center font-medium ${STATUS_STYLES[prova.status]}`}>
                  {prova.status}
                </span>
              </div>

              {/* Data Prova */}
              <div className="w-28 text-center text-sm text-[var(--text-dark)]">
                {emEdicao ? (
                  <input
                    type="text"
                    placeholder="Ex: 2026.1"
                    value={valoresEdicao.semestre}
                    onChange={(e) => setValoresEdicao((prev) => ({ ...prev, semestre: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-1 py-1 text-xs text-center"
                  />
                ) : (
                  prova.anoRealizacaoProva || '—'
                )}
              </div>

              <div className="w-28 text-center text-sm text-[var(--text-dark)]">{prova.curso}</div>
              <div className="w-24 text-center text-sm text-[var(--text-dark)]">{prova.percentualCurso}%</div>

              {/* Ações */}
              <div className="w-12 flex items-center justify-center gap-1">
                {emEdicao ? (
                  <>
                    <button
                      onClick={() => salvarEdicao(prova.id)}
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
                    onClick={() => iniciarEdicao(prova)}
                    className="p-1 rounded text-slate-500 hover:bg-slate-100"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}


      {/* Paginação */}
      <div className="flex items-center justify-start gap-3 h-8 bg-white border-t border-gray-100">
        <button
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          disabled={pagina === 1 || loading}
          className="p-1 rounded disabled:opacity-40 hover:bg-slate-200 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-[var(--text-dark)]">{pagina} de {totalPaginas}</span>
        <button
          onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          disabled={pagina >= totalPaginas || loading}
          className="p-1 rounded disabled:opacity-40 hover:bg-slate-200 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}