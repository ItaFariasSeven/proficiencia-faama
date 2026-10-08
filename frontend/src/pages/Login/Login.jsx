// Login
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import LogoFaama from "../../assets/images/logoFaama.png"


export default function Login() {

  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setErro("")
    try {
      const { data } = await api.post("/api/login/", {
        username: usuario,
        password: senha,
      })
      localStorage.setItem("token", data.token)
      navigate("/visaogeral")
    } catch {
      setErro("Usuário ou senha inválidos.")
    }
  }

  return (
    <div className="w-full md:w-full lg:w-full min-h-screen bg-slate-900 flex flex-col items-center px-4 py-10">
      {/* Logo */}
      <img className="w-54 md:w-60" src={LogoFaama} alt="FAAMA" />

      {/* Título */}
      <h1 className="text-[var(--text-light)] text-5xl md:text-7xl font-['Kavoon'] mt-8 mb-10">
        Proficiência
      </h1>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="usuario" className="text-[var(--text-light)] text-2xl md:text-3xl font-['Gabarito']">
            Usuário
          </label>
          <input
            id="usuario"
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Usuário do CADI ou RA de Aluno"
            className="w-full h-14 bg-rose-50 rounded-2xl px-4 text-slate-900 text-xl font-['Gabarito'] outline-none"
            />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="senha" className="text-[var(--text-light)] text-2xl md:text-3xl font-['Gabarito']">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            className="w-full h-14 bg-rose-50 rounded-2xl px-4 text-slate-900 text-xl font-['Gabarito'] outline-none"
          />
        </div>

        {erro && <p className="text-red-400 text-sm">{erro}</p>}

        <button
          type="submit"
          className="mt-4 bg-blue-800 text-white text-xl font-['Gabarito'] rounded-xl h-12 hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Login
        </button>
      </form>
    </div>
  );
}
