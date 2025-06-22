import { Box, Typography, Link, Container, useTheme } from '@mui/material';

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.mode === 'light' 
          ? theme.palette.grey[100] 
          : theme.palette.grey[900]
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          &copy; {currentYear} BT2Magnet - Simple and Easy-to-Use Torrent to Magnet Link Tool
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          <Link 
            href="https://github.com/z9wen/bt2magnet"
            target="_blank" 
            rel="noopener noreferrer"
            color="inherit"
            underline="hover"
          >
            GitHub
          </Link>
          {' • '}
          Personal Use Tool - For Learning and Communication Only
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;