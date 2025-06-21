import { useState, useEffect, useMemo, createContext } from 'react';
import { 
  ThemeProvider, 
  Container, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  CssBaseline,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Menu as MenuIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  GitHub as GitHubIcon,
  History as HistoryIcon,
  Home as HomeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { createAppTheme } from './theme';
import { storageUtils } from './utils/magnetUtils';
import { MagnetRecord } from './types';
import TorrentUploader from './components/TorrentUploader';
import InfoHashInput from './components/InfoHashInput';
import ResultDisplay from './components/ResultDisplay';
import HistoryList from './components/HistoryList';
import Footer from './components/Footer';

// 创建主题上下文
export const ThemeContext = createContext<{
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}>({
  mode: 'light',
  toggleTheme: () => {}
});

function App() {
  // 状态管理
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(storageUtils.loadThemeMode());
  const [history, setHistory] = useState<MagnetRecord[]>(storageUtils.loadHistory());
  const [magnetLink, setMagnetLink] = useState<string>('');
  const [currentInfoHash, setCurrentInfoHash] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // 创建主题
  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);
  
  // 响应式设计
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 主题切换函数
  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    storageUtils.saveThemeMode(newMode);
  };

  // 处理磁力链接生成
  const handleMagnetGenerated = (link: string, source: 'file' | 'input', infoHash: string, name?: string) => {
    setMagnetLink(link);
    setCurrentInfoHash(infoHash);
    
    // 添加到历史记录
    const newRecord: MagnetRecord = {
      id: Date.now().toString(),
      magnetLink: link,
      source,
      name: name || '未命名',
      infoHash,
      createdAt: new Date().toISOString(),
    };
    
    const updatedHistory = [newRecord, ...history.filter(record => 
      record.infoHash !== infoHash
    )].slice(0, 50); // 只保留最近50条记录，且不重复
    
    setHistory(updatedHistory);
    storageUtils.saveHistory(updatedHistory);
  };

  const handleHistorySelect = (record: MagnetRecord) => {
    setMagnetLink(record.magnetLink);
    setCurrentInfoHash(record.infoHash);
    setShowHistory(false); // 选择历史记录后返回主界面
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  const drawerItems = [
    { text: '首页', icon: <HomeIcon />, onClick: () => { setShowHistory(false); toggleDrawer(false); } },
    { text: '历史记录', icon: <HistoryIcon />, onClick: () => { setShowHistory(true); toggleDrawer(false); } },
    { text: '关于', icon: <InfoIcon />, onClick: () => { window.open('https://github.com/yourusername/bt2magnet', '_blank'); toggleDrawer(false); } },
  ];

  // 保存历史记录到本地存储
  useEffect(() => {
    storageUtils.saveHistory(history);
  }, [history]);

  return (
    <ThemeContext.Provider value={{ mode: themeMode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="static">
            <Toolbar>
              {isMobile && (
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={() => toggleDrawer(true)}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                BT2Magnet
              </Typography>
              
              {!isMobile && (
                <>
                  <IconButton 
                    color="inherit" 
                    onClick={() => setShowHistory(false)}
                    sx={{ mr: 1 }}
                  >
                    <HomeIcon />
                  </IconButton>
                  
                  <IconButton 
                    color="inherit" 
                    onClick={() => setShowHistory(true)}
                    sx={{ mr: 1 }}
                  >
                    <HistoryIcon />
                  </IconButton>
                  
                  <IconButton 
                    color="inherit" 
                    href="https://github.com/yourusername/bt2magnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mr: 1 }}
                  >
                    <GitHubIcon />
                  </IconButton>
                </>
              )}
              
              <IconButton color="inherit" onClick={toggleTheme}>
                {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Toolbar>
          </AppBar>
          
          {/* 侧边抽屉 (移动端) */}
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => toggleDrawer(false)}
          >
            <Box sx={{ width: 250 }}>
              <List>
                {drawerItems.map((item, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemButton onClick={item.onClick}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              <Divider />
              <List>
                <ListItem disablePadding>
                  <ListItemButton onClick={toggleTheme}>
                    <ListItemIcon>
                      {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </ListItemIcon>
                    <ListItemText primary={themeMode === 'dark' ? '切换到浅色模式' : '切换到深色模式'} />
                  </ListItemButton>
                </ListItem>
              </List>
            </Box>
          </Drawer>
          
          <Container component="main" sx={{ flex: 1, py: 4 }}>
            {showHistory ? (
              <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" component="h2" gutterBottom align="center">
                  转换历史
                </Typography>
                <HistoryList 
                  history={history} 
                  onSelect={handleHistorySelect} 
                  onClear={() => setHistory([])} 
                />
              </Paper>
            ) : (
              <>
                <Paper sx={{ p: 3, mb: 4 }}>
                  <Typography variant="h5" component="h2" gutterBottom align="center">
                    BT种子转磁力链接
                  </Typography>
                  
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs 
                      value={currentTab} 
                      onChange={handleTabChange} 
                      centered
                      variant={isMobile ? "fullWidth" : "standard"}
                    >
                      <Tab label="上传种子文件" />
                      <Tab label="输入InfoHash/磁力链接" />
                    </Tabs>
                  </Box>
                  
                  <Box sx={{ py: 2 }}>
                    {currentTab === 0 ? (
                      <TorrentUploader onMagnetGenerated={handleMagnetGenerated} />
                    ) : (
                      <InfoHashInput onMagnetGenerated={handleMagnetGenerated} />
                    )}
                  </Box>
                </Paper>
                
                {magnetLink && (
                  <Paper sx={{ p: 3, mb: 4 }}>
                    <ResultDisplay 
                      magnetLink={magnetLink} 
                      infoHash={currentInfoHash} 
                    />
                  </Paper>
                )}
              </>
            )}
          </Container>
          
          <Footer />
        </Box>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App;