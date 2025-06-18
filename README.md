# Golden Lap Member Creator

A modern desktop application for creating, editing, and managing custom team members and portraits for the game **Golden Lap**.

## 📥 Download

**[Download Latest Release](https://github.com/VenEttore/golden-lap-member-creator/releases/latest)**

- **Windows 10/11 (64-bit)**: Download the ZIP file, extract, and run `golden-lap-member-creator.exe`
- **No installation required** - completely portable
- **Offline functionality** - works without internet connection

## Features
- Create, edit, and manage drivers, engineers, and crew chiefs
- Batch generate random members and portraits
- Advanced search, sorting, and filtering
- Modpack creation and export (with portraits)
- Modern, responsive UI/UX

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```sh
git clone https://github.com/VenEttore/golden-lap-member-creator.git
cd golden-lap-member-creator
npm install
```

### Running Locally
```sh
npm run dev
```

### Building for Production
```sh
npm run build
npm start
```

### Building Portable Executable
```sh
npm run electron:package
```
The portable executable will be created in `dist/golden-lap-member-creator-win32-x64/`

## Releases

### Creating a New Release

#### Option 1: Using the Release Script (Recommended)
```powershell
./scripts/create-release.ps1 -Version "1.0.0"
```

#### Option 2: Manual Process
1. Update the version in `package.json`
2. Commit your changes
3. Create and push a version tag:
   ```sh
   git tag v1.0.0
   git push origin v1.0.0
   ```

GitHub Actions will automatically build and create a release with the portable executable.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)

---

## Disclaimer
This project is an **unofficial fan-made tool** for the game Golden Lap. It is not affiliated with, endorsed by, or supported by Strelka Games or Funselektor Labs Inc.

**Golden Lap** and all related trademarks, logos, and images are the property of Strelka Games and Funselektor Labs Inc. All rights reserved.

If you are a representative of Strelka Games or Funselektor Labs Inc. and have concerns about this project, please contact us and we will address them promptly.

---

## Credits
- Developed by Ven Ettore
- Special thanks to Strelka Games and Funselektor Labs Inc. for creating Golden Lap.
