import { useState, useRef } from 'react'
import { UploadCloud } from 'lucide-react'

export default function UploadArea({ onArquivoSelecionado }) {
  const [arrastando, setArrastando] = useState(false)
  const [arquivo, setArquivo] = useState(null)
  const inputRef = useRef(null)

  function validarESetar(file) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      alert('Somente arquivos no formato .XLSX são aceitos.')
      return
    }
    setArquivo(file)
    onArquivoSelecionado?.(file)
  }

  function handleDrop(event) {
    event.preventDefault()
    setArrastando(false)
    const file = event.dataTransfer.files?.[0]
    validarESetar(file)
  }

  function handleSelecionarArquivo(event) {
    const file = event.target.files?.[0]
    validarESetar(file)
  }

  return (
    <div className="w-full bg-white rounded-[40px] shadow-md p-10  flex flex-col gap-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-full border-2 border-slate-300 flex items-center justify-center">
          <UploadCloud size={28} className="text-zinc-800" />
        </div>
        <h2 className="text-2xl font-medium text-zinc-800">Upload de arquivos</h2>
      </div>

      {/* Área de drop */}
      <label
        htmlFor="upload-csv"
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 py-16 rounded-3xl border-2 border-dashed cursor-pointer transition-colors
          ${arrastando ? 'border-orange-400 bg-orange-50' : 'border-slate-300 bg-white'}`}
      >
        <UploadCloud size={40} className="text-zinc-800" />

        <p className="text-xl font-medium text-zinc-800 text-center">
          {arquivo ? arquivo.name : 'Selecione um arquivo ou arraste para cá'}
        </p>

        {!arquivo && (
          <p className="text-sm text-gray-400 text-center">Somente arquivo no formato .xlsx</p>
        )}

        <input
          ref={inputRef}
          id="upload-csv"
          type="file"
          accept=".xlsx"
          onChange={handleSelecionarArquivo}
          className="hidden"
        />
      </label>
    </div>
  )
}
