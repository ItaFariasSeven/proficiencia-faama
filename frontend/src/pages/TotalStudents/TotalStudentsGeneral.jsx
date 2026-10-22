// Relatório Geral
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'
import TableTotalStudentsGenral from '../../components/Table/TableTotalStudentsGeneral'
import api from '../../services/api'

export default function TotalStudentsGeneral() {


  return (
    <div className='text-end p-0 h-dvh overflow-auto'>

      <TableTotalStudentsGenral></TableTotalStudentsGenral>
    </div>
      
  )
}