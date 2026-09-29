import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import ButtonLogin from './components/Buttons/ButtonLogin';
import Login from './pages/Login/Login';
import GeneralVision from './pages/GeneralVision/GeneralVision';
import TotalStudentsGeneral from './pages/TotalStudents/TotalStudentsGeneral.jsx'
import TotalStudentsMath from './pages/TotalStudents/TotalStudentsMath.jsx'
import TotalStudentsPortuguese from './pages/TotalStudents/TotalStudentsPortuguese.jsx'
import Porcent75 from './pages/Porcent75/Porcent75.jsx'
import GeneralReport from './pages/GeneralReport/GeneralReport.jsx'
import ImportData from './pages/ImportData/ImportData.jsx'
import { Route, Routes, useLocation } from 'react-router-dom';
import NavBar from './components/Nav/NavBar.jsx'

function App() {
  const [count, setCount] = useState(0)

  const location = useLocation();
  const mostrarNavBar = location.pathname !== '/login';

  return (
    
    <div className='grid grid-rows-1 grid-flow-col h-screen p-0 m-0 bg-[var(--background-general)]'>
      {mostrarNavBar && <div><NavBar/></div>}

      

      <div>
        <Routes>
          <Route path='/login' element={<Login/>}/>
          <Route path='/visaogeral' element={<GeneralVision/>}/>
          <Route path='/totalalunosgeral' element={<TotalStudentsGeneral/>}/>
          <Route path='/totalalunosmatematica' element={<TotalStudentsMath/>}/>
          <Route path='/totalalunosportugues' element={<TotalStudentsPortuguese/>}/>
          <Route path='/75porcento' element={<Porcent75/>}/>
          <Route path='/relatoriogeral' element={<GeneralReport/>}/>
          <Route path='/importardados' element={<ImportData/>}/>
        </Routes>
      </div>
    </div>
  )
}

export default App
