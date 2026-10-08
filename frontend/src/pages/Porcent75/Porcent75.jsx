// Prazo de 75%
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchParams } from 'react-router-dom' 
import SearchBar from '../../components/Searchbar/SearchBar' 
import api from '../../services/api'



// 👇 Mapeia o status pra cor do badge (evita repetir lógica de cor em cada linha)
const STATUS_STYLES = {
  Aprovado: 'bg-green-100 text-green-700',
  Reprovado: 'bg-red-50 text-rose-600',
}

function StatCard({ title, value, subvalue, children }) {
  return (
    <div className="flex-1 min-w-72 min-h-48 bg-white rounded-2xl shadow-md p-1 flex flex-col gap-5">
      <h3 className="text-[var(--text-dark)] text-[20px] text-center font-semibold">{title}</h3>
      <p className="text-[var(--text-dark)] text-[40px] text-center font-medium">{value}</p>
      {subvalue && (
        <p className="text-[var(--text-dark)] text-[20px] text-center font-medium">{subvalue}</p>
      )}
      {children}
    </div>
  )
}

export default function Porcent75() {
    const [alunos, setAlunos] = useState([])
    const [selecionados, setSelecionados] = useState([])
    const [pagina, setPagina] = useState(1)
    const [ordenacao, setOrdenacao] = useState({ campo: 'ra', direcao: 'asc' })
    const [loading, setLoading] = useState(true)


    const [searchParams, setSearchParams] = useSearchParams()
    const busca = searchParams.get('busca') ?? ''

    useEffect(() => {
    async function carregar() {
      try {
        let url = '/matricula/'   
        let todos = []
        while (url) {
          const { data } = await api.get(url)
          todos = [...todos, ...data.results]
          url = data.next ? data.next.replace(/^https?:\/\/[^/]+/, '') : null
        }
        setAlunos(todos.map((m) => ({
          id: m.id,
          ra: m.aluno,
          nome: m.aluno_nome ?? '-',
          email: m.aluno_email ?? '-',
          status: m.aprovado ? 'Aprovado' : 'Reprovado',
          anoAprovacao: m.semestre_referencia ?? '',
          curso: m.curso_nome ?? '-',
          percentualCurso: m.percentual_curso ?? 0,
        })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  const alunosFiltrados = alunos.filter((aluno) =>
      aluno.nome.toLowerCase().includes(busca.toLowerCase())
  )

    // 👇 Aplica a ordenação sobre os alunos já filtrados pela busca
  const alunosOrdenados = [...alunosFiltrados].sort((a, b) => {
    const { campo, direcao } = ordenacao
    const valorA = a[campo]
    const valorB = b[campo]
    if (typeof valorA === 'string') {
      return direcao === 'asc' ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA)
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

  const alunosCom50 = alunos.filter((a) => a.percentualCurso >= 50).length
  const alunosCom75 = alunos.filter((a) => a.percentualCurso >= 75).length

  if (loading) return <div className="p-5 text-sm text-gray-500">Carregando...</div>

  return (
    <div className="w-full bg-white rounded-lg shadow-[0px_4px_4px_0px_rgba(69,75,87,0.12)] overflow-hidden ">
        <div className="flex-col p-2 bg-[var(--background-general)]">
        {/* Linha 1: Cards de estatísticas */}
        <div className="flex flex-row gap-2 mb-1">
          <StatCard
            title="Alunos com 50% do curso"
            value={alunosCom50}
          />
          <StatCard
            title="Alunos com 75% do curso"
            value={alunosCom75}
          />
          <div className="min-w-64 min-h-48 bg-white rounded-2xl p-1 flex flex-col items-center gap-2 shadow-md">
            <h3 className="text-[var(--text-dark)] text-[20px] text-center font-semibold">Filtro de Curso</h3>
          </div>
        </div>
        </div>

        {/* Barra de pesquisa */}
        <SearchBar busca={busca} onBusca={handleBusca} />

      {/* Cabeçalho da tabela */}
      <div className="flex items-center gap-5 px-5 py-2 bg-slate-50/75 border-b border-slate-200">
        <input 
            type="checkbox" 
            className="size-4 rounded-sm border border-neutral-300" 
            checked={selecionados.length === alunosOrdenados.length && alunosOrdenados.length > 0}
            onChange={toggleTodos} />

        <div className="w-9 text-xs font-semibold text-gray-900 uppercase tracking-wide">RA</div>

        <button
            onClick={() => handleOrdenar('nome')} 
            className="w-48 flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
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
            className="w-28 flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
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
            checked={selecionados.includes(aluno.id)}
            onChange={() => toggleSelecionado(aluno.id)}
            className="size-4 rounded-sm border border-neutral-300" />

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