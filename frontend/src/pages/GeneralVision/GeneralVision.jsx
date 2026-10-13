// Visão Geral
import HistoricoChart from "../../components/Grafics/GraficLine"
import { useState, useEffect } from 'react'
import api from '../../services/api'

// Função auxiliar para buscar todas as páginas (reaproveitada da sua tabela)
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

function RankingItem({ course, percentage }) {
  return (
    <div 
      className="px-1 py-0.5 rounded-sm flex items-center bg-gradient-to-r from-orange-300 to-orange-300/0"
      style={{ width: `${percentage}%`, minWidth: '35%' }}
    >
      <span className="text-[var(--text-dark)] text-sm font-semibold uppercase">{course}</span>
      <span className="text-[var(--text-dark)] text-xs font-medium uppercase ml-auto">{percentage}%</span>
    </div>
  )
}

export default function GeneralVision() {

  const [totalAlunos, setTotalAlunos] = useState(0)
  const [totalAprovados, setTotalAprovados] = useState(0)
  const [ranking, setRanking] = useState([]) // Estado dinâmico para o ranking
  const [loading, setLoading] = useState(true)
  const [dadosGrafico, setDadosGrafico] = useState([])

  // Estados para armazenar os dados crus vindos da API
  const [dadosBrutos, setDadosBrutos] = useState({ alunos: [], matriculas: [], cursos: [], provas: [] })

  // Estados para o Filtro de Período
  const [semestresDisponiveis, setSemestresDisponiveis] = useState([])
  const [semestreSelecionado, setSemestreSelecionado] = useState('') // Vazio = Todos os semestres

  useEffect(() => {
    async function carregarDadosDashboard() {
      try {
        // Busca todos os dados necessários em paralelo
        const [alunos, matriculas, cursos, provas] = await Promise.all([
          buscarTodos('/alunos/'),
          buscarTodos('/matricula/'),
          buscarTodos('/cursos/'),
          buscarTodos('/proficiencia/historico/')
        ]);

        setDadosBrutos({ alunos, matriculas, cursos, provas });

        // Extrai todos os semestres únicos que existem nas matrículas para o Select de filtro
        const semestresUnicos = [...new Set(matriculas.map(m => m.semestre_referencia).filter(Boolean))].sort().reverse();
        setSemestresDisponiveis(semestresUnicos);
        } catch (err) {
        console.error("Erro ao carregar banco de dados para o Dashboard:", err)
      } finally {
        setLoading(false)
      }
    }
    carregarDadosDashboard()
  }, [])

  // Sempre que os dados brutos ou o SEMESTRE selecionado mudarem, recalculamos a tela
  useEffect(() => {
    if (dadosBrutos.alunos.length === 0) return;

    const { alunos, matriculas, cursos, provas } = dadosBrutos;

    // APLICAÇÃO DO FILTRO
    // Se o usuário selecionou um semestre, filtramos as matrículas e provas para aquele semestre.
    const matriculasFiltradas = semestreSelecionado 
      ? matriculas.filter(m => m.semestre_referencia === semestreSelecionado)
      : matriculas;

    const provasFiltradas = semestreSelecionado
      ? provas.filter(p => p.semestre_prova === semestreSelecionado)
      : provas;

    // Para saber o total de alunos filtrados, cruzamos com as matrículas daquele semestre
    const idsAlunosNoSemestre = new Set(matriculasFiltradas.map(m => m.aluno));
    const alunosFiltrados = semestreSelecionado 
      ? alunos.filter(a => idsAlunosNoSemestre.has(a.id))
      : alunos;

    // CÁLCULO DOS TOTAIS
    setTotalAlunos(alunosFiltrados.length);
    const aprovados = alunosFiltrados.filter(a => a.aprovado_geral);
    setTotalAprovados(aprovados.length);

    // CÁLCULO DO RANKING POR CURSO
    const mapaCursos = {};
    cursos.forEach(c => { mapaCursos[c.id] = c.nome; });

    const statsPorCurso = {};
    matriculasFiltradas.forEach(m => {
      const nomeCurso = mapaCursos[m.curso] || 'Não Atribuído';
      if (!statsPorCurso[nomeCurso]) statsPorCurso[nomeCurso] = { total: 0, aprovados: 0 };
      
      statsPorCurso[nomeCurso].total += 1;
      const alunoInfo = alunos.find(a => a.id === m.aluno);
      if (alunoInfo && alunoInfo.aprovado_geral) {
        statsPorCurso[nomeCurso].aprovados += 1;
      }
    });

    const rankingCalculado = Object.keys(statsPorCurso).map(curso => {
      const stats = statsPorCurso[curso];
      return { 
        course: curso, 
        percentage: stats.total > 0 ? Math.round((stats.aprovados / stats.total) * 100) : 0 
      };
    }).sort((a, b) => b.percentage - a.percentage);

    setRanking(rankingCalculado.slice(0, 6)); // Pega apenas os 6 melhores

    // CÁLCULO DOS DADOS PARA O GRÁFICO 
    // Agrupa as provas pelo semestre_prova para mostrar a evolução ao longo do tempo
    const graficoMap = {};
    provasFiltradas.forEach(p => {
      const sem = p.semestre_prova;
      if (!sem) return;
      if (!graficoMap[sem]) graficoMap[sem] = { name: sem, totalProvas: 0, provasAprovadas: 0 };
      
      graficoMap[sem].totalProvas += 1;
      if (parseFloat(p.nota) >= 7) {
        graficoMap[sem].provasAprovadas += 1;
      }
    });

    // Converte para um array ordenado por semestre (ex: 2023.1, 2023.2, 2024.1...)
    const dadosGraficoFormatados = Object.values(graficoMap).sort((a, b) => a.name.localeCompare(b.name));
    setDadosGrafico(dadosGraficoFormatados);

  }, [dadosBrutos, semestreSelecionado]);


  const percentualAprovados = totalAlunos > 0
    ? ((totalAprovados / totalAlunos) * 100).toFixed(1)
    : 0

  if (loading) return <div className="p-5 text-sm text-gray-500">Construindo DashBoard...</div>
  

  return (
    <div className=" w-full min-h-screen flex flex-col bg-[var(--background-general)]">
      
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
          <div className="min-w-64 min-h-48 bg-white rounded-2xl p-1 flex flex-col items-center gap-2 shadow-md">
            <h3 className="text-[var(--text-dark)] text-[20px] text-center font-semibold">Filtro de Período</h3>

            <select 
              className="w-full border border-gray-300 rounded p-2 text-gray-700 outline-none focus:border-blue-500"
              value={semestreSelecionado}
              onChange={(e) => setSemestreSelecionado(e.target.value)}
            >
              <option value="">Todos os Semestres (Geral)</option>
              {semestresDisponiveis.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha 2: Ranking */}
        <div className="flex flex-wrap gap-6 mb-1">
          <div className="flex-1 min-w-50 bg-white rounded-2xl p-3 flex flex-col gap-2">
            <h3 className="text-[var(--text-dark)] text-center text-[20px] font-semibold ">Ranking de aprovação por curso</h3>
            <div className="flex flex-col gap-2">
              {ranking.length > 0 ? ranking.map((item) => (
                <RankingItem
                  key={item.course}
                  course={item.course}
                  percentage={item.percentage}
                />
              )) : (
                <p className="text-start text-sm text-gray-400 mt-4">Nenhum dado encontrado.</p>
              )}
            </div>
          </div>
        </div>

        {/* Linha 3: Histórico */}
        <div className="w-full h-68 bg-white rounded-2xl shadow-md p-1 flex flex-col gap-1">
          <h3 className="text-[var(--text-dark)] text-[20px] font-semibold text-center">Evolução o Desempenho</h3>
          <div className="w-full h-68 overflow-x-auto flex items-end gap-4">
            {dadosGrafico.length > 0 ? (
              <HistoricoChart data={dadosGrafico}/>
            ):(
              <p className="text-sm text-gray-400">Dados Insuficientes para gerar o gráfico</p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}