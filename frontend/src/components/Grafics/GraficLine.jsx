import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,   // eixo X (categorias, ex: "2016.1", "2016.2"...)
  LinearScale,     // eixo Y (números, ex: 0%, 25%, 50%...)
  PointElement,    // os pontinhos na linha
  LineElement,     // a linha em si
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Registra tudo que vamos usar — SEM ISSO O GRÁFICO NÃO RENDERIZA
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)


export default function HistoricoChart({ data = [] }) {
  // Extrai apenas os nomes dos semestres para o Eixo X
  const labelsEixoX = data.map(item => item.name);

  // Calcula a porcentagem de aprovação para cada semestre para o Eixo Y
  const valoresEixoY = data.map(item => {
    if (item.totalProvas === 0) return 0;
    // Calcula: (20 aprovados / 45 total) * 100 = 44%
    return Math.round((item.provasAprovadas / item.totalProvas) * 100);
  });

  // Monta o objeto no formato exato que o Chart.js exige
  const chartData = {
    labels: labelsEixoX,
    datasets: [
      {
        label: 'Taxa de aprovação',
        data: valoresEixoY,
        borderColor: 'rgb(34, 197, 94)',        // verde (linha)
        backgroundColor: 'rgba(34, 197, 94, 0.2)', // verde clarinho (área embaixo)
        tension: 0.3,   // deixa a linha "curvada" em vez de reta pontuda
        fill: true,     // preenche a área abaixo da linha
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`, // adiciona % nos números do eixo Y
        },
      },
    },
  }

  // Se não houver dados, mostra um aviso
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-[255px] text-gray-400 text-sm font-medium">
        Não há dados suficientes para gerar o histórico.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '255px' }}>
      <Line data={chartData} options={options} />
    </div>
  )
}