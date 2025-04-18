import { useState, ChangeEvent, FormEvent } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert,
  Typography,
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { parseInput, generateMagnetLink } from '../utils/magnetUtils';

interface InfoHashInputProps {
  onMagnetGenerated: (link: string, source: 'file' | 'input', infoHash: string, name?: string) => void;
}

const InfoHashInput = ({ onMagnetGenerated }: InfoHashInputProps) => {
  const [input, setInput] = useState<string>('');
  const [torrentName, setTorrentName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      setError('请输入InfoHash或磁力链接');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 解析输入
      const parsed = await parseInput(input.trim());
      
      // 如果有自定义名称，使用它
      const magnetLink = generateMagnetLink(parsed, torrentName || undefined);
      
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