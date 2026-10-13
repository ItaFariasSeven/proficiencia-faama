// Prazo de 75%
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'
import ButtonExport from '../../components/Buttons/Buttonexport'
import ButtonAddUser from '../../components/Buttons/ButtonAddUser'
import HistoricoProvasCard from '../../components/HistoricoProvasCard/HistoricoProvasCard'
import TablePorcent75 from '../../components/Table/TablePorcent75'
import api from '../../services/api'

// Função auxiliar para buscar todas as páginas da API
async function buscarTodos(urlInicial) {
  let url = urlInicial
  let todos = []
  while (url) {
    const { data } = await api.get(url)
    if (Array.isArray(data)) return data
    todos = [...todos, ...(data.results || [])]
    url = data.next ? data.next.replace(/^https?:\/\/[^/]+/, '') : null
  }
  return todos
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

  const [totalAlunos, setTotalAlunos] = useState(0)
  const [totalAprovados, setTotalAprovados] = useState(0)
  const [totalPerto75, setTotalPerto75] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarDados() {
      try {
        // Busca alunos e matrículas ao mesmo tempo
        const [alunos, matriculas] = await Promise.all([
          buscarTodos('/alunos/'),
          buscarTodos('/matricula/')
        ]);

        // Total de alunos
        setTotalAlunos(alunos.length);

        // Aprovados
        const aprovados = alunos.filter((a) => a.aprovado_geral);
        setTotalAprovados(aprovados.length);

        // Alunos com 75% ou mais , Filtra matrículas com percentual >= 75
        const matriculas75 = matriculas.filter((m) => parseFloat(m.percentual_curso) >= 75);
        
        // Pega IDs únicos de alunos para não contar o mesmo aluno duas vezes se ele tiver mais de uma matrícula >= 75
        const idsAlunos75 = new Set(matriculas75.map(m => m.aluno));
        
        // Conta quantos alunos reais existem com esses IDs
        const alunosCom75 = alunos.filter(a => idsAlunos75.has(a.id)).length;
        setTotalPerto75(alunosCom75);

      } catch (err) {
        console.error("Erro ao carregar dados dos cards 75%:", err)
      } finally {
        setLoading(false)
      }
    }
    
    carregarDados()
  }, [])

  const percentualAprovados = totalAlunos > 0
    ? ((totalAprovados / totalAlunos) * 100).toFixed(1)
    : 0

  const percentual75 = totalAlunos > 0
    ? ((totalPerto75 / totalAlunos) * 100).toFixed(1)
    : 0

  if (loading) return <div className="p-5 text-sm text-gray-500 text-center mt-10">Carregando métricas...</div>

  return (
    <div className='text-end p-0'>
      <div className="flex-col p-1">

        {/* Linha 1: Cards de estatísticas */}
        <div className="flex flex-row gap-2 mb-1">
          <StatCard
            title="Total de alunos que fizeram a prova"
            value={totalAlunos}
          />
          <StatCard
            title="Aprovados"
            value={`${percentualAprovados}%`}
            subvalue={`${totalAprovados} alunos`}
          />
          <StatCard
            title="Alunos Próximos de 75% do curso"
            value={`${percentual75}%`}
            subvalue={`${totalPerto75} alunos`}
          />
        </div>

      <div>
        <TablePorcent75></TablePorcent75>
      </div>
    </div>
    </div>
    
  )
}