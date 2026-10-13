import Button from '@mui/material/Button';
import React, { useState } from 'react';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box } from '@mui/material';
import api from '../../services/api';

export default function ButtonAddUser({ onUsuarioCriado }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ ra: '', nome: '', email: '' });

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setFormData({ ra: '', nome: '', email: '' }); // limpa o formulário
    };

    const handleSalvar = async () => {
        if (!formData.ra || !formData.nome || !formData.email) {
            alert("Preencha todos os campos!");
            return;
        }
        setLoading(true);
        try {
            // 1. Verifica se o aluno já existe (buscando pelo RA)
            const { data: buscaDuplicata } = await api.get(`/alunos/?search=${formData.ra}`);
            
            // Se a API retornar resultados, o RA já existe
            const resultados = Array.isArray(buscaDuplicata) ? buscaDuplicata : (buscaDuplicata.results || []);
            if (resultados.some(aluno => aluno.ra === formData.ra)) {
                alert("Erro: Já existe um aluno cadastrado com este RA no banco de dados.");
                setLoading(false);
                return;
            }

            // 2. Cria o aluno se ele não existir
            await api.post('/alunos/', formData);
            alert("Usuário adicionado com sucesso!");
            
            handleClose();
            if (onUsuarioCriado) onUsuarioCriado(); // Atualiza a tabela chamando a função do componente pai

        } catch (error) {
            console.error(error);
            alert("Erro ao salvar o usuário. Verifique os dados.");
        } finally {
            setLoading(false);
        }
    };
    
    return(
        // <Button 
        //     variant="outlined" 
        //     startIcon={<FileDownloadIcon />}
        //     sx={{
        //         backgroundColor: 'var(--text-blue)',
        //         color: 'var(--background-login)',
        //         marginLeft: 1,
        //         fontWeight: 'bold',
        //         width: '50%',
        //         '&:hover':{
        //             backgroundColor:'var(--background-login)',
        //             color: 'var(--text-blue)'
        //         }
        //     }}
        //     >
        //     adicionar Usuário
        // </Button>

        <>
            <Button 
                onClick={handleOpen}
                variant="outlined" 
                startIcon={<PersonAddIcon />}
                sx={{
                    backgroundColor: 'var(--text-blue)',
                    color: 'var(--background-login)',
                    marginLeft: 1,
                    fontWeight: 'bold',
                    margin: 1,
                    width: '50%', // Ajustado para ser responsivo na grid
                    '&:hover':{ 
                        backgroundColor:'var(--background-login)', 
                        color: 'var(--text-blue)' 
                    }
                }}
            >
                Adicionar Usuário
            </Button>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>Adicionar Novo Aluno</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField 
                            label="RA do Aluno" 
                            value={formData.ra}
                            onChange={(e) => setFormData({...formData, ra: e.target.value})}
                        />
                        <TextField 
                            label="Nome Completo" 
                            value={formData.nome}
                            onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        />
                        <TextField 
                            label="Email" 
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="error" disabled={loading}>Cancelar</Button>
                    <Button onClick={handleSalvar} variant="contained" disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}