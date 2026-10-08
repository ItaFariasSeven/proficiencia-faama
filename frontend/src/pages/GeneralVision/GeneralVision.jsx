// Visão Geral
import HistoricoChart from "../../components/Grafics/GraficLine"
import { useState, useEffect } from 'react'
import api from '../../services/api'

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

function RankingItem({ course, percentage }) {
  return (
    <div 
      className="px-1 py-0.5 rounded-sm flex items-center bg-gradient-to-r from-orange-300 to-orange-300/0"
      style={{ width: `${Math.max(percentage * 2.2, 30)}%` }}
    >
      <span className="text-[var(--text-dark)] text-sm font-semibold uppercase">{course}</span>
      <span className="text-[var(--text-dark)] text-xs font-medium uppercase ml-auto">{percentage}%</span>
    </div>
  )
}

export default function GeneralVision() {

  const [totalAlunos, setTotalAlunos] = useState(0)
  const [totalAprovados, setTotalAprovados] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        let url = '/alunos/'
        let todos = []
        while (url) {
          const { data } = await api.get(url)
          todos = [...todos, ...data.results]
          url = data.next ? data.next.replace(/^https?:\/\/[^/]+/, '') : null
        }
        setTotalAlunos(todos.length)
        setTotalAprovados(todos.filter((a) => a.aprovado_geral).length)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  const ranking = [
    { course: 'ADS', percentage: 42 },
    { course: 'Pedagogia', percentage: 38 },
    { course: 'Enfermagem', percentage: 37 },
    { course: 'Direito', percentage: 35 },
    { course: 'Teologia', percentage: 35 },
    { course: 'Psicologia', percentage: 34 },
  ]

  const percentualAprovados = totalAlunos > 0
    ? ((totalAprovados / totalAlunos) * 100).toFixed(1)
    : 0

  if (loading) return <div className="p-5 text-sm text-gray-500">Carregando...</div>
  

  return (
    <div className=" w-full min-h-screen flex flex-col bg-[var(--background-general)]">
      
      <div className="flex-col p-1">
        {/* Linha 1: Cards de estatísticas */}
        <div className="flex flex-row gap-2 mb-1">
          <StatCard
            title="Total de alunos que fizeram a prova"
            value={totalAlunos}
            subvalue={subvalue}
          />
          <StatCard
            title="Aprovados"
            value={`${percentualAprovados}%`}
            subvalue={totalAprovados}
          />
          <div className="min-w-64 min-h-48 bg-white rounded-2xl p-1 flex flex-col items-center gap-2 shadow-md">
            <h3 className="text-[var(--text-dark)] text-[20px] text-center font-semibold">Filtro de Período</h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mb-1">
          <div className="flex-1 min-w-50 bg-white rounded-2xl p-3 flex flex-col gap-2">
            <h3 className="text-[var(--text-dark)] text-center text-[20px] font-semibold ">Ranking de aprovação por curso</h3>
            <div className="flex flex-col gap-2">
              {ranking.map((item) => (
                <RankingItem
                  key={item.course}
                  course={item.course}
                  percentage={item.percentage}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Linha 3: Histórico */}
        <div className="w-full h-68 bg-white rounded-2xl shadow-md p-1 flex flex-col gap-1">
          <h3 className="text-[var(--text-dark)] text-[20px] font-semibold text-center">Histórico</h3>
          <div className="w-full h-68 overflow-x-auto flex items-end gap-4">
            {/* Aqui entra o gráfico de histórico (recomendo uma lib como Recharts) */}
            <HistoricoChart/>
          </div>
        </div>
      </div>

    </div>
  )
}