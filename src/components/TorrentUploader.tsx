import { useState, useRef, ChangeEvent } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert,
  useTheme,
  FormControlLabel,
  Checkbox,
  Collapse,
  Chip,
  FormGroup,
  FormHelperText,
  TextField
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { parseTorrentFile, generateMagnetLink } from '../utils/magnetUtils';

interface TorrentUploaderProps {
  onMagnetGenerated: (link: string, source: 'file' | 'input', infoHash: string, name?: string) => void;
}

// Predefined common tracker list
const DEFAULT_TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.tracker.cl:1337/announce',
  'udp://9.rarbg.com:2810/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'http://tracker.openbittorrent.com:80/announce'
];

const TorrentUploader = ({ onMagnetGenerated }: TorrentUploaderProps) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  
  // Tracker-related state
  const [addTrackers, setAddTrackers] = useState<boolean>(false);
  const [customTracker, setCustomTracker] = useState<string>('');
  const [customTrackers, setCustomTrackers] = useState<string[]>([]);
  const [selectedDefaultTrackers, setSelectedDefaultTrackers] = useState<string[]>([...DEFAULT_TRACKERS]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processTorrentFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processTorrentFile(files[0]);
    }
  };
  
  // Handle adding custom tracker
  const handleAddCustomTracker = () => {
    if (!customTracker.trim()) return;
    
    // Simple tracker format validation
    if (!customTracker.includes('://')) {
      setError('Invalid tracker format. Please use formats like http://example.com/announce or udp://example.com:1234/announce');
      return;
    }
    
    // Add to custom tracker list
    setCustomTrackers(prev => [...prev, customTracker.trim()]);
    setCustomTracker('');
  };

  // Remove custom tracker
  const handleRemoveCustomTracker = (tracker: string) => {
    setCustomTrackers(prev => prev.filter(t => t !== tracker));
  };

  // Toggle default tracker selection state
  const handleToggleDefaultTracker = (tracker: string) => {
    setSelectedDefaultTrackers(prev => 
      prev.includes(tracker) 
        ? prev.filter(t => t !== tracker) 
        : [...prev, tracker]
    );
  };

  const processTorrentFile = async (file: File) => {
    // Check file type
    if (!file.name.endsWith('.torrent')) {
      setError('Please upload a .torrent file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      // Parse torrent file
      const torrentInfo = await parseTorrentFile(file);
      
      // Prepare all selected trackers
      let trackers: string[] = [];
      if (addTrackers) {
        trackers = [...selectedDefaultTrackers, ...customTrackers];
      }
      
      // Generate magnet link with tracker list
      const magnetLink = generateMagnetLink(torrentInfo, undefined, addTrackers, trackers);
      
      // Call callback function
      onMagnetGenerated(magnetLink, 'file', torrentInfo.infoHash, torrentInfo.name);
    } catch (err) {
      console.error('Error processing torrent file:', err);
      setError(err instanceof Error ? err.message : 'Error processing torrent file');
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        sx={{
          border: '2px dashed',
          borderColor: isDragging 
            ? 'primary.main' 
            : theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300',
          borderRadius: 2,
          p: 6,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          bgcolor: isDragging 
            ? theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)' 
            : 'transparent',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)'
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".torrent"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {fileName ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <FileIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              {fileName}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              Click to upload or drag and drop files here
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supports .torrent files
            </Typography>
          </Box>
        )}
      </Paper>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography variant="body2" color="textSecondary">
            Processing...
          </Typography>
        </Box>
      )}
      
              {/* Tracker options */}
      <FormGroup sx={{ mt: 3, mb: 3 }}>
        <FormControlLabel 
          control={
            <Checkbox 
              checked={addTrackers}
              onChange={(e) => setAddTrackers(e.target.checked)}
            />
          } 
          label="Add Trackers (Improve Download Speed)"
        />
        
        <Collapse in={addTrackers} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Common Trackers
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {DEFAULT_TRACKERS.map(tracker => (
                <Chip
                  key={tracker}
                  label={tracker.split('://')[0] + '://...'}
                  onClick={() => handleToggleDefaultTracker(tracker)}
                  onDelete={selectedDefaultTrackers.includes(tracker) ? 
                    () => handleToggleDefaultTracker(tracker) : undefined}
                  color={selectedDefaultTrackers.includes(tracker) ? "primary" : "default"}
                  variant={selectedDefaultTrackers.includes(tracker) ? "filled" : "outlined"}
                  sx={{ maxWidth: '100%' }}
                />
              ))}
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>
              Custom Trackers
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add custom tracker (e.g.: http://example.com/announce)"
                value={customTracker}
                onChange={(e) => setCustomTracker(e.target.value)}
              />
              <Button 
                variant="contained" 
                size="small"
                onClick={handleAddCustomTracker}
                startIcon={<AddIcon />}
              >
                                  Add
              </Button>
            </Box>
            
            {customTrackers.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {customTrackers.map(tracker => (
                  <Chip
                    key={tracker}
                    label={tracker}
                    onDelete={() => handleRemoveCustomTracker(tracker)}
                    color="secondary"
                    sx={{ maxWidth: '100%' }}
                  />
                ))}
              </Box>
            )}
            
            <FormHelperText>
              Adding trackers can improve download speed, but may be blocked by some networks
            </FormHelperText>
          </Box>
        </Collapse>
      </FormGroup>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={handleButtonClick}
          disabled={isLoading}
        >
          Select Torrent File
        </Button>
      </Box>
    </Box>
  );
};

export default TorrentUploader;