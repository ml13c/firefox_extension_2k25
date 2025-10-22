# Installation Guide

## How to Install the Job Application Tracker Extension

### Step 1: Prepare the Extension
1. Make sure all files are in the same folder:
   - `manifest.json`
   - `popup.html`
   - `popup.js`
   - `background.js`
   - `content.js`

### Step 2: Load the Extension in Firefox
1. Open Firefox
2. Type `about:debugging` in the address bar and press Enter
3. Click on "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on" button
5. Navigate to your extension folder and select `manifest.json`
6. Click "Open"

### Step 3: Verify Installation
1. You should see the extension icon in your Firefox toolbar
2. Click the icon to open the popup
3. The extension is now ready to use!

### Step 4: Using the Extension
1. **Add Applications**: Fill out the form with company name, date, location, and status
2. **View Applications**: See all your applications in the list below the form
3. **Export to CSV**: Click "Export to CSV" to download all applications as a spreadsheet
4. **Delete Applications**: Click the "Delete" button on any application to remove it

### Troubleshooting
- If the extension doesn't load, make sure all files are in the same directory
- If you see errors, check the browser console (F12) for details
- The extension works on all websites and doesn't require any special setup

### Notes
- This is a temporary extension that will be removed when you restart Firefox
- To make it permanent, you would need to package it as a .xpi file
- All data is stored locally in your browser
