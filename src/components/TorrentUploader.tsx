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

// 预定义的常用Tracker列表
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
  
  // Tracker相关的状态
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

  const processTorrentFile = async (file: File) => {
    // 检查文件类型
    if (!file.name.endsWith('.torrent')) {
      setError('请上传 .torrent 文件');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      // 解析种子文件
      const torrentInfo = await parseTorrentFile(file);
      
      // 准备所有选定的trackers
      let trackers: string[] = [];
      if (addTrackers) {
        trackers = [...selectedDefaultTrackers, ...customTrackers];
      }
      
      // 生成磁力链接，提供tracker列表
      const magnetLink = generateMagnetLink(torrentInfo, undefined, addTrackers, trackers);
      
      // 调用回调函数
      onMagnetGenerated(magnetLink, 'file', torrentInfo.infoHash, torrentInfo.name);
    } catch (err) {
      console.error('处理种子文件时出错:', err);
      setError(err instanceof Error ? err.message : '处理种子文件时出错');
    } finally {
      setIsLoading(false);
      // 重置文件输入
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
              点击上传或拖放文件到此处
            </Typography>
            <Typography variant="body2" color="textSecondary">
              支持 .torrent 文件
            </Typography>
          </Box>
        )}
      </Paper>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography variant="body2" color="textSecondary">
            处理中...
          </Typography>
        </Box>
      )}
      
      {/* Tracker选项 */}
      <FormGroup sx={{ mt: 3, mb: 3 }}>
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
          选择种子文件
        </Button>
      </Box>
    </Box>
  );
};

export default TorrentUploader;