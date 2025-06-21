import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  IconButton, 
  Tooltip, 
  Fade,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import { 
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Download as DownloadIcon,
  LinkOff as LinkOffIcon
} from '@mui/icons-material';

interface ResultDisplayProps {
  magnetLink: string;
  infoHash: string;
}

const ResultDisplay = ({ magnetLink, infoHash }: ResultDisplayProps) => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(magnetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownload = () => {
    try {
      // Create an anchor tag and simulate click to download
      const a = document.createElement('a');
      a.href = magnetLink;
      a.click();
    } catch (error) {
      console.error('Failed to open magnet link:', error);
    }
  };

  // Check if magnet link is valid
  const isValidMagnet = magnetLink.startsWith('magnet:?xt=urn:btih:');

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" component="h3" gutterBottom color="primary">
        Generated Magnet Link
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          multiline
          maxRows={4}
          value={magnetLink}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <Tooltip
                title={copied ? "Copied!" : "Copy Link"}
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 600 }}
              >
                <IconButton
                  aria-label="Copy to clipboard"
                  onClick={copyToClipboard}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                </IconButton>
              </Tooltip>
            ),
          }}
          sx={{ 
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            fontFamily: 'monospace'
          }}
        />
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" component="div" gutterBottom>
          InfoHash:
        </Typography>
        <Chip 
          label={infoHash}
          variant="outlined" 
          sx={{ 
            fontFamily: 'monospace', 
            fontSize: '0.85rem',
            maxWidth: '100%',
            height: 'auto',
            '& .MuiChip-label': {
              whiteSpace: 'normal',
              py: 0.7
            }
          }}
        />
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
        <Button
          variant="contained"
          startIcon={isValidMagnet ? <DownloadIcon /> : <LinkOffIcon />}
          onClick={handleDownload}
          disabled={!isValidMagnet}
          sx={{ flex: 1 }}
        >
          {isValidMagnet ? "Download with Magnet Link" : "Invalid Magnet Link"}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<CopyIcon />}
          onClick={copyToClipboard}
          sx={{ flex: 1 }}
        >
          Copy Link
        </Button>
      </Stack>
    </Box>
  );
};

export default ResultDisplay;