// Todos os alunos - Matemática
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchParams } from "react-router-dom";
import SearchBar from '../../components/Searchbar/SearchBar';
import FilterSelect from '../../components/Filter/FilterSelect';
import api from '../../services/api'


// 👇 Mapeia o status pra cor do badge (evita repetir lógica de cor em cada linha)
const STATUS_STYLES = {
  Aprovado: 'bg-green-100 text-green-700',
  Reprovado: 'bg-red-50 text-rose-600',
}

const DISCIPLINA = 'MATEMATICA'



// 👇 Busca todas as páginas de um endpoint paginado do DRF
async function buscarTodos(urlInicial) {
  let url = urlInicial
  let todos = []
  while (url) {
    const { data } = await api.get(url)
    todos = [...todos, ...data.results]
    url = data.next ? data.next.replace(/^https?:\/\/[^/]+/, '') : null
  }
  return todos
}

export default function TableTotalStudentsMath() {
    const [alunos, setAlunos] = useState([])
    const [selecionados, setSelecionados] = useState([])
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1) 
    const [ordenacao, setOrdenacao] = useState({ campo: 'ra', direcao: 'asc' })
    const [filtros, setFiltros] = useState({ periodo: '', curso: '', status: '' })
    const [loading, setLoading] = useState(true)

    const [searchParams, setSearchParams] = useSearchParams()
    const busca = searchParams.get('busca') ?? ''

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
      if (filtros.periodo) urlParams += `&ano_realizacao=${filtros.periodo}`;

      const { data } = await api.get(`/alunos/${urlParams}`)

      // Calcula o total de páginas com base no "count" retornado pelo DRF
      const totalRegistros = data.count || data.results?.length || 0;
      setTotalPaginas(Math.ceil(totalRegistros / 20) || 1);

      // Pega os 20 alunos desta página
      const results = Array.isArray(data) ? data : (data.results || []);

      setAlunos(results.map((a) => ({
        id: a.id,
        ra: a.id,
        nome: a.nome,
        email: a.email,
        status: a.aprovado_geral ? 'Aprovado' : 'Reprovado',
        anoAprovacao: a.data_aprovacao_geral ?? '',
        curso: '-',
        percentualCurso: 0,
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

  function handleBusca(event) {
    const valor = event.target.value;

    // Cria uma cópia dos parâmetros atuais.
    const novosParametros = new URLSearchParams(searchParams);

    // Se houver alguma coisa digitada, adiciona na URL.
    if (valor.trim()) {
        novosParametros.set(
            "busca",
            valor
        );
    } else {
        // Se apagar a busca inteira, remove a busca da URL.
        novosParametros.delete(
            "busca"
        );
    }
    // replace evita criar dezenas de entradas no histórico enquanto o usuário digita.
    setSearchParams(
        novosParametros,
        {
            replace: true
        }
    );
  }

  // 👇 Alterna a ordenação ao clicar no cabeçalho
  function handleOrdenar(campo) {
    setOrdenacao((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc',
    }))
  }

  // 👇 Marca/desmarca um checkbox individual
  function toggleSelecionado(id) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // 👇 Marca/desmarca todos de uma vez
  function toggleTodos() {
    setSelecionados(
      selecionados.length === alunosOrdenados.length ? [] : alunosOrdenados.map((a) => a.id)
    )
  }

    if (loading) return <div className="p-5 text-sm text-gray-500">Carregando...</div>

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

        <div className="w-8 text-start text-xs font-semibold text-gray-900 uppercase tracking-wide">RA</div>

        <button
            onClick={() => handleOrdenar('nome')} 
            className="w-58 flex items-center text-start gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
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

        <div className="w-18 text-xs text-center font-semibold text-gray-600 uppercase tracking-wide">
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

        <div className="w-28 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Data Prova
        </div>

        <div className="w-20 text-center mr-8 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Curso
        </div>

        <div className="w-24 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
          % de Curso
        </div>
      </div>

      {/* Linhas */}
      {alunosOrdenados.map((aluno, index) => (
        <div
          key={aluno.linhaIdid}
          className={`flex items-center gap-2 px-5 py-1 h-16 ${
            index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
          }`}
        >

          <div className="w-8 text-sm text-start font-medium text-[var(--text-dark)]">{aluno.ra}</div>

          <div className="w-58 text-sm text-start font-medium text-[var(--text-dark)] truncate">{aluno.nome}</div>

          <div className="w-80 text-sm text-start text-[var(--text-dark)] truncate">{aluno.email}</div>

          <div className="w-18 text-sm text-center text-[var(--text-dark)] truncate">{aluno.nota}</div>

          <div className="w-28 text-center">
            <span
              className={`inline-flex items-center rounded-full text-xs text-center  font-medium ${
                STATUS_STYLES[aluno.status]
              }`}
            >
              {aluno.status}
            </span>
          </div>

          <div className="w-28 text-sm text-center text-[var(--text-dark)]">
            {aluno.anoRealizacaoProva || '—'}
          </div>

          <div className="w-28 text-center text-sm text-[var(--text-dark)]">{aluno.curso}</div>

          <div className="w-24 text-center text-sm text-[var(--text-dark)]">{aluno.percentualCurso}%</div>
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