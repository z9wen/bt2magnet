import { useState, ChangeEvent, FormEvent } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert,
  Typography,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  Collapse,
  Chip,
  FormGroup,
  FormHelperText
} from '@mui/material';
import { 
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { parseInput, generateMagnetLink } from '../utils/magnetUtils';

interface InfoHashInputProps {
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

const InfoHashInput = ({ onMagnetGenerated }: InfoHashInputProps) => {
  const [input, setInput] = useState<string>('');
  const [torrentName, setTorrentName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Tracker-related state
  const [addTrackers, setAddTrackers] = useState<boolean>(false);
  const [customTracker, setCustomTracker] = useState<string>('');
  const [customTrackers, setCustomTrackers] = useState<string[]>([]);
  const [selectedDefaultTrackers, setSelectedDefaultTrackers] = useState<string[]>([...DEFAULT_TRACKERS]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (error) setError(null);
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTorrentName(e.target.value);
  };

  const clearInput = () => {
    setInput('');
    if (error) setError(null);
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      setError('Please enter InfoHash or magnet link');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Parse input
      const parsed = parseInput(input.trim());
      
      // Prepare all selected trackers
      let trackers: string[] = [];
      if (addTrackers) {
        trackers = [...selectedDefaultTrackers, ...customTrackers];
      }
      
      // Generate magnet link with tracker list
      const magnetLink = generateMagnetLink(parsed, torrentName || undefined, addTrackers, trackers);
      
      // Call callback function
      onMagnetGenerated(magnetLink, 'input', parsed.infoHash, torrentName || parsed.name);
      
      // Clear inputs after success
      setInput('');
      setTorrentName('');
    } catch (err) {
      console.error('Error generating magnet link:', err);
      setError(err instanceof Error ? err.message : 'Error generating magnet link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        Enter 40-character InfoHash or complete magnet link
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        label="InfoHash or Magnet Link"
        value={input}
        onChange={handleInputChange}
        placeholder="e.g.: e9776f4626e2dbed3338b0e0545193c2a4146c6f or magnet:?xt=urn:btih:..."
        disabled={isSubmitting}
        error={Boolean(error)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: input && (
            <InputAdornment position="end">
              <IconButton
                aria-label="Clear input"
                onClick={clearInput}
                edge="end"
                size="small"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />
      
      <TextField
        fullWidth
        variant="outlined"
        label="Torrent Name (Optional)"
        value={torrentName}
        onChange={handleNameChange}
        placeholder="Add name for magnet link"
        disabled={isSubmitting}
        sx={{ mb: 3 }}
      />
      
      {/* Tracker options */}
      <FormGroup sx={{ mb: 3 }}>
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
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        sx={{ py: 1.2 }}
      >
        {isSubmitting ? 'Processing...' : 'Generate Magnet Link'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default InfoHashInput;