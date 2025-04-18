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
  FormHelperText,
  Paper
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

// 预定义的常用Tracker列表
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
  
  // Tracker相关的状态
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

  // 处理添加自定义Tracker
  const handleAddCustomTracker = () => {
    if (!customTracker.trim()) return;
    
    // 简单验证tracker格式
    if (!customTracker.includes('://')) {
      setError('Tracker格式无效，请使用如 http://example.com/announce 或 udp://example.com:1234/announce 的格式');
      return;
    }
    
    // 添加到自定义tracker列表
    setCustomTrackers(prev => [...prev, customTracker.trim()]);
    setCustomTracker('');
  };

  // 删除自定义tracker
  const handleRemoveCustomTracker = (tracker: string) => {
    setCustomTrackers(prev => prev.filter(t => t !== tracker));
  };

  // 切换默认tracker的选择状态
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
      setError('请输入InfoHash或磁力链接');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 解析输入
      const parsed = parseInput(input.trim());
      
      // 准备所有选定的trackers
      let trackers: string[] = [];
      if (addTrackers) {
        trackers = [...selectedDefaultTrackers, ...customTrackers];
      }
      
      // 生成磁力链接，提供tracker列表
      const magnetLink = generateMagnetLink(parsed, torrentName || undefined, addTrackers, trackers);
      
      // 调用回调函数
      onMagnetGenerated(magnetLink, 'input', parsed.infoHash, torrentName || parsed.name);
      
      // 成功后清空输入
      setInput('');
      setTorrentName('');
    } catch (err) {
      console.error('生成磁力链接时出错:', err);
      setError(err instanceof Error ? err.message : '生成磁力链接时出错');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        输入40位InfoHash或完整的磁力链接
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        label="InfoHash或磁力链接"
        value={input}
        onChange={handleInputChange}
        placeholder="例如: e9776f4626e2dbed3338b0e0545193c2a4146c6f 或 magnet:?xt=urn:btih:..."
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
                aria-label="清除输入"
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
        label="种子名称 (可选)"
        value={torrentName}
        onChange={handleNameChange}
        placeholder="为磁力链接添加名称"
        disabled={isSubmitting}
        sx={{ mb: 3 }}
      />
      
      {/* Tracker选项 */}
      <FormGroup sx={{ mb: 3 }}>
        <FormControlLabel 
          control={
            <Checkbox 
              checked={addTrackers}
              onChange={(e) => setAddTrackers(e.target.checked)}
            />
          } 
          label="添加Tracker (提高下载速度)"
        />
        
        <Collapse in={addTrackers} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              常用Tracker
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
              自定义Tracker
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="添加自定义tracker (例如: http://example.com/announce)"
                value={customTracker}
                onChange={(e) => setCustomTracker(e.target.value)}
              />
              <Button 
                variant="contained" 
                size="small"
                onClick={handleAddCustomTracker}
                startIcon={<AddIcon />}
              >
                添加
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
              添加Tracker可以提高下载速度，但可能会被某些网络拦截
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
        {isSubmitting ? '处理中...' : '生成磁力链接'}
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