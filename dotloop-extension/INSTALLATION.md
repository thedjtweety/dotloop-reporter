# Installation Instructions

## For Developers (Testing)

### Prerequisites
- Google Chrome (latest version)
- Access to Dotloop account

### Steps

1. **Extract the Extension Files**
   - You should have a folder named `dotloop-extension` with these files:
     - `manifest.json`
     - `src/` folder (with content, background, popup, utils subfolders)
     - `README.md`
     - `INSTALLATION.md`

2. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/` in your browser
   - Or use menu: Chrome → Settings → Extensions

3. **Enable Developer Mode**
   - Toggle "Developer mode" in the top-right corner
   - You should see new buttons appear

4. **Load Unpacked Extension**
   - Click "Load unpacked"
   - Navigate to the `dotloop-extension` folder on your computer
   - Click "Select Folder" or "Open"

5. **Verify Installation**
   - Extension should appear in your extensions list as "Dotloop Reporting Tool"
   - A "DL" icon should appear in your Chrome toolbar (top-right)
   - Click the icon to open the popup

6. **Test the Extension**
   - Go to https://www.dotloop.com
   - Log in to your account
   - Click the extension icon in your toolbar
   - Click "Extract All Transactions"
   - See TESTING_GUIDE.md for detailed testing steps

---

## For End Users (Chrome Web Store)

### Coming Soon!

Once the extension is published to the Chrome Web Store, installation will be as simple as:

1. Visit the Chrome Web Store page
2. Click "Add to Chrome"
3. Click "Add extension" in the confirmation dialog
4. Extension is ready to use!

---

## Troubleshooting Installation

### Extension doesn't appear in toolbar

**Solution:**
1. Go to `chrome://extensions/`
2. Find "Dotloop Reporting Tool"
3. Make sure it's enabled (toggle should be ON)
4. If still not visible, try:
   - Refresh the extensions page (F5)
   - Restart Chrome completely
   - Reinstall the extension

### "Manifest error" when loading

**Solution:**
1. Make sure you're loading the correct folder (`dotloop-extension`)
2. Verify `manifest.json` exists in the root of that folder
3. Check that the manifest file is valid JSON (no syntax errors)
4. Try removing and reinstalling the extension

### Extension loads but doesn't work

**Solution:**
1. Open DevTools (F12)
2. Check the Console tab for error messages
3. Look for messages starting with `[Dotloop Extension]`
4. Try refreshing the extension:
   - Go to `chrome://extensions/`
   - Click the refresh icon on the extension card
   - Refresh the Dotloop page (F5)

### "Not authenticated" error

**Solution:**
1. Make sure you're logged into Dotloop
2. Refresh the Dotloop page
3. Try the extraction again

### Extension icon doesn't appear

**Solution:**
1. Go to `chrome://extensions/`
2. Find "Dotloop Reporting Tool"
3. Make sure the toggle is ON (blue)
4. If the icon still doesn't show:
   - Click the puzzle icon in the top-right toolbar
   - Find "Dotloop Reporting Tool"
   - Click the pin icon to pin it to your toolbar

---

## File Structure

For the extension to work properly, ensure this structure exists:

```
dotloop-extension/
├── manifest.json
├── README.md
├── INSTALLATION.md
├── TESTING_GUIDE.md
└── src/
    ├── content/
    │   └── content.js
    ├── background/
    │   └── service-worker.js
    ├── popup/
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js
    └── utils/
        ├── api.js
        ├── extractor.js
        └── csv-converter.js
```

If any files are missing, the extension won't work properly.

---

## Permissions Explained

The extension requests these permissions:

- **storage** - To save extracted data locally on your computer
- **tabs** - To detect which page you're currently on
- **scripting** - To run extraction code on Dotloop pages
- **Host Permissions** (`https://www.dotloop.com/*`) - To access Dotloop data

These permissions are necessary for the extension to function and are only used for extracting your transaction data. We do not:
- Track your browsing
- Collect personal information
- Share data with third parties
- Store data on external servers

---

## Privacy & Security

- ✅ All data extraction happens locally in your browser
- ✅ No data is sent to external servers except your Reporting Tool
- ✅ Extension only works when you're logged into Dotloop
- ✅ Your Dotloop credentials are never stored or transmitted
- ✅ Data is cleared from extension storage after use
- ✅ Extension uses HTTPS for all communications

---

## Uninstallation

To remove the extension:

1. Go to `chrome://extensions/`
2. Find "Dotloop Reporting Tool"
3. Click the trash/delete icon
4. Confirm removal

All extension data will be deleted.

---

## Getting Help

If you encounter issues during installation:

1. Check this file for troubleshooting steps
2. Review README.md for feature documentation
3. Review TESTING_GUIDE.md for usage instructions
4. Check the browser console (F12) for error messages
5. Contact support: support@dotloop-reporter.manus.space

---

## Next Steps

After successful installation:

1. Read README.md for feature overview
2. Read TESTING_GUIDE.md for detailed usage instructions
3. Test the extension with your Dotloop account
4. Download your first CSV export
5. Send data to your Reporting Tool dashboard
6. Enjoy automated transaction analysis!

---

## System Requirements

- **Browser:** Google Chrome 90+ (or any Chromium-based browser)
- **Operating System:** Windows, macOS, or Linux
- **Internet:** Active internet connection
- **Dotloop Account:** Active account with transactions

---

## Version Info

- **Extension Version:** 1.0.0
- **Last Updated:** February 2026
- **Manifest Version:** 3 (Chrome's latest standard)

---

**Questions?** Contact support@dotloop-reporter.manus.space
