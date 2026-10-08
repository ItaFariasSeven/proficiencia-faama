import Button from '@mui/material/Button';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
export default function ButtonExport() {
    
    return(
        <Button 
            variant="outlined" 
            startIcon={<FileDownloadIcon />}
            sx={{
                backgroundColor: 'var(--background-login)',
                color: 'var(--text-blue)',
                marginRight: 1,
                fontWeight: 'bold',
                '&:hover':{
                    backgroundColor:'var(--text-blue)',
                    color: 'var(--background-login)'
                }
            }}
            >
            Exportar Relatório
        </Button>
    )
}