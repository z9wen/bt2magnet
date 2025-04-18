import { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  TextField, 
  InputAdornment,
  Paper,
  Divider,
  Button,
  Tooltip,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Search as SearchIcon,
  Clear as ClearIcon,
  DeleteOutline as DeleteIcon,
  History as HistoryIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { MagnetRecord } from '../types';

interface HistoryListProps {
  history: MagnetRecord[];
  onSelect: (record: MagnetRecord) => void;
  onClear: () => void;
}

const HistoryList = ({ history, onSelect, onClear }: HistoryListProps) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleCopyLink = async (magnetLink: string, id: string) => {
    try {
      await navigator.clipboard.writeText(magnetLink);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('复制到剪贴板失败:', err);
    }
  };

  const filteredHistory = searchTerm
    ? history.filter(record => 
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.infoHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.magnetLink.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : history;

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="搜索历史记录..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  aria-label="清除搜索"
                  onClick={() => setSearchTerm('')}
                  edge="end"
                  size="small"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setConfirmOpen(true)}
          disabled={history.length === 0}
        >
          清空历史
        </Button>
      </Box>
      
      {filteredHistory.length > 0 ? (
        <Paper variant="outlined" sx={{ maxHeight: '60vh', overflow: 'auto' }}>
          <List>
            {filteredHistory.map((record, index) => (
              <Box key={record.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: theme => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography 
                        component="div" 
                        variant="subtitle1" 
                        noWrap 
                        sx={{ cursor: 'pointer' }}
                        onClick={() => onSelect(record)}
                      >
                        {record.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Stack direction="column" spacing={1}>
                          <Box>
                            <Typography component="span" variant="body2" color="text.secondary">
                              InfoHash:
                            </Typography>{' '}
                            <Typography 
                              component="span" 
                              variant="body2" 
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {record.infoHash}
                            </Typography>
                          </Box>
                          
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <Chip 
                              icon={<HistoryIcon fontSize="small" />} 
                              label={formatDate(record.createdAt)} 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              label={record.source === 'file' ? '文件上传' : 'InfoHash/磁力链接'} 
                              size="small" 
                              variant="outlined"
                            />
                          </Stack>
                        </Stack>
                      </Box>
                    }
                  />
                  
                  {!isMobile && (
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title={copiedId === record.id ? "已复制!" : "复制链接"}>
                          <IconButton 
                            edge="end" 
                            aria-label="复制" 
                            onClick={() => handleCopyLink(record.magnetLink, record.id)}
                            color={copiedId === record.id ? "success" : "default"}
                          >
                            {copiedId === record.id ? <CheckIcon /> : <CopyIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="使用该记录">
                          <IconButton 
                            edge="end" 
                            aria-label="使用" 
                            onClick={() => onSelect(record)}
                            color="primary"
                          >
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                
                {isMobile && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, pb: 1 }}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={copiedId === record.id ? <CheckIcon /> : <CopyIcon />}
                        onClick={() => handleCopyLink(record.magnetLink, record.id)}
                        color={copiedId === record.id ? "success" : "primary"}
                        variant="text"
                      >
                        复制
                      </Button>
                      <Button
                        size="small"
                        startIcon={<HistoryIcon />}
                        onClick={() => onSelect(record)}
                        color="primary"
                        variant="contained"
                      >
                        使用
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Box>
            ))}
          </List>
        </Paper>
      ) : (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" align="center" color="text.secondary">
            {searchTerm ? '没有找到匹配的历史记录' : '暂无历史记录'}
          </Typography>
          {searchTerm && (
            <Button 
              variant="text" 
              color="primary"
              onClick={() => setSearchTerm('')}
              sx={{ mt: 2 }}
            >
              清除搜索
            </Button>
          )}
        </Paper>
      )}

      {/* 确认对话框 */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>确认清空历史记录</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要清空所有转换历史记录吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            取消
          </Button>
          <Button 
            onClick={() => {
              onClear();
              setConfirmOpen(false);
            }} 
            color="error"
          >
            确认清空
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HistoryList;