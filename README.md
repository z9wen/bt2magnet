# BT2Magnet

A modern, web-based BitTorrent to Magnet link converter built with React, TypeScript, and Material-UI. Convert .torrent files to magnet links or generate magnet links from InfoHash values with an intuitive drag-and-drop interface.

## ✨ Features

- **🎯 Multiple Input Methods**
  - Upload .torrent files via drag-and-drop or file picker
  - Direct InfoHash input (40-character hexadecimal)
  - Parse existing magnet links

- **🔗 Magnet Link Generation**
  - Generate clean magnet links from torrent files
  - Extract and display torrent metadata (name, size, files)
  - Optional tracker list customization

- **📱 Modern UI/UX**
  - Responsive design that works on desktop and mobile
  - Dark/Light theme toggle with system preference detection
  - Material Design components for consistent interface
  - Real-time file validation and error handling

- **💾 History Management**
  - Automatic saving of conversion history
  - Quick access to previously generated magnet links
  - Local storage persistence across sessions

- **🔧 Advanced Features**
  - Custom tracker addition and management
  - Pre-configured list of popular public trackers
  - InfoHash validation and formatting
  - File structure display for multi-file torrents

## 🚀 Quick Start

### Prerequisites

- Node.js 16.x or later
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/z9wen/bt2magnet.git
   cd bt2magnet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
npm run build
```

The built files will be available in the `dist` directory.

## 🎮 Usage

### Converting Torrent Files

1. **Upload Method 1**: Drag and drop a `.torrent` file onto the upload area
2. **Upload Method 2**: Click the upload area and select a `.torrent` file
3. **Configure Options** (Optional):
   - Toggle "Add Trackers" to include additional tracker URLs
   - Add custom tracker URLs or select from pre-configured ones
4. **Get Results**: The magnet link will be generated automatically

### Using InfoHash

1. Navigate to the "InfoHash Input" tab
2. Enter a 40-character hexadecimal InfoHash
3. Optionally provide a custom name for the torrent
4. Click "Generate Magnet Link"

### Managing History

- View all previously generated magnet links in the History section
- Click on any history item to restore it to the main interface
- History is automatically saved to browser local storage

## 🛠 Technical Stack

- **Frontend Framework**: React 19 with TypeScript
- **UI Library**: Material-UI (MUI) v7
- **Build Tool**: Vite
- **Torrent Parsing**: Custom implementation with bencode decoding
- **Styling**: Emotion (CSS-in-JS)
- **Icons**: Material Icons

### Key Dependencies

- `react` & `react-dom` - Core React framework
- `@mui/material` & `@mui/icons-material` - UI components and icons
- `bencode` - BitTorrent bencode encoding/decoding
- `parse-torrent` - Torrent file parsing utilities
- `crypto-js` - Cryptographic functions for hash generation

## 📂 Project Structure

```
src/
├── components/          # React components
│   ├── Footer.tsx       # App footer
│   ├── HistoryList.tsx  # History management
│   ├── InfoHashInput.tsx # InfoHash input form
│   ├── ResultDisplay.tsx # Magnet link display
│   └── TorrentUploader.tsx # File upload component
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   └── magnetUtils.ts   # Core torrent/magnet utilities
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── theme.ts             # Material-UI theme configuration
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Adding New Features

1. **Components**: Add new React components in `src/components/`
2. **Types**: Define TypeScript interfaces in `src/types/`
3. **Utilities**: Add helper functions in `src/utils/`
4. **Styling**: Use Material-UI's `sx` prop or create custom themes

## 🔒 Privacy & Security

- **Client-Side Only**: All torrent processing happens in your browser
- **No Data Upload**: Torrent files are never sent to external servers
- **Local Storage**: History and preferences are stored locally
- **Open Source**: Full source code available for review

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Material-UI](https://mui.com/) for the excellent React component library
- [Vite](https://vitejs.dev/) for the fast build tool
- [BitTorrent Protocol](https://www.bittorrent.org/beps/bep_0003.html) specification

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/z9wen/bt2magnet/issues) page
2. Create a new issue with detailed information
3. Provide browser version and error messages if applicable

---

**Made with ❤️ using React and TypeScript**
