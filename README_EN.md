# 🎵 VibePlayer — All-in-One Media Player

<p align="center">
  <strong>A visually stunning desktop media center integrating music, video, Bilibili, and cloud storage</strong>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏠 Stunning Homepage | Particle animations + floating orbs, 6 feature cards with one-click access |
| 🌌 Particle Background Effects | Real-time Canvas floating particles with glowing trails, auto-generated during playback |
| 💿 Vinyl Record Animation | Auto-rotating disc when playing, conic gradient textures with dynamic glow |
| 📊 Spectrum Visualizer | 32 colorful spectrum bars pulsing to the music, colors change with song theme |
| 🎵 Online Lyrics Search | Search online lyrics for local songs without embedded lyrics, with LRC sync scrolling |
| 🎵 Online Music Search | iTunes API fuzzy search, 30s royalty-free preview, one-click add to playlist |
| 📁 Local Music Library | Select local folders, recursive scan with directory tree display, click to play (10 formats) |
| 🎬 Local Video Player | Scan local video files, full player controls (fullscreen/speed/seek) |
| 🔗 URL Direct Play | Paste any audio/video URL to play directly, auto-detect file type |
| 📺 Bilibili Player | Paste Bilibili links, resolve video info, embedded player view inside the window |
| ☁️ WebDAV Cloud Storage | Connect to Synology/QNAP/NextCloud, browse and play media files |
| 📦 AList Aggregator | Connect once to access Baidu Drive, Aliyun Drive, 123 Drive, and more |
| 🎚️ Full Playback Controls | Progress bar seek, volume slider, prev/next, play/pause, playback speed |

---

## 🖼️ Screenshots

### 🏠 Stunning Homepage

