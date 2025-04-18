import { useState, useRef, ChangeEvent } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert,
  useTheme
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon 
} from '@mui/icons-material';
import { parseTorrentFile, generateMagnetLink } from '../utils/magnetUtils';

interface TorrentUploaderProps {
  onMagnetGenerated: (link: string, source: 'file' | 'input', infoHash: string, name?: string) => void;
}

const TorrentUploader = ({ onMagnetGenerated }: TorrentUploaderProps) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

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
      
      // 生成磁力链接
      const magnetLink = generateMagnetLink(torrentInfo);
      
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