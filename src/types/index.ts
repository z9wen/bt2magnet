export interface MagnetRecord {
    id: string;
    magnetLink: string;
    source: 'file' | 'input'; // 'file' 或 'input'
    name: string;
    infoHash: string;
    createdAt: string;
  }
  
  export interface ThemeMode {
    mode: 'light' | 'dark';
  }