import SearchIcon from '@mui/icons-material/Search';
import { styled, alpha } from '@mui/material/styles'
import InputBase from '@mui/material/InputBase'


// 👇 Componentes estilizados da barra de busca (precisam existir)
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  display: 'flex',
  alignItems: 'center',
  margin: '12px 20px',
  width: '80%',
}))

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    width: '100%',
  },
}))

export default function SearchBar({ busca, onBusca }) {
    return(
    <Search>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>
      <StyledInputBase
        type='text'
        placeholder="Pesquisar..."
        value={busca}
        onChange={onBusca}
        inputProps={{ 'aria-label': 'search' }}
      />
    </Search>
    )
}