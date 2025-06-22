export interface MagnetRecord {
    id: string;
    magnetLink: string;
    source: 'file' | 'input'; // 'file' or 'input'
    name: string;
    infoHash: string;
    createdAt: string;
  }
  
  export interface ThemeMode {
    mode: 'light' | 'dark';
  }

  export interface TorrentInstance {
    infoHash: string;
    name?: string;
    announce?: string[];
    files?: Array<{
      path: string;
      length: number;
    }>;
    length?: number;
  }