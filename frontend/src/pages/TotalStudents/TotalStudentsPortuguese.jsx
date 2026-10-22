// Relatório Geral
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'
import TableTotalStudentsPortuguese from '../../components/Table/TableTotalStudentsPortuguese'
import api from '../../services/api'

export default function TotalStudentsGeneral() {


  return (
    <div className='text-end p-0 h-dvh overflow-auto'>
      <TableTotalStudentsPortuguese></TableTotalStudentsPortuguese>
    </div>
      
  )
}