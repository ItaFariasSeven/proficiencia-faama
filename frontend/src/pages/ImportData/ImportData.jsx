// Importar dados
import { useState } from 'react'
import api from '../../services/api'
import UploadArea from '../../components/UploadArea/UploadArea'
import ScreenConferenciaImport from '../../components/ConferenciaImport/ScreenConferenciaImport'

export default function ImportData() {
  const [preview, setPreview] = useState(null)
  const [resumoFinal, setResumoFinal] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleArquivo(file) {
    setEnviando(true)
    setErro('')
    setPreview(null)
    setResumoFinal(null)

    try {
      const formData = new FormData()
      formData.append('arquivo', file)

      const { data } = await api.post(
        '/proficiencia/upload-planilha/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      setPreview(data)
    } catch (err) {
      setErro(err.response?.data?.detail || err.response?.data?.erro || 'Erro ao enviar o arquivo.')
    } finally {
      setEnviando(false)
    }
  }

  function handleConcluido(data) {
    setResumoFinal(data.resumo)
    setPreview(null)
  }

  return (
    <div className="w-full p-6 space-y-6">
      {!preview && !resumoFinal && (
        <UploadArea onArquivoSelecionado={handleArquivo} />
      )}

      {enviando && <p className='text-sm text-gray-500'>Enviando...</p>}
      {erro && <p className='text-sm text-red-500'>{erro}</p>}

      {preview && (
        <ScreenConferenciaImport
          preview={preview.preview}
          arquivoName={preview.arquivo_name}
          onConcluido={handleConcluido}
        />
      )}

      {resumoFinal && (
        <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
          <p className='text-sm text-green-700 font-medium'>
            Importação concluída com sucesso!
          </p>
          <p className='text-sm text-green-600'>
            {resumoFinal.alunos_novos} novos alunos, {resumoFinal.provas_registradas} provas registradas, {resumoFinal.vinculados} vínculos.
          </p>
        </div>
      )}
    </div>
  )
}
