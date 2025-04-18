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
          &copy; {currentYear} BT2Magnet - 简单易用的种子转磁力链接工具
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          <Link 
            href="https://github.com/yourusername/bt2magnet"
            target="_blank" 
            rel="noopener noreferrer"
            color="inherit"
            underline="hover"
          >
            GitHub
          </Link>
          {' • '}
          个人使用工具 - 仅用于学习交流
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;