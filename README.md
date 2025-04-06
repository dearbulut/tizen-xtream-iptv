# Xtream IPTV Player for Samsung Tizen TV

Samsung Tizen TV için XTREAM IPTV oynatıcısı

A modern IPTV player application for Samsung Tizen TVs that supports Xtream API protocol.

## Features

- Live TV streaming
- Movies on demand
- TV Series with episode selection
- Category-based content organization
- Remote control navigation optimized for TV
- Responsive design for different TV resolutions
- Utilizes Samsung Tizen's native AVPlay API for optimal performance

## Requirements

- Samsung Tizen TV (2017 or newer)
- Xtream IPTV subscription with valid credentials
- Internet connection

## Development Setup

### Prerequisites

1. Install Tizen Studio: [Download Tizen Studio](https://developer.tizen.org/development/tizen-studio/download)
2. Install the TV extensions in the Package Manager
3. Set up a Samsung developer account and certificate

### Building the Application

1. Clone this repository
2. Open Tizen Studio
3. Import the project: File > Import > Tizen > Tizen Project
4. Select the project directory
5. Build the project: Right-click on the project > Build Project
6. Create a certificate if you haven't already: Tools > Certificate Manager
7. Package the application: Right-click on the project > Build Signed Package

### Testing on Emulator

1. Launch the Tizen TV Emulator Manager
2. Create a TV emulator instance if you don't have one
3. Start the emulator
4. Right-click on the project > Run As > Tizen Web Application

### Deploying to a Real Device

1. Enable Developer Mode on your Samsung TV:
   - Go to Apps
   - Press 1, 2, 3, 4, 5 in sequence on the remote
   - Enable Developer Mode
   - Set the IP address of your development machine
2. Connect your TV and development machine to the same network
3. In Tizen Studio, right-click on the project > Run As > Tizen Web Application
4. Select your TV from the device list

## Usage

1. Launch the application on your TV
2. On first run, you'll be prompted to enter your Xtream IPTV credentials:
   - Server URL (including port)
   - Username
   - Password
3. Navigate using the TV remote:
   - Use arrow keys to move between items
   - Press Enter/OK to select
   - Use Back button to go back or exit
   - Use Play/Pause buttons to control playback

## Project Structure

- `index.html` - Main application HTML
- `css/` - Stylesheets
- `js/` - JavaScript files
  - `config.js` - Application configuration
  - `api.js` - Xtream API communication
  - `player.js` - Media player implementation
  - `navigation.js` - TV remote navigation
  - `app.js` - Main application logic
- `images/` - Images and icons
- `config.xml` - Tizen application configuration
- `tizen-app.js` - Tizen specific lifecycle management

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Samsung Tizen Development Team
- Xtream UI API Documentation
