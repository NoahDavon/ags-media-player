# AGS Media Player (GTK4)

A stylized, interactive media player popup built with [Aylur's GTK Shell (AGS)](https://github.com/Aylur/ags). This project uses the GTK4-based version of AGS (Astal) and features a clean, modern UI for controlling media playback.

## Features

- **MPRIS Integration**: Real-time track information including title, artist, and cover art.
- **Playback Controls**: Play/Pause, Skip Forward, and Skip Backward.
- **Progress Tracking**: Visual progress bar for the current track with:
    - **Manual Seeking**: Click or drag the progress bar to jump to a specific time.
    - **Time Display**: Toggle between total track length and remaining time by clicking the time label.
- **Multiple Player Support**: Easily cycle through multiple active media players (e.g., Spotify, Browser, MPV).
- **Interactive UI**: 
    - Hover-sensitive info overlay.
    - Click-to-dismiss background (Clicking outside the player closes the window).
    - Keyboard support (Press `Escape` to close).
- **Modern Aesthetics**: Built with SCSS, featuring transparency, rounded corners, and smooth hover transitions.

## Prerequisites

- [AGS (v2 / Astal)](https://aylur.github.io/astal/guide/getting-started)
- `libadwaita`
- `playerctl` (for MPRIS backend support)

## Installation & Usage

1. **Clone the repository** (or copy to your ags config):
   ```bash
   mkdir -p ~/.config/ags
   cp -r ./* ~/.config/ags/
   ```

2. **Run the configuration**:
   ```bash
   ags run
   ```

## Structure

- `app.ts`: Entry point for the application.
- `widget/MediaPlayer.tsx`: Main UI logic and window management.
- `widget/PlayerProgress.tsx`: Detailed progress bar component.
- `style.scss`: Theming and animations.

## Learning Project

This repository was created as a learning exercise for exploring the GTK4 version of AGS and MPRIS integration. I highly recommend giving it a go yourself, especially if you come from a React background like I have. Feel free to use it as a reference for your own AGS configurations! This was 30% vibe coding, 27% banging my head against docs, 43% shouting at Gemini, and a 100% fun use of my time.
