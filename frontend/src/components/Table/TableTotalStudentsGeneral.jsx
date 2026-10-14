// Todos os alunos - Geral
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchParams } from "react-router-dom";
import SearchBar from '../../components/SearchBar/SearchBar';
import HistoricoProvasCard from '../../components/HistoricoProvasCard/HistoricoProvasCard'
import FilterSelect from '../../components/Filter/FilterSelect';
import api from '../../services/api'


// 👇 Mapeia o status pra cor do badge (evita repetir lógica de cor em cada linha)
const STATUS_STYLES = {
  Aprovado: 'bg-green-100 text-green-700',
  Reprovado: 'bg-red-50 text-rose-600',
}


export default function TableTotalStudentsGeneral() {
  const [alunos, setAlunos] = useState([])
  const [selecionados, setSelecionados] = useState([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1) 
  const [ordenacao, setOrdenacao] = useState({ campo: 'ra', direcao: 'asc' })
  const [filtros, setFiltros] = useState({ periodo: '', curso: '', status: '' })
  const [loading, setLoading] = useState(true)

  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregarAlunos()
  }, [pagina, busca, filtros])

  async function carregarAlunos() {
    setLoading(true)
    try {
      // Monta a URL com a página atual e a busca
      let urlParams = `?page=${pagina}`;
      if (busca) urlParams += `&search=${busca}`;

      // APLICAR OS FILTROS NA API
      if (filtros.status) urlParams += `&status=${filtros.status.toLowerCase()}`;
      if (filtros.curso) urlParams += `&curso=${filtros.curso}`;
      if (filtros.periodo) urlParams += `&semestre=${filtros.periodo}`;

      const { data } = await api.get(`/alunos/${urlParams}`)

      // Calcula o total de páginas com base no "count" retornado pelo DRF
      const totalRegistros = data.count || data.results?.length || 0;
      setTotalPaginas(Math.ceil(totalRegistros / 20) || 1);

      // Pega os 20 alunos desta página
      const results = Array.isArray(data) ? data : (data.results || []);

      setAlunos(results.map((a) => ({
        id: a.id,
        ra: a.ra || a.id,
        nome: a.nome,
        email: a.email,
        status: a.aprovado_geral ? 'Aprovado' : 'Reprovado',
        anoAprovacao: a.data_aprovacao_geral || '—',
        curso: a.curso_nome || '-', 
        percentualCurso: a.percentual_curso ? Math.round(a.percentual_curso) : 0,
      })))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

    // 👇 Aplica a ordenação sobre os alunos já trazidos da API
    const alunosOrdenados = [...alunos].sort((a, b) => {
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
        <div className="w-12 text-xs text-start font-semibold text-gray-900 uppercase tracking-wide">RA</div>

        <button
          onClick={() => handleOrdenar('nome')} 
          className="w-58 flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide"
        >
          Nome
          {ordenacao.campo === 'nome' ? (
            ordenacao.direcao === 'asc' ? <ChevronDown size={14} className='rotate-180' /> : <ChevronDown size={14} />
          ):(
            <ChevronDown size={14} className='opacity-30' />
          )}
        </button>

        <div className="w-75 text-xs text-start font-semibold text-gray-600 uppercase tracking-wide">
          Email
        </div>

        <button
          onClick={() => handleOrdenar('status')}
          className="w-28 flex items-center gap-1 text-xs text-center pl-6 font-semibold text-gray-600 uppercase tracking-wide"
        >
          Status
          {ordenacao.campo === 'status' ? (
            ordenacao.direcao === 'asc' ? <ChevronDown size={14} className='rotate-180' /> : <ChevronDown size={14} />
          ):(
            <ChevronDown size={14} className='opacity-30' />
          )}
        </button>

        <div className="w-30 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Ano Aprovação
        </div>

        <div className="w-30 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Curso
        </div>

        <div className="w-20 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
          % de Curso
        </div>
      </div>

      {/* Linhas */}
      {alunosOrdenados.map((aluno, index) => (
        <div
          key={aluno.id}
          className={`flex items-center text-start gap-2 px-5 py-1 h-16 ${
            index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
          }`}
        >

          <div className="w-12 text-sm font-medium text-[var(--text-dark)]">{aluno.ra}</div>

          <div className="w-58 text-sm text-start font-medium text-[var(--text-dark)] truncate">{aluno.nome}</div>

          <div className="w-75 text-sm text-start text-[var(--text-dark)] truncate">{aluno.email}</div>

          <div className="w-28 text-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                STATUS_STYLES[aluno.status]
              }`}
            >
              {aluno.status}
            </span>
          </div>

          <div className="w-30  text-center text-sm text-[var(--text-dark)]">
            {aluno.anoAprovacao || '—'}
          </div>

          <div className="w-30 text-center text-sm text-[var(--text-dark)]">{aluno.curso}</div>

          <div className="w-24 text-center text-sm text-[var(--text-dark)]">{aluno.percentualCurso}%</div>

          {/* Histórico de provas por semestre */}
          <div className="bg-white">
            <HistoricoProvasCard alunoId={aluno.id} alunoNome={aluno.nome} />
          </div>
        </div>
      ))}


      {/* Paginação */}
      <div className="flex items-center justify-start gap-3 h-8 bg-white border-t border-gray-100">
        <button
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          disabled={pagina === 1 || loading}
          className="p-1 rounded disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-[var(--text-dark)]">{pagina} de {totalPaginas}</span>
        <button
          onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          disabled={pagina >= totalPaginas || loading}
          className="p-1 rounded disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}