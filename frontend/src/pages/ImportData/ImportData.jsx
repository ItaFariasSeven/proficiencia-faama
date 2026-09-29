import UploadArea from '../../components/UploadArea/UploadArea'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

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
    anoRealizacaoProva: '2024.1',
    notaMatematica: 8.5,
    notaPortugues: 7.0,
    curso: 'ADS',
    percentualCurso: 50,
  },
  {
    id: 2,
    ra: 2,
    nome: 'Ahmad Rosser',
    email: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla...',
    status: 'Reprovado',
    anoRealizacaoProva: '2024.2',
    notaMatematica: 8.5,
    notaPortugues: 7.0,
    curso: 'ADS',
    percentualCurso: 50,
},
{
    id: 3,
    ra: 3,
    nome: 'Zain Calzoni',
    email: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla...',
    status: 'Reprovado',
    anoRealizacaoProva: '',
    notaMatematica: 8.5,
    notaPortugues: 7.0,
    curso: 'ADS',
    percentualCurso: 50,
},
{
    id: 4,
    ra: 4,
    nome: 'Omar Levin',
    email: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla...',
    status: 'Aprovado',
    anoRealizacaoProva: '2024.2',
    notaMatematica: 8.5,
    notaPortugues: 7.0,
    curso: 'ADS',
    percentualCurso: 75,
  },
]

export default function ImportData() {

  function handleArquivo(file) {
    console.log('Arquivo selecionado:', file)
    // lógica de upload/parse do CSV aqui
  }

  const [alunos, setAlunos] = useState([])
  const [selecionados, setSelecionados] = useState([])
  const [pagina, setPagina] = useState(1)
  const [ordenacao, setOrdenacao] = useState({ campo: 'ra', direcao: 'asc' })
  const [loading, setLoading] = useState(true)

  const ITENS_POR_PAGINA = 6000

  

    useEffect(() => {
      setAlunos(alunosMock)
      setLoading(false)
    }, [])

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
      selecionados.length === alunos.length ? [] : alunos.map((a) => a.id)
    )
  }

  if (loading) return <div className="p-5 text-sm text-gray-500">Carregando...</div>

  return (
    <div>
      <div className="w-full p-6">
        <UploadArea onArquivoSelecionado={handleArquivo} />
      </div>
      <div className="w-full bg-white rounded-lg shadow-[0px_4px_4px_0px_rgba(69,75,87,0.12)] overflow-hidden">
      {/* Cabeçalho da tabela */}
      <div className="flex items-center gap-2 px-5 py-2 bg-slate-50/75 border-b border-slate-200">
        <input
            type="checkbox"
            checked={selecionados.length === alunos.length && alunos.length > 0}
            onChange={toggleTodos}
            className="size-4 rounded-sm border border-neutral-300" />
        <div className="w-8 text-center text-xs font-semibold text-gray-900 uppercase tracking-wide">RA</div>
        <div className="w-58 pl-6 flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Nome
        </div>
        <div className="w-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Email
        </div>
        <div className="w-25 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          nota Matematica
        </div>
        <div className="w-25 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          nota Português
        </div>
        <div className="w-28 flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Status
        </div>
        <div className="w-22 text-right mr-7 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Data Prova
        </div>
        <div className="w-20 text-right mr-8 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Curso
        </div>
        <div className="w-24 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
          % de Curso
        </div>
      </div>
      {/* Linhas */}
      {alunos.map((aluno, index) => (
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
          <div className="w-50 text-sm text-[var(--text-dark)] truncate">{aluno.email}</div>
          <div className="w-20 text-sm text-[var(--text-dark)] truncate">{aluno.notaMatematica}</div>
          <div className="w-20 text-sm text-[var(--text-dark)] truncate">{aluno.notaPortugues}</div>
          <div className="w-12">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                STATUS_STYLES[aluno.status]
              }`}
            >
              {aluno.status}
            </span>
          </div>
          <div className="w-28 text-right text-sm text-[var(--text-dark)]">
            {aluno.anoRealizacaoProva || '—'}
          </div>
          <div className="w-28 text-right text-sm text-[var(--text-dark)]">{aluno.curso}</div>
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
    </div>
  )
}