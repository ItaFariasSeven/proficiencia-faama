import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Filter } from 'lucide-react';
import api from '../../services/api';

export default function FilterSelect({ filtros, onAplicarFiltros }) {
  const [open, setOpen] = React.useState(false);
  
  // Estado local para os selects enquanto o modal está aberto
  const [localFiltros, setLocalFiltros] = React.useState(filtros || {periodo: '', curso: '', status: ''});

  const [periodosDoBanco, setPeriodosDoBanco] = React.useState([]);
  const [cursosDoBanco, setCursosDoBanco] = React.useState([]);

  // Sincroniza o estado local sempre que o modal abre
  React.useEffect(() => {
    if (filtros )setLocalFiltros(filtros);
  }, [filtros, open]);

  // Busca no banco de dados assim que o componente é montado
  React.useEffect(() => {
    async function buscarOpcoes() {
      try {
        // 1. Corrige a rota para /proficiencia/periodos/
        const { data: periodos } = await api.get('/proficiencia/periodos/');
        console.log("✅ Períodos recebidos do banco:", periodos);
        setPeriodosDoBanco(periodos);

        // 2. Busca os cursos
        const { data: respostaCursos } = await api.get('/cursos/');
        const listaCursos = Array.isArray(respostaCursos) ? respostaCursos : (respostaCursos.results || []);
        console.log("✅ Cursos recebidos do banco:", listaCursos);
        setCursosDoBanco(listaCursos);
        
      } catch (error) {
        console.error("❌ Erro ao buscar opções de filtro do BD:", error);
      }
    }
    buscarOpcoes();
  }, []);

  const handleChange = (campo) => (event) => {
    setLocalFiltros({ ...localFiltros, [campo]: event.target.value });
  };

  const handleClickOpen = () => setOpen(true);
  const handleDialogClose = () => setOpen(false);

  const handleAplicar = () => {
    onAplicarFiltros(localFiltros); // Envia para o GeneralTable
    setOpen(false);
  };

  const handleLimpar = () => {
    const limpo = { periodo: '', curso: '', status: '' };
    setLocalFiltros(limpo);
    onAplicarFiltros(limpo);
    setOpen(false);
  };

  return (
    <div>
      <Button 
        onClick={handleClickOpen}
        startIcon={<Filter size={18} />}
        sx={{ 
          textTransform: 'none', 
          color: '#4F46E5', 
          borderColor: '#4F46E5',
          '&:hover':{
            backgroundColor: '#CCC9F7',
          } 
        }}
        variant="outlined"
      >
        Filtros
      </Button>

      <Dialog open={open} onClose={handleDialogClose}>
        <DialogTitle>Filtrar Alunos</DialogTitle>

        <DialogContent>
          <Box 
            component="form" 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 2,
              mt: 1,
              minWidth: 250
              }}
          >
            {/* Filtro de Período (Ano/Semestre) */}
            <FormControl fullWidth>
              <InputLabel>Período</InputLabel>
              <Select
                value={localFiltros.periodo}
                onChange={handleChange('periodo')}
                input={<OutlinedInput label="periodo" />}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {periodosDoBanco.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Filtro de Curso */}
            <FormControl fullWidth>
              <InputLabel>Curso</InputLabel>
              <Select
                value={localFiltros.curso}
                onChange={handleChange('curso')}
                input={<OutlinedInput label="curso" />}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {cursosDoBanco.map((curso) => {
                  const nomeDoCurso = curso.nome || curso.name;
                  return(
                    <MenuItem key={curso.id} value={nomeDoCurso}>
                      {nomeDoCurso}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {/* Filtro de Status */}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={localFiltros.status}
                onChange={handleChange('status')}
                input={<OutlinedInput label="status" />}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                <MenuItem value="Aprovado">Aprovado</MenuItem>
                <MenuItem value="Reprovado">Reprovado</MenuItem>
              </Select>
            </FormControl>

            
          </Box>
        </DialogContent>
          <DialogActions>
            <div className='grid grid-cols-3 gap-5'>
              <Button onClick={handleLimpar} color='error'>Limpar</Button>
              <Button onClick={handleDialogClose}>Cancelar</Button>
              <Button onClick={handleAplicar}
                variant='contained'
                sx={{
                  bgcolor: '#4f46e5'
                }}
              >
                Aplicar
              </Button>
            </div>
          </DialogActions>
      </Dialog>
    </div>
  );
}