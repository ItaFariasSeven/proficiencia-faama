// Relatório Geral
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'
import TableTotalStudentsMath from '../../components/Table/TableTotalStudentsMath'
import api from '../../services/api'

export default function TotalStudentsGeneral() {


  return (
    <div className='text-end p-0'>

      <TableTotalStudentsMath></TableTotalStudentsMath>
    </div>
      
  )
}