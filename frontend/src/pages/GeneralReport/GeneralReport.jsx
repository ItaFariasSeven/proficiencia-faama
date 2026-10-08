// Relatório Geral
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'
import ButtonExport from '../../components/Buttons/Buttonexport'
import HistoricoProvasCard from '../../components/HistoricoProvasCard/HistoricoProvasCard'
import GeneralTable from '../../components/Table/GeneralTable'
import api from '../../services/api'

export default function GeneralReport() {


  return (
    <div className='text-end p-0'>
      <ButtonExport/>

      <GeneralTable></GeneralTable>
    </div>
      
  )
}