![Homepage](https://raw.githubusercontent.com/taogejava/VibePlayer/master/docs/screenshots/homepage.png)

A gorgeous homepage with particle animation background and colorful floating orbs. Six feature cards provide one-click access to all functions.

### 🎵 Music Player

![Music Player](https://raw.githubusercontent.com/taogejava/VibePlayer/master/docs/screenshots/music-player.png)

Select a local music folder — the vinyl record spins with the music, particle effects and spectrum visualization pulse in sync.

### 🎵 Online Music Search

![Online Music Search](https://raw.githubusercontent.com/taogejava/VibePlayer/master/docs/screenshots/online-music.png)

Fuzzy search songs via iTunes API, preview 30-second royalty-free clips, one-click add to playlist.

### 🎵 Lyrics Display

![Lyrics](https://raw.githubusercontent.com/taogejava/VibePlayer/master/docs/screenshots/lyrics-view.png)

Click the vinyl record to toggle the lyrics panel. Supports embedded lyrics and online search, with LRC sync scrolling.

### 🎬 Local Video

![Local Video](https://raw.githubusercontent.com/taogejava/VibePlayer/master/docs/screenshots/video-panel.png)

Select a video folder, supports 11 video formats with full player controls (fullscreen/speed/seek).

### 📺 Bilibili Player

![Bilibili](https://raw.githubusercontent.com/taogejava/VibePlayer/master/docs/screenshots/bilibili-panel.png)

Paste a Bilibili link — the video plays directly in the embedded player, no browser redirect needed.

### 🔗 URL Direct Play

![URL Play](https://raw.githubusercontent.com/taogejava/VibePlayer/master/docs/screenshots/url-panel.png)

Paste any audio/video URL, auto-detect file type and play directly.

### ☁️ WebDAV Cloud Storage

![WebDAV](https://raw.githubusercontent.com/taogejava/VibePlayer/master/docs/screenshots/webdav-panel.png)

Connect to Synology, QNAP, NextCloud and other services, browse and play media files directly.

### 📦 AList Aggregator

![AList](https://raw.githubusercontent.com/taogejava/VibePlayer/master/docs/screenshots/alist-panel.png)

Connect once to access Baidu Drive, Aliyun Drive, 123 Drive, and all mounted storage.

---

## 🎮 User Guide

### Homepage Navigation
After launching, you'll see the stunning homepage. The top navigation bar and feature cards provide 6 entry points:

| Tab | Feature | Description |
|-----|---------|-------------|
| 听音乐 | Local Music | Select a local music folder, browse directory tree and play |
| 看视频 | Local Video | Scan local video files, fullscreen playback (11 formats) |
| B站 | Bilibili | Paste Bilibili links, resolve and play embedded |
| 链接 | URL Direct | Paste any audio/video URL to play directly |
| WebDAV | Cloud Storage | Connect to WebDAV server, browse and play files |
| AList | Aggregator | Connect to AList server, access all mounted drives |

### Basic Playback
- **Play/Pause**: Click the bottom play button or press `Space`
- **Prev/Next**: Click the forward/backward buttons
- **Seek**: Click anywhere on the progress bar
- **Volume**: Drag the volume slider or click the speaker icon to mute

### Play Modes
- **Sequential**: Loop through all songs in order
- **Repeat One**: Repeat the current song
- **Shuffle**: Randomly select the next song

### Lyrics Display
- **View Lyrics**: Click the vinyl record to toggle the lyrics panel on the right
- **Online Search**: When no embedded lyrics are found, click "Search Online Lyrics" button
- **Sync Scrolling**: Lyrics auto-scroll and highlight with playback progress
- **Search Results**: Manually select from multiple matched lyric versions

### Local Music Library
1. Click the "**听音乐**" tab at the top
2. Click the "**Select Folder**" button
3. Choose a music folder in the system dialog
4. Wait for scanning to complete — the directory tree appears automatically
5. Click the arrow to expand/collapse folders
6. Click any song name to start playing

**Supported Formats**: MP3, FLAC, WAV, AAC, M4A, OGG, OPUS, WMA, AIFF, APE

### Local Video Player
1. Click the "**看视频**" tab at the top
2. Click the "**Select Folder**" button
3. Choose a video folder, wait for scanning to complete
4. Click any video in the file tree to play in fullscreen
5. Supports speed control, seeking, volume adjustment, and fullscreen toggle

**Supported Formats**: MP4, MKV, WebM, AVI, MOV, WMV, FLV, M4V, TS, RMVB, 3GP

### URL Direct Play
1. Click the "**链接**" tab
2. Paste an audio/video URL in the input field
3. Click the "**Play**" button
4. Auto-detects file type — audio joins the playlist, video plays in fullscreen

### WebDAV Cloud Storage
1. Click the "**WebDAV**" tab
2. Enter WebDAV server URL, username, and password
3. Click the "**Connect**" button
4. Browse directories, click any media file to play
5. Connection history is auto-saved

**Supported Services**: Synology NAS, QNAP, NextCloud, Jianguoyun, and all WebDAV-compatible services

### AList Aggregator
1. Click the "**AList**" tab
2. Enter AList server URL and Token
3. Click the "**Connect**" button
4. Browse directories, click any media file to play

**Supported Drives**: Baidu Drive, Aliyun Drive, 123 Drive, Lanzou Cloud, Quark Drive, and all mounted storage

### Bilibili Player
1. Click the "**B站**" tab
2. Paste a Bilibili video URL in the input field
3. Click the "**Resolve**" button or press Enter
4. Upon success, video info and an embedded player are displayed

**Supported URL Formats**:
- Full URL: `https://www.bilibili.com/video/BV1B7411m7LV`
- BV ID: `BV1B7411m7LV`
- AV ID: `av12345`
- Multi-part: `...?p=2`

---

## 🛠️ Tech Stack

### Core Framework
| Technology | Version | Description |
|------------|---------|-------------|
| React | 19.2 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 7.2 | Build tool & dev server |
| Electron | 35.2 | Desktop app packaging |

### UI & Styling
| Technology | Version | Description |
|------------|---------|-------------|
| Tailwind CSS | 3.4 | Utility-first CSS framework |
| shadcn/ui | — | High-quality component library (based on Radix UI) |
| Radix UI | — | Accessible primitive components |
| lucide-react | 0.562 | Icon library |

### Effects & Visualization (Custom)
| Module | Technology |
|--------|------------|
| Particle Background | HTML5 Canvas + requestAnimationFrame |
| Spectrum Visualizer | Canvas 2D |
| Vinyl Record Rotation | CSS Keyframes |
| Homepage Orb Animation | CSS Keyframes + absolute positioning |

### Data & Utilities
| Technology | Version | Description |
|------------|---------|-------------|
| react-hook-form | 7.70 | Form management |
| zod | 4.3 | Data validation |
| date-fns | 4.1 | Date utilities |
| recharts | 2.15 | Chart components |

---

## 📁 Project Structure

```
app/
├── docs/
│   ├── index.html              # GitHub Pages landing page
│   └── screenshots/            # UI screenshots
├── src/
│   ├── sections/               # Core business modules
│   │   ├── HomePage.tsx             # Stunning homepage (feature card navigation)
│   │   ├── MusicPlayer.tsx          # Main player container (6 panels)
│   │   ├── PlayerControls.tsx       # Playback controls bar
│   │   ├── SpectrumVisualizer.tsx   # Spectrum visualizer
│   │   ├── ParticleBackground.tsx   # Particle background effects
│   │   ├── LyricsPanel.tsx          # Lyrics display panel
│   │   ├── LocalFileTree.tsx        # Local music directory tree
│   │   ├── VideoFileTree.tsx        # Local video directory tree
│   │   ├── VideoPlayer.tsx          # Video player
│   │   ├── UrlPlayPanel.tsx         # URL direct play panel
│   │   ├── BilibiliPanel.tsx        # Bilibili panel
│   │   ├── WebDAVPanel.tsx          # WebDAV cloud storage panel
│   │   └── AListPanel.tsx           # AList aggregator panel
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useLocalLibrary.ts       # Local file management
│   │   ├── useVideoLibrary.ts       # Video file management
│   │   ├── useLyricsSearch.ts       # Online lyrics search
│   │   ├── useBilibili.ts           # Bilibili resolution logic
│   │   ├── useWebDAV.ts             # WebDAV protocol client
│   │   └── useAList.ts              # AList API client
│   ├── components/
│   │   └── ui/                # shadcn/ui shared components
│   ├── lib/                    # Utility functions
│   ├── App.tsx                 # App entry (homepage routing)
│   └── main.tsx                # Render entry
├── electron/                   # Electron main process
├── index.html
├── package.json
├── electron-builder.yml
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 📥 Download & Install

Download the latest version from [Releases](https://github.com/taogejava/VibePlayer/releases).

### macOS Users

VibePlayer is not signed with an Apple Developer Certificate. On first launch, you may see:

> "Apple cannot verify 'VibePlayer' is free of malware."

**Fix (choose one):**

**Option 1**: Right-click VibePlayer.app → select "Open" → click "Open" in the dialog

**Option 2**: System Settings → Privacy & Security → scroll to bottom → click "Allow Anyway"

**Option 3**: Run this command in Terminal, then reopen the app:
```bash
xattr -cr /Applications/VibePlayer.app
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.19
- npm >= 10

### Install & Run

```bash
# Clone the repository
git clone https://github.com/taogejava/VibePlayer.git
cd VibePlayer

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Build Desktop App

```bash
# Build for Windows (installer + portable)
npm run build:win

# Build for macOS (Universal DMG)
npm run build:mac
```

---

## 📝 License

MIT License

---

<p align="center">
  Built with ❤️ using React + TypeScript + Electron
</p>
