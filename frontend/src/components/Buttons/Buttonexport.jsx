import Button from '@mui/material/Button';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export default function ButtonExport({ onClick, loading }) {
    
    return(
        // <Button 
        //     variant="outlined" 
        //     startIcon={<FileDownloadIcon />}
        //     sx={{
        //         backgroundColor: 'var(--background-login)',
        //         color: 'var(--text-blue)',
        //         marginRight: 1,
        //         fontWeight: 'bold',
        //         width: '50%',
        //         '&:hover':{
        //             backgroundColor:'var(--text-blue)',
        //             color: 'var(--background-login)'
        //         }
        //     }}
        //     >
        //     Exportar Relatório
        // </Button>

        <Button 
            onClick={onClick}
            disabled={loading}
            variant="outlined" 
            startIcon={<FileDownloadIcon />}
            sx={{
                backgroundColor: 'var(--background-login)',
                color: 'var(--text-blue)',
                marginRight: 1,
                fontWeight: 'bold',
                margin: 1,
                width: '50%',
                '&:hover':{ backgroundColor:'var(--text-blue)', color: 'var(--background-login)' }
            }}
        >
            {loading ? 'Exportando...' : 'Exportar Relatório'}
        </Button>
    )
}