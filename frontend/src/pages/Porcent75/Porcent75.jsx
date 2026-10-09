// Prazo de 75%
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'
import ButtonExport from '../../components/Buttons/Buttonexport'
import ButtonAddUser from '../../components/Buttons/ButtonAddUser'
import HistoricoProvasCard from '../../components/HistoricoProvasCard/HistoricoProvasCard'
import TablePorcent75 from '../../components/Table/TablePorcent75'
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

export default function Porcent75() {

  const [totalAlunos, setTotalAlunos] = useState(0)
  const [totalAprovados, setTotalAprovados] = useState(0)
  const [loading, setLoading] = useState(true)

  const percentualAprovados = totalAlunos > 0
    ? ((totalAprovados / totalAlunos) * 100).toFixed(1)
    : 0

  return (
    <div className='text-end p-0'>
      <div className="flex-col p-1">

        {/* Linha 1: Cards de estatísticas */}
        <div className="flex flex-row gap-2 mb-1">
          <StatCard
            title="Total de alunos que fizeram a prova"
            value={totalAlunos}
            // subvalue={subvalue}
          />
          <StatCard
            title="Aprovados"
            value={`${percentualAprovados}%`}
            // subvalue={totalAprovados}
          />
          <StatCard
            title="Alunos Próximos de 75% do curso"
            // value={`${percentualPerto75}%`}
            // subvalue={totalAprovados}
          />
        </div>

      <div>
        <TablePorcent75></TablePorcent75>
      </div>
    </div>
    </div>
    
  )
}