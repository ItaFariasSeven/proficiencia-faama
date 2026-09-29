import LogoFaama from "../../assets/images/logoFaama.png"


export default function Login() {
  return (
    <div className="w-full md:w-full lg:w-full min-h-screen bg-slate-900 flex flex-col items-center px-4 py-10">
      {/* Logo */}
      <img className="w-54 md:w-60" src={LogoFaama} alt="FAAMA" />

      {/* Título */}
      <h1 className="text-[var(--text-light)] text-5xl md:text-7xl font-['Kavoon'] mt-8 mb-10">
        Proficiência
      </h1>

      {/* Formulário */}
      <form className="w-full max-w-2xl flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="usuario" className="text-[var(--text-light)] text-2xl md:text-3xl font-['Gabarito']">
            Usuário
          </label>
          <input
            id="usuario"
            type="text"
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
            placeholder="Senha"
            className="w-full h-14 bg-rose-50 rounded-2xl px-4 text-slate-900 text-xl font-['Gabarito'] outline-none"
          />
        </div>

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
