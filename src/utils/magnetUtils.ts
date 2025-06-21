import { TorrentInstance, MagnetRecord } from '../types';

// 本地存储工具
export const storageUtils = {
  // 主题模式存储
  saveThemeMode: (mode: 'light' | 'dark') => {
    localStorage.setItem('bt2magnet-theme', mode);
  },
  
  loadThemeMode: (): 'light' | 'dark' => {
    const saved = localStorage.getItem('bt2magnet-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
  },
  
  // 历史记录存储
  saveHistory: (history: MagnetRecord[]) => {
    localStorage.setItem('bt2magnet-history', JSON.stringify(history));
  },
  
  loadHistory: (): MagnetRecord[] => {
    try {
      const saved = localStorage.getItem('bt2magnet-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
};

// 解析用户输入的InfoHash或磁力链接
export function parseInput(input: string): TorrentInstance {
  const trimmedInput = input.trim();
  
  // 检查是否是磁力链接
  if (trimmedInput.startsWith('magnet:')) {
    return parseMagnetLink(trimmedInput);
  }
  
  // 检查是否是40位InfoHash
  if (/^[a-fA-F0-9]{40}$/.test(trimmedInput)) {
    return {
      infoHash: trimmedInput.toLowerCase(),
      name: undefined,
      announce: []
    };
  }
  
  throw new Error('输入格式无效。请输入40位InfoHash或有效的磁力链接。');
}

// 解析磁力链接
function parseMagnetLink(magnetLink: string): TorrentInstance {
  try {
    const url = new URL(magnetLink);
    const params = new URLSearchParams(url.search);
    
    // 获取InfoHash
    const xt = params.get('xt');
    if (!xt || !xt.startsWith('urn:btih:')) {
      throw new Error('磁力链接格式无效：缺少有效的InfoHash');
    }
    
    const infoHash = xt.substring(9).toLowerCase(); // 移除 'urn:btih:' 前缀
    
    // 验证InfoHash格式
    if (!/^[a-fA-F0-9]{40}$/.test(infoHash)) {
      throw new Error('磁力链接中的InfoHash格式无效');
    }
    
    // 获取名称
    const name = params.get('dn');
    
    // 获取Tracker列表
    const announce = params.getAll('tr');
    
    return {
      infoHash,
      name: name ? decodeURIComponent(name) : undefined,
      announce
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('解析磁力链接时出错');
  }
}

// 解析种子文件
export async function parseTorrentFile(file: File): Promise<TorrentInstance> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          throw new Error('无法读取文件内容');
        }
        
        const torrentData = await parseBencodeBuffer(buffer);
        resolve(torrentData);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('解析种子文件时出错'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('读取文件时出错'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// 解析Bencode格式的种子文件数据
async function parseBencodeBuffer(buffer: ArrayBuffer): Promise<TorrentInstance> {
  try {
    // 使用 crypto API 计算 InfoHash
    const uint8Array = new Uint8Array(buffer);
    const result = decodeBencode(uint8Array);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const torrentData = result.value as any;
    
    if (!torrentData || typeof torrentData !== 'object' || !('info' in torrentData)) {
      throw new Error('种子文件格式无效：缺少info字段');
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = torrentData.info as any;
    
    // 计算InfoHash (info字段的SHA1哈希值)
    const infoBytes = encodeBencode(info);
    const hashBuffer = await crypto.subtle.digest('SHA-1', infoBytes);
    const infoHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // 获取种子名称
    const name = info.name ? new TextDecoder('utf-8').decode(info.name) : undefined;
    
    // 获取Tracker列表
    const announce: string[] = [];
    
    // 主Tracker
    if (torrentData.announce) {
      const tracker = new TextDecoder('utf-8').decode(torrentData.announce);
      announce.push(tracker);
    }
    
    // 多个Tracker
    if (torrentData['announce-list'] && Array.isArray(torrentData['announce-list'])) {
      for (const trackerGroup of torrentData['announce-list']) {
        if (Array.isArray(trackerGroup)) {
          for (const tracker of trackerGroup) {
            const trackerUrl = new TextDecoder('utf-8').decode(tracker);
            if (!announce.includes(trackerUrl)) {
              announce.push(trackerUrl);
            }
          }
        }
      }
    }
    
    // 获取文件信息
    const files: Array<{ path: string; length: number }> = [];
    let totalLength = 0;
    
    if (info.files && Array.isArray(info.files)) {
      // 多文件种子
      for (const file of info.files) {
        if (file.path && file.length) {
          const pathParts = file.path.map((part: Uint8Array) => 
            new TextDecoder('utf-8').decode(part)
          );
          files.push({
            path: pathParts.join('/'),
            length: file.length
          });
          totalLength += file.length;
        }
      }
    } else if (info.length) {
      // 单文件种子
      totalLength = info.length;
      if (name) {
        files.push({
          path: name,
          length: info.length
        });
      }
    }
    
    return {
      infoHash,
      name,
      announce: announce.length > 0 ? announce : undefined,
      files: files.length > 0 ? files : undefined,
      length: totalLength > 0 ? totalLength : undefined
    };
  } catch (error) {
    console.error('解析种子文件时出错:', error);
    throw new Error('种子文件格式无效或损坏');
  }
}

// 简化的Bencode解码器
function decodeBencode(data: Uint8Array, offset = 0): { value: unknown; offset: number } {
  const char = String.fromCharCode(data[offset]);
  
  if (char === 'i') {
    // 整数
    const end = data.indexOf(101, offset + 1); // 'e' = 101
    if (end === -1) throw new Error('Invalid integer encoding');
    const numStr = new TextDecoder().decode(data.slice(offset + 1, end));
    return { value: parseInt(numStr, 10), offset: end + 1 };
  } else if (char === 'l') {
    // 列表
    const list: any[] = [];
    let pos = offset + 1;
    while (pos < data.length && data[pos] !== 101) { // 'e' = 101
      const result = decodeBencode(data, pos);
      list.push(result.value);
      pos = result.offset;
    }
    return { value: list, offset: pos + 1 };
  } else if (char === 'd') {
    // 字典
    const dict: any = {};
    let pos = offset + 1;
    while (pos < data.length && data[pos] !== 101) { // 'e' = 101
      const keyResult = decodeBencode(data, pos);
      const valueResult = decodeBencode(data, keyResult.offset);
      const key = new TextDecoder().decode(keyResult.value);
      dict[key] = valueResult.value;
      pos = valueResult.offset;
    }
    return { value: dict, offset: pos + 1 };
  } else if (char >= '0' && char <= '9') {
    // 字符串
    const colonPos = data.indexOf(58, offset); // ':' = 58
    if (colonPos === -1) throw new Error('Invalid string encoding');
    const lengthStr = new TextDecoder().decode(data.slice(offset, colonPos));
    const length = parseInt(lengthStr, 10);
    const stringData = data.slice(colonPos + 1, colonPos + 1 + length);
    return { value: stringData, offset: colonPos + 1 + length };
  }
  
  throw new Error('Invalid bencode data');
}

// 简化的Bencode编码器（仅用于计算InfoHash）
function encodeBencode(data: any): Uint8Array {
  if (typeof data === 'number') {
    const str = `i${data}e`;
    return new TextEncoder().encode(str);
  } else if (data instanceof Uint8Array) {
    const lengthStr = data.length.toString();
    const result = new Uint8Array(lengthStr.length + 1 + data.length);
    result.set(new TextEncoder().encode(lengthStr), 0);
    result[lengthStr.length] = 58; // ':'
    result.set(data, lengthStr.length + 1);
    return result;
  } else if (Array.isArray(data)) {
    const encoded = data.map(encodeBencode);
    const totalLength = encoded.reduce((sum, arr) => sum + arr.length, 0) + 2;
    const result = new Uint8Array(totalLength);
    result[0] = 108; // 'l'
    let offset = 1;
    for (const arr of encoded) {
      result.set(arr, offset);
      offset += arr.length;
    }
    result[result.length - 1] = 101; // 'e'
    return result;
  } else if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data).sort();
    const encoded = keys.map(key => [
      encodeBencode(new TextEncoder().encode(key)),
      encodeBencode(data[key])
    ]);
    const totalLength = encoded.reduce((sum, [key, value]) => sum + key.length + value.length, 0) + 2;
    const result = new Uint8Array(totalLength);
    result[0] = 100; // 'd'
    let offset = 1;
    for (const [key, value] of encoded) {
      result.set(key, offset);
      offset += key.length;
      result.set(value, offset);
      offset += value.length;
    }
    result[result.length - 1] = 101; // 'e'
    return result;
  }
  
  throw new Error('Unsupported data type for bencode encoding');
}

/**
 * 生成磁力链接
 * @param torrent 种子信息对象
 * @param customName 可选的自定义名称
 * @param addTrackers 是否添加tracker
 * @param customTrackers 自定义tracker列表
 */
export function generateMagnetLink(
    torrent: TorrentInstance, 
    customName?: string, 
    addTrackers: boolean = false,
    customTrackers?: string[]
  ): string {
    // 基本磁力链接
    let magnetLink = `magnet:?xt=urn:btih:${torrent.infoHash}`;
    
    // 添加名称
    const name = customName || torrent.name;
    if (name) {
      magnetLink += `&dn=${encodeURIComponent(name)}`;
    }
    
    // 添加tracker
    if (torrent.announce && torrent.announce.length > 0) {
      // 使用种子文件中的tracker
      for (const tracker of torrent.announce) {
        magnetLink += `&tr=${encodeURIComponent(tracker)}`;
      }
    } else if (addTrackers && customTrackers && customTrackers.length > 0) {
      // 使用用户选择的tracker
      for (const tracker of customTrackers) {
        magnetLink += `&tr=${encodeURIComponent(tracker)}`;
      }
    }
    
    return magnetLink;
  }