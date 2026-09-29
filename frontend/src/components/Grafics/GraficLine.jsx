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
} from 'chart.js'

// Registra tudo que vamos usar — SEM ISSO O GRÁFICO NÃO RENDERIZA
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)


export default function HistoricoChart() {
  const data = {
    labels: [
      '2016.1', '2016.2', '2017.1', '2017.2', '2018.1', '2018.2',
      '2019.1',  
    ],
    datasets: [
      {
        label: 'Taxa de aprovação',
        data: [30, 40, 50, 60, 40, 62, 58, 65, ],
        borderColor: 'rgb(34, 197, 94)',        // verde (linha)
        backgroundColor: 'rgba(34, 197, 94, 0.2)', // verde clarinho (área embaixo)
        tension: 0.3,   // deixa a linha "curvada" em vez de reta pontuda
        fill: true,     // preenche a área abaixo da linha
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false, // permite controlar altura via CSS
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

  return (
    <div style={{ width: '100%', height: '255px' }}>
      <Line data={data} options={options} />
    </div>
  )
}