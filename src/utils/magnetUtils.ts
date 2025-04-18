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