// Relatório Geral
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'
import ButtonExport from '../../components/Buttons/Buttonexport'
import ButtonAddUser from '../../components/Buttons/ButtonAddUser'
import HistoricoProvasCard from '../../components/HistoricoProvasCard/HistoricoProvasCard'
import GeneralTable from '../../components/Table/GeneralTable'
import api from '../../services/api'

export default function GeneralReport() {


  return (
    <div className='text-end p-0'>
      <div className='grid grid-cols-2'>
        <div className='flex justify-start m-1'>
          <ButtonAddUser />
        </div>
        <div className='flex justify-end m-1'>
          <ButtonExport />
        </div>
      </div>

      <GeneralTable></GeneralTable>
    </div>
      
  )
}