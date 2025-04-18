import parseTorrent from 'parse-torrent';
import { MagnetRecord } from '../types';

/**
 * 解析种子文件内容
 */
export async function parseTorrentFile(file: File): Promise<parseTorrent.Instance> {
  try {
    // 读取文件内容
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // 使用 parse-torrent 解析种子文件
    const parsed = parseTorrent(uint8Array);
    
    if (!parsed || !parsed.infoHash) {
      throw new Error('无效的种子文件：找不到 InfoHash');
    }
    
    return parsed;
  } catch (error) {
    console.error('解析种子文件时出错:', error);
    throw new Error('解析种子文件失败');
  }
}

/**
 * 从磁力链接中提取基本信息
 */
export function extractFromMagnet(uri: string): parseTorrent.Instance {
  // 这是一个直接使用parseTorrent而不是远程调用的函数
  try {
    // 手动解析磁力链接
    const matches = uri.match(/xt=urn:btih:([a-zA-Z0-9]+)/i);
    if (!matches || !matches[1]) {
      throw new Error('无效的磁力链接格式');
    }
    
    const infoHash = matches[1].toLowerCase();
    if (infoHash.length !== 40) {
      throw new Error('无效的InfoHash长度');
    }
    
    // 提取名称
    let name: string | undefined;
    const nameMatch = uri.match(/dn=([^&]+)/i);
    if (nameMatch && nameMatch[1]) {
      try {
        name = decodeURIComponent(nameMatch[1]);
      } catch (e) {
        // 如果URI解码失败，使用原始值
        name = nameMatch[1];
      }
    }
    
    // 提取tracker
    const trackers: string[] = [];
    const trackerMatches = uri.matchAll(/tr=([^&]+)/gi);
    for (const match of trackerMatches) {
      if (match[1]) {
        try {
          trackers.push(decodeURIComponent(match[1]));
        } catch (e) {
          trackers.push(match[1]);
        }
      }
    }
    
    // 创建一个满足parseTorrent.Instance接口的对象
    return {
      infoHash,
      name,
      announce: trackers,
      urlList: [],
      length: 0,
      pieceLength: 0,
      lastPieceLength: 0,
      pieces: []
    };
  } catch (error) {
    console.error('解析磁力链接时出错:', error);
    throw new Error('无法解析磁力链接');
  }
}

/**
 * 尝试解析输入的文本（InfoHash或磁力链接）
 */
export async function parseInput(input: string): Promise<parseTorrent.Instance> {
  try {
    if (!input.trim()) {
      throw new Error('请输入InfoHash或磁力链接');
    }
    
    // 检查是否是有效的磁力链接
    if (input.startsWith('magnet:')) {
      // 改用我们自己的提取函数来获取基本信息
      return extractFromMagnet(input);
    }
    
    // 检查是否是有效的InfoHash (40位十六进制)
    if (/^[a-fA-F0-9]{40}$/.test(input)) {
      return parseTorrent({
        infoHash: input
      });
    }
    
    throw new Error('无效的输入格式，请输入40位十六进制InfoHash或有效的磁力链接');
  } catch (error) {
    console.error('解析输入时出错:', error);
    throw error;
  }
}

/**
 * 生成磁力链接
 */
export function generateMagnetLink(parsed: parseTorrent.Instance, customName?: string): string {
  // 添加常用的tracker
  const trackers = [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://open.tracker.cl:1337/announce',
    'udp://9.rarbg.com:2810/announce',
    'udp://tracker.openbittorrent.com:6969/announce',
    'http://tracker.openbittorrent.com:80/announce'
  ];
  
  // 创建包含所需信息的对象
  const torrentData = {
    ...parsed,
    name: customName || parsed.name,
    announce: trackers
  };
  
  // 生成磁力链接
  return parseTorrent.toMagnetURI(torrentData);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 检查是否是有效的InfoHash
 */
export function isValidInfoHash(hash: string): boolean {
  return /^[a-fA-F0-9]{40}$/.test(hash);
}

/**
 * 本地存储工具
 */
export const storageUtils = {
  saveHistory: (records: MagnetRecord[]) => {
    try {
      localStorage.setItem('bt2magnet-history', JSON.stringify(records));
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  },
  
  loadHistory: (): MagnetRecord[] => {
    try {
      const data = localStorage.getItem('bt2magnet-history');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('读取历史记录失败:', error);
      return [];
    }
  },
  
  saveThemeMode: (mode: 'light' | 'dark') => {
    try {
      localStorage.setItem('bt2magnet-theme', mode);
    } catch (error) {
      console.error('保存主题设置失败:', error);
    }
  },
  
  loadThemeMode: (): 'light' | 'dark' => {
    try {
      const savedMode = localStorage.getItem('bt2magnet-theme');
      if (savedMode === 'light' || savedMode === 'dark') {
        return savedMode;
      }
      
      // 如果没有保存的主题模式，使用系统偏好
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      
      return 'light';
    } catch (error) {
      console.error('读取主题设置失败:', error);
      return 'light';
    }
  }
};

/**
 * 从磁力链接中提取InfoHash
 */
export function extractInfoHashFromMagnet(magnetLink: string): string | null {
  try {
    const match = magnetLink.match(/urn:btih:([a-fA-F0-9]{40})/i);
    return match ? match[1].toLowerCase() : null;
  } catch (error) {
    console.error('从磁力链接提取InfoHash失败:', error);
    return null;
  }
}

/**
 * 检查浏览器是否支持文件读取API
 */
export function checkFileAPISupport(): boolean {
  return !!(window.File && window.FileReader && window.FileList && window.Blob);
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}