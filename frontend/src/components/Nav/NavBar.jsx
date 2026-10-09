// components/Nav/NavBar.jsx
import { LayoutCollage, Users, ClipboardData, World, ChevronDown } from 'tabler-icons-react'
import { Fragment, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'



// Esse é um componente "filho" — ele representa UM item do menu
function NavItem({ icon, label, active = false, hasChevron = false, expandido = false, onclick }) {
    const destacado = active || expandido

    return (
    <button 
        onClick={onclick}
        className={`w-full h-14 px-5 py-3 rounded-3xl flex items-center gap-3 cursor-pointer transition-colors
        ${destacado ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}
    >
        {icon}
        <span className={`flex-1 text-base text-start font-bold ${active ? 'text-amber-500' : 'text-[var(--text-light)]'}`}>
          {label}
        </span>
        {hasChevron && (
          <ChevronDown size={16} className={`text-[var(--text-light)]${expandido ? 'rotate-180' : ''}`} />
        )}
    </button>
  )
}

export default function NavBar() {

    const navigate = useNavigate()
    const location = useLocation()

    const[activeItem, setActiveItem] = useState('Visão Geral')
    const [itemExpandido, setItemExpandido] = useState(null)

    const menuItens = [
        { label: 'Visão Geral', icon: <LayoutCollage size={18}/>, path: '/visaogeral' },
        {
            label: 'Todos os alunos', 
            icon: <Users size={18} />, 
            hasChevron: true,
            subItens: [
                { label: 'Geral', path: '/totalalunosgeral' },
                { label: 'Português', path: '/totalalunosportugues' },
                { label: 'Matemática', path: '/totalalunosmatematica' },
            ]
        },
        { label: 'Prazo de 75%', icon: <ClipboardData size={18} />, path: '/75porcento' },
        { label: 'Relatório Geral', icon: <World size={18} />, path: '/relatoriogeral' },
        { label: 'Importar Dados', icon: <LayoutCollage size={18} />, path: '/importardados' },
    ]

    function toggleExpandido(label) {
        setItemExpandido((prev) => (prev === label ? null: label))
    }

    function handleClickItem(item) {
        if(item.hasChevron){
            toggleExpandido(item.label)
        } else{
            navigate(item.path)
        }
    }
    
    return(
        <aside className=" h-full bg-[var(--background-login)] flex flex-col items-start pt-16 px-4 gap-12">
        
            {/* Título */}
            <h1 style={{ fontFamily: 'Kavoon' }} className="w-full text-center text-4xl text-[var(--text-light)]">
              Proficiência
            </h1>

            {/* Itens de navegação */}
            <nav className="w-full flex flex-col gap-2 overflow-y-auto">
              {menuItens.map((item) => (
                <Fragment key={item.label}>
                  <NavItem 
                    icon={item.icon} 
                    label={item.label}
                    hasChevron={item.hasChevron} 
                    expandido={itemExpandido === item.label}
                    active={item.path ? location.pathname === item.path : item.subItens?.some((sub) => sub.path === location.pathname)}
                    onclick={() => handleClickItem(item)}
                  />

                {item.hasChevron && itemExpandido === item.label && (
                    <div className='flex flex-col gap-1 pl-10 mt-1'>
                        {item.subItens.map((sub) => (
                            <button
                                key={sub.label}
                                onClick={() => navigate(sub.path)}
                                className={`text-left text-sm py-2 px-3 rounded-md transition-colors ${
                                location.pathname === sub.path
                                    ? 'text-orange-400  '
                                    : 'text-[var(--text-light)] hover:text-white hover:bg-[var(--text-blue)] hover:cursor-pointer'
                                }`}    
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>
                    )}
                </Fragment>
              ))}

            </nav>

        </aside>
    )

}