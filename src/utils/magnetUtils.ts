import { TorrentInstance, MagnetRecord } from '../types';

// Local storage utilities
export const storageUtils = {
  // Theme mode storage
  saveThemeMode: (mode: 'light' | 'dark') => {
    localStorage.setItem('bt2magnet-theme', mode);
  },
  
  loadThemeMode: (): 'light' | 'dark' => {
    const saved = localStorage.getItem('bt2magnet-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
  },
  
  // History storage
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

// Parse user input InfoHash or magnet link
export function parseInput(input: string): TorrentInstance {
  const trimmedInput = input.trim();
  
  // Check if it's a magnet link
  if (trimmedInput.startsWith('magnet:')) {
    return parseMagnetLink(trimmedInput);
  }
  
  // Check if it's a 40-character InfoHash
  if (/^[a-fA-F0-9]{40}$/.test(trimmedInput)) {
    return {
      infoHash: trimmedInput.toLowerCase(),
      name: undefined,
      announce: []
    };
  }
  
  throw new Error('Invalid input format. Please enter a 40-character InfoHash or valid magnet link.');
}

// Parse magnet link
function parseMagnetLink(magnetLink: string): TorrentInstance {
  try {
    const url = new URL(magnetLink);
    const params = new URLSearchParams(url.search);
    
    // Get InfoHash
    const xt = params.get('xt');
    if (!xt || !xt.startsWith('urn:btih:')) {
      throw new Error('Invalid magnet link format: missing valid InfoHash');
    }
    
    const infoHash = xt.substring(9).toLowerCase(); // Remove 'urn:btih:' prefix
    
    // Validate InfoHash format
    if (!/^[a-fA-F0-9]{40}$/.test(infoHash)) {
      throw new Error('Invalid InfoHash format in magnet link');
    }
    
    // Get name
    const name = params.get('dn');
    
    // Get tracker list
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
    throw new Error('Error parsing magnet link');
  }
}

// Parse torrent file
export async function parseTorrentFile(file: File): Promise<TorrentInstance> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          throw new Error('Unable to read file content');
        }
        
        const torrentData = await parseBencodeBuffer(buffer);
        resolve(torrentData);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Error parsing torrent file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Parse Bencode format torrent file data
async function parseBencodeBuffer(buffer: ArrayBuffer): Promise<TorrentInstance> {
  try {
    // Use crypto API to calculate InfoHash
    const uint8Array = new Uint8Array(buffer);
    const result = decodeBencode(uint8Array);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const torrentData = result.value as any;
    
    if (!torrentData || typeof torrentData !== 'object' || !('info' in torrentData)) {
      throw new Error('Invalid torrent file format: missing info field');
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = torrentData.info as any;
    
    // Calculate InfoHash (SHA1 hash of info field)
    const infoBytes = encodeBencode(info);
    const hashBuffer = await crypto.subtle.digest('SHA-1', infoBytes as ArrayBuffer);
    const infoHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Get torrent name
    const name = info.name ? new TextDecoder('utf-8').decode(info.name) : undefined;
    
    // Get tracker list
    const announce: string[] = [];
    
    // Main tracker
    if (torrentData.announce) {
      const tracker = new TextDecoder('utf-8').decode(torrentData.announce);
      announce.push(tracker);
    }
    
    // Multiple trackers
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
    
    // Get file information
    const files: Array<{ path: string; length: number }> = [];
    let totalLength = 0;
    
    if (info.files && Array.isArray(info.files)) {
      // Multi-file torrent
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
      // Single-file torrent
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
    console.error('Error parsing torrent file:', error);
    throw new Error('Invalid or corrupted torrent file format');
  }
}

// Simplified Bencode decoder
function decodeBencode(data: Uint8Array, offset = 0): { value: unknown; offset: number } {
  const char = String.fromCharCode(data[offset]);
  
  if (char === 'i') {
    // Integer
    const end = data.indexOf(101, offset + 1); // 'e' = 101
    if (end === -1) throw new Error('Invalid integer encoding');
    const numStr = new TextDecoder().decode(data.slice(offset + 1, end));
    return { value: parseInt(numStr, 10), offset: end + 1 };
  } else if (char === 'l') {
    // List
    const list: unknown[] = [];
    let pos = offset + 1;
    while (pos < data.length && data[pos] !== 101) { // 'e' = 101
      const result = decodeBencode(data, pos);
      list.push(result.value);
      pos = result.offset;
    }
    return { value: list, offset: pos + 1 };
  } else if (char === 'd') {
    // Dictionary
    const dict: Record<string, unknown> = {};
    let pos = offset + 1;
    while (pos < data.length && data[pos] !== 101) { // 'e' = 101
      const keyResult = decodeBencode(data, pos);
      const valueResult = decodeBencode(data, keyResult.offset);
      const key = new TextDecoder().decode(keyResult.value as Uint8Array);
      dict[key] = valueResult.value;
      pos = valueResult.offset;
    }
    return { value: dict, offset: pos + 1 };
  } else if (char >= '0' && char <= '9') {
    // String
    const colonPos = data.indexOf(58, offset); // ':' = 58
    if (colonPos === -1) throw new Error('Invalid string encoding');
    const lengthStr = new TextDecoder().decode(data.slice(offset, colonPos));
    const length = parseInt(lengthStr, 10);
    const stringData = data.slice(colonPos + 1, colonPos + 1 + length);
    return { value: stringData, offset: colonPos + 1 + length };
  }
  
  throw new Error('Invalid bencode data');
}

// Simplified Bencode encoder (only for InfoHash calculation)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 * Generate magnet link
 * @param torrent Torrent information object
 * @param customName Optional custom name
 * @param addTrackers Whether to add trackers
 * @param customTrackers Custom tracker list
 */
export function generateMagnetLink(
    torrent: TorrentInstance, 
    customName?: string, 
    addTrackers: boolean = false,
    customTrackers?: string[]
  ): string {
    // Basic magnet link
    let magnetLink = `magnet:?xt=urn:btih:${torrent.infoHash}`;
    
    // Add name
    const name = customName || torrent.name;
    if (name) {
      magnetLink += `&dn=${encodeURIComponent(name)}`;
    }
    
    // Add trackers
    if (torrent.announce && torrent.announce.length > 0) {
      // Use trackers from torrent file
      for (const tracker of torrent.announce) {
        magnetLink += `&tr=${encodeURIComponent(tracker)}`;
      }
    } else if (addTrackers && customTrackers && customTrackers.length > 0) {
      // Use user-selected trackers
      for (const tracker of customTrackers) {
        magnetLink += `&tr=${encodeURIComponent(tracker)}`;
      }
    }
    
    return magnetLink;
  }