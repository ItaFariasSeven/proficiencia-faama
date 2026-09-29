import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchParams } from "react-router-dom";
import SearchBar from '../../components/Searchbar/SearchBar';


// 👇 Mapeia o status pra cor do badge (evita repetir lógica de cor em cada linha)
const STATUS_STYLES = {
  Aprovado: 'bg-green-100 text-green-700',
  Reprovado: 'bg-red-50 text-rose-600',
}

const alunosMock = [
  {
    id: 1,
    ra: 1,
    nome: 'Ann Culhane',
    email: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla...',
    status: 'Aprovado',
    anoAprovacao: '2024.1',
    curso: 'ADS',
    percentualCurso: 50,
  },
  {
    id: 2,
    ra: 2,
    nome: 'Ahmad Rosser',
    email: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla...',
    status: 'Reprovado',
    anoAprovacao: '2024.2',
    curso: 'ADS',
    percentualCurso: 50,
  },
  {
    id: 3,
    ra: 3,
    nome: 'Zain Calzoni',
    email: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla...',
    status: 'Reprovado',
    anoAprovacao: '',
    curso: 'ADS',
    percentualCurso: 50,
  },
  {
    id: 4,
    ra: 4,
    nome: 'Omar Levin',
    email: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla...',
    status: 'Aprovado',
    anoAprovacao: '2024.2',
    curso: 'ADS',
    percentualCurso: 75,
  },
]


export default function TotalStudentsGeneral() {
  const [alunos, setAlunos] = useState([])
  const [selecionados, setSelecionados] = useState([])
  const [pagina, setPagina] = useState(1)
  const [ordenacao, setOrdenacao] = useState({ campo: 'ra', direcao: 'asc' })
  const [loading, setLoading] = useState(true)

  const ITENS_POR_PAGINA = 6000

  const [searchParams, setSearchParams] = useSearchParams()
  const busca = searchParams.get('busca') ?? ''

  useEffect(() => {
    setAlunos(alunosMock)
    setLoading(false)
  }, [])
  
  const alunosFiltrados = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(busca.toLowerCase())
  )

    // 👇 Aplica a ordenação sobre os alunos já filtrados pela busca
  const alunosOrdenados = [...alunosFiltrados].sort((a, b) => {
  const { campo, direcao } = ordenacao
  const valorA = a[campo]
  const valorB = b[campo]

  // Compara strings (nome, status, curso, etc.) ignorando maiúsculas/minúsculas
  if (typeof valorA === 'string') {
    return direcao === 'asc'
      ? valorA.localeCompare(valorB)
      : valorB.localeCompare(valorA)
  }

  // Compara números (ra, percentualCurso, etc.)
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
    <SearchBar busca={busca} onBusca={handleBusca} />

      {/* Cabeçalho da tabela */}
      <div className="flex items-center gap-5 px-5 py-2 bg-slate-50/75 border-b border-slate-200">
        <input 
          type="checkbox" 
          className="size-4 rounded-sm border border-neutral-300" 
          checked={selecionados.lenght === alunosOrdenados.length && alunosOrdenados.length > 0}
          onChange={toggleTodos}
        />

        <div className="w-9 text-xs font-semibold text-gray-900 uppercase tracking-wide">RA</div>

        <button
          onClick={() => handleOrdenar('nome')} 
          className="w-48 flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide"
        >
          Nome
          {ordenacao.campo === 'nome' ? (
            ordenacao.direcao === 'asc' ? <ChevronDown size={14} className='rotate-180' /> : <ChevronDown size={14} />
          ):(
            <ChevronDown size={14} className='opacity-30' />
          )}
        </button>

        <div className="w-80 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Email
        </div>

        <button
          onClick={() => handleOrdenar('status')}
          className="w-28 flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide"
        >
          Status
          {ordenacao.campo === 'status' ? (
            ordenacao.direcao === 'asc' ? <ChevronDown size={14} className='rotate-180' /> : <ChevronDown size={14} />
          ):(
            <ChevronDown size={14} className='opacity-30' />
          )}
        </button>

        <div className="w-28 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Ano Aprovação
        </div>

        <div className="w-20 mr-10 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
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
          className={`flex items-center gap-5 px-5 py-1 h-16 ${
            index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
          }`}
        >
          <input 
            type="checkbox" 
            className="size-4 rounded-sm border border-neutral-300" 
            checked={selecionados.includes(aluno.id)}
            onChange={() => toggleSelecionado(aluno.id)}
          />

          <div className="w-9 text-sm font-medium text-[var(--text-dark)]">{aluno.ra}</div>

          <div className="w-48 text-sm font-medium text-[var(--text-dark)] truncate">{aluno.nome}</div>

          <div className="w-80 text-sm text-[var(--text-dark)] truncate">{aluno.email}</div>

          <div className="w-12">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                STATUS_STYLES[aluno.status]
              }`}
            >
              {aluno.status}
            </span>
          </div>

          <div className="w-28 mr-12 text-right text-sm text-[var(--text-dark)]">
            {aluno.anoAprovacao || '—'}
          </div>

          <div className="w-20 text-right text-sm text-[var(--text-dark)]">{aluno.curso}</div>

          <div className="w-24 text-right text-sm text-[var(--text-dark)]">{aluno.percentualCurso}%</div>
        </div>
      ))}


      {/* Paginação */}
      <div className="flex items-center justify-start gap-3 h-8 bg-white border-t border-gray-100">
        <button
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          disabled={pagina === 1}
          className="p-1 rounded disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-[var(--text-dark)]">{pagina} / 01</span>
        <button
          onClick={() => setPagina((p) => p + 1)}
          className="p-1 rounded disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}