import Button from '@mui/material/Button';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export default function ButtonAddUser() {
    
    return(
        <Button 
            variant="outlined" 
            startIcon={<FileDownloadIcon />}
            sx={{
                backgroundColor: 'var(--text-blue)',
                color: 'var(--background-login)',
                marginLeft: 1,
                fontWeight: 'bold',
                width: '50%',
                '&:hover':{
                    backgroundColor:'var(--background-login)',
                    color: 'var(--text-blue)'
                }
            }}
            >
            adicionar Usuário
        </Button>
    )
}