# Dotloop Reporting Tool - Browser Extension

A Chrome browser extension that extracts all your Dotloop transactions and converts them to CSV format for analysis with the Dotloop Reporting Tool dashboard.

## Features

✅ **One-Click Extraction** - Extract all transactions with a single click  
✅ **Fast Processing** - Uses Dotloop's API for rapid data retrieval  
✅ **CSV Export** - Download data as CSV for external use  
✅ **Dashboard Integration** - Send data directly to your Reporting Tool  
✅ **Real-Time Progress** - See extraction progress with visual feedback  
✅ **Error Handling** - Helpful error messages if anything goes wrong  
✅ **Data Caching** - Quick re-access to recently extracted data  

## Installation

### For Users (Chrome Web Store)

Coming soon! Once published, installation will be as simple as:

1. Visit the Chrome Web Store
2. Click "Add to Chrome"
3. Confirm the installation

### For Developers (Testing)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select the `dotloop-extension` folder
6. The extension will appear in your Chrome toolbar

## Usage

1. **Navigate to Dotloop.com** - Log in to your account
2. **Click the Extension Icon** - Look for the "DL" icon in your toolbar
3. **Click "Extract All Transactions"** - The extension will start fetching your data
4. **Wait for Completion** - You'll see a progress bar and transaction count
5. **Download or Send** - Choose to download as CSV or send to your dashboard

## File Structure

```
dotloop-extension/
├── manifest.json                 # Extension configuration
├── src/
│   ├── content/
│   │   └── content.js           # Dotloop page integration
│   ├── background/
│   │   └── service-worker.js    # Background processing
│   ├── popup/
│   │   ├── popup.html           # UI interface
│   │   ├── popup.css            # Styling
│   │   └── popup.js             # Popup logic
│   └── utils/
│       ├── api.js               # API utilities
│       ├── extractor.js         # Data extraction
│       └── csv-converter.js     # CSV conversion
├── README.md                     # This file
└── INSTALLATION.md               # Detailed installation guide
```

## How It Works

1. **Authentication** - Extension reads your Dotloop session token
2. **API Calls** - Fetches transaction list from Dotloop's API
3. **Pagination** - Handles multiple pages automatically
4. **Detail Fetching** - Retrieves full details for each transaction
5. **Normalization** - Converts data to standard format
6. **CSV Conversion** - Formats data as CSV with proper escaping
7. **Export/Send** - Downloads file or sends to dashboard

## Permissions

The extension requests these permissions:

- **storage** - To save extracted data locally
- **tabs** - To detect which page you're on
- **scripting** - To run extraction code on Dotloop pages
- **Host Permissions** (`https://www.dotloop.com/*`) - To access Dotloop data

These permissions are necessary for the extension to function and are only used for extracting your transaction data.

## Privacy & Security

- ✅ All data extraction happens locally in your browser
- ✅ No data is sent to external servers except your Reporting Tool
- ✅ Extension only works when you're logged into Dotloop
- ✅ Your Dotloop credentials are never stored or transmitted
- ✅ Data is cleared from extension storage after use

## Troubleshooting

### Extension doesn't appear in toolbar

1. Go to `chrome://extensions/`
2. Find "Dotloop Reporting Tool"
3. Make sure it's enabled (toggle should be ON)
4. Try refreshing the extensions page or restarting Chrome

### "Not authenticated" error

1. Make sure you're logged into Dotloop
2. Refresh the Dotloop page
3. Try the extraction again

### Extraction is slow

- This is normal for large datasets (100+ transactions)
- The extension adds delays between API calls to avoid rate limiting
- Typical extraction time: 30-60 seconds for 100+ transactions

### Data not showing in dashboard

1. Make sure you clicked "Send to Dashboard"
2. Check that you're logged into your Reporting Tool account
3. Try downloading the CSV and uploading it manually

## Support

For issues or feature requests:

1. Check this README for troubleshooting steps
2. Review the INSTALLATION.md for setup instructions
3. Check the browser console (F12) for error messages
4. Contact support: support@dotloop-reporter.manus.space

## Development

### Building from Source

```bash
# No build step required - extension runs directly
# Just load unpacked in Chrome
```

### Testing

1. Load the extension in Chrome
2. Navigate to Dotloop.com
3. Click the extension icon
4. Click "Extract All Transactions"
5. Check the browser console (F12) for logs

### Debugging

Open DevTools (F12) and check:
- **Console** - For error messages and logs
- **Network** - To see API calls being made
- **Storage** - To see cached data

## Future Enhancements

- [ ] Scheduled automatic extractions
- [ ] Real-time sync with Dotloop
- [ ] Custom field mapping
- [ ] Filtering and sorting options
- [ ] Multiple profile support
- [ ] Export to Excel format
- [ ] Email report delivery

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Changelog

### v1.0.0 (Initial Release)
- Initial release with transaction extraction
- CSV export functionality
- Dashboard integration
- Real-time progress tracking

---

**Made with ❤️ by the Dotloop Reporting Tool team**
