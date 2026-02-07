# Testing Guide

## Quick Start Testing

### Prerequisites
- Chrome browser with extension loaded
- Active Dotloop account with at least one transaction
- 5 minutes of time

### Test Steps

1. **Navigate to Dotloop**
   - Open Chrome
   - Go to https://www.dotloop.com
   - Log in with your credentials

2. **Open Extension Popup**
   - Click the "DL" icon in your Chrome toolbar
   - You should see a popup with "Ready to Extract" message
   - Button says "Extract All Transactions"

3. **Start Extraction**
   - Click "Extract All Transactions"
   - You should see:
     - Loading spinner
     - Progress bar (0% → 100%)
     - "Extracting Transactions..." message

4. **Wait for Completion**
   - Extraction typically takes 30-60 seconds
   - Progress bar will fill as data is fetched
   - You'll see a checkmark when complete

5. **Verify Results**
   - Should show:
     - ✅ Checkmark icon
     - Transaction count (e.g., "25 Transactions")
     - Total value (e.g., "$5,250,000")
     - Extraction time
   - Two buttons should appear:
     - "Download CSV"
     - "Send to Dashboard"

6. **Download CSV**
   - Click "Download CSV"
   - File should download: `dotloop-transactions-YYYY-MM-DD.csv`
   - Open the file to verify data

7. **Verify CSV Content**
   - Open the downloaded CSV in Excel or text editor
   - Should contain:
     - Header row with column names
     - One row per transaction
     - All transaction fields populated
   - Example columns:
     - Loop ID, Loop Name, Loop Status, Price, Address, City, State, etc.

---

## Detailed Test Scenarios

### Scenario 1: Basic Extraction

**Goal:** Verify extension can extract transactions

**Steps:**
1. Load extension in Chrome
2. Go to Dotloop.com
3. Click extension icon
4. Click "Extract All Transactions"
5. Wait for completion

**Expected Results:**
- ✅ No errors in console
- ✅ Transaction count > 0
- ✅ Total value > 0
- ✅ Success message appears

**Pass/Fail:** ___

---

### Scenario 2: CSV Download

**Goal:** Verify CSV file downloads correctly

**Steps:**
1. Complete basic extraction
2. Click "Download CSV"
3. Open downloaded file in text editor
4. Verify content

**Expected Results:**
- ✅ File downloads to Downloads folder
- ✅ Filename format: `dotloop-transactions-YYYY-MM-DD.csv`
- ✅ File contains header row
- ✅ File contains transaction data rows
- ✅ Data is properly escaped (commas, quotes handled)

**Pass/Fail:** ___

---

### Scenario 3: Large Dataset

**Goal:** Verify extension handles 100+ transactions

**Steps:**
1. Have Dotloop account with 100+ transactions
2. Load extension
3. Go to Dotloop.com
4. Click "Extract All Transactions"
5. Monitor progress bar
6. Wait for completion

**Expected Results:**
- ✅ Progress bar shows incremental progress
- ✅ No timeout errors
- ✅ All transactions extracted
- ✅ Completion time < 2 minutes

**Pass/Fail:** ___

---

### Scenario 4: Error Handling

**Goal:** Verify extension handles errors gracefully

**Steps:**
1. Close Dotloop tab
2. Click extension icon
3. Click "Extract All Transactions"

**Expected Results:**
- ✅ Error message appears
- ✅ Error is user-friendly
- ✅ "Try Again" button is available
- ✅ No console errors

**Pass/Fail:** ___

---

### Scenario 5: Data Accuracy

**Goal:** Verify extracted data matches Dotloop

**Steps:**
1. Extract transactions
2. Download CSV
3. Open a transaction in Dotloop
4. Compare fields in CSV with Dotloop

**Expected Results:**
- ✅ Loop Name matches
- ✅ Status matches
- ✅ Price matches
- ✅ Address matches
- ✅ All key fields match

**Pass/Fail:** ___

---

### Scenario 6: Cached Data

**Goal:** Verify extension caches extracted data

**Steps:**
1. Extract transactions
2. Close popup
3. Click extension icon again
4. Verify success state appears immediately

**Expected Results:**
- ✅ Success state shows without extraction
- ✅ Previous data is displayed
- ✅ "Extract Again" button available

**Pass/Fail:** ___

---

## Browser Console Testing

### Enable Console Logs

1. Open Chrome DevTools (F12)
2. Click "Console" tab
3. Go to Dotloop.com
4. Click extension icon
5. Click "Extract All Transactions"

### Expected Console Messages

You should see messages like:
```
[Dotloop Extension] Content script loaded
[Dotloop Extension] Starting transaction extraction...
[Dotloop Extension] Fetched 25 transactions
[Dotloop Extension] Enriched 25 transactions
[Dotloop Extension] Extraction complete: {...}
```

### Troubleshooting Console

If you see errors:
- Check error message for details
- Look for "Not authenticated" → log in to Dotloop
- Look for "API error" → try refreshing page
- Look for "timeout" → try again later

---

## Data Validation Checklist

### Field Completeness

- [ ] Loop ID present for all transactions
- [ ] Loop Name present for all transactions
- [ ] Loop Status present for all transactions
- [ ] Price or Sale Price present
- [ ] Address fields populated where applicable
- [ ] Agent name populated
- [ ] Commission fields populated

### Data Format

- [ ] Dates in consistent format (YYYY-MM-DD)
- [ ] Numbers without currency symbols
- [ ] Text properly escaped in CSV
- [ ] No truncated values
- [ ] No special characters breaking format

### CSV Format

- [ ] Header row present
- [ ] Comma-separated values
- [ ] Quoted values with commas
- [ ] Proper line endings
- [ ] No extra blank rows

---

## Performance Testing

### Extraction Speed

| Transaction Count | Expected Time | Actual Time | Pass/Fail |
|------------------|---------------|------------|-----------|
| 1-10             | < 10 sec      | ___        | ___       |
| 11-50            | 10-30 sec     | ___        | ___       |
| 51-100           | 30-60 sec     | ___        | ___       |
| 100+             | 60-120 sec    | ___        | ___       |

### Memory Usage

- [ ] Extension doesn't consume excessive memory
- [ ] No memory leaks after extraction
- [ ] Browser remains responsive

---

## Browser Compatibility

### Test Browsers

- [ ] Chrome (latest)
- [ ] Edge (Chromium-based)
- [ ] Brave (Chromium-based)
- [ ] Opera (Chromium-based)

### Expected Results

- ✅ Works on all Chromium-based browsers
- ✅ Same functionality across browsers
- ✅ No browser-specific errors

---

## Regression Testing

After updates, verify:

- [ ] Extension still loads
- [ ] Extraction still works
- [ ] CSV download still works
- [ ] No new console errors
- [ ] Performance unchanged
- [ ] Data accuracy maintained

---

## Known Issues

None currently identified. If you find issues, please report them.

---

## Test Report Template

```
Date: _______________
Tester: _______________
Browser: _______________
Dotloop Transactions: _______________

Test Results:
- Basic Extraction: PASS / FAIL
- CSV Download: PASS / FAIL
- Large Dataset: PASS / FAIL
- Error Handling: PASS / FAIL
- Data Accuracy: PASS / FAIL
- Cached Data: PASS / FAIL

Issues Found:
1. _______________
2. _______________

Comments:
_______________
_______________
```

---

## Getting Help

If tests fail:

1. Check console (F12) for error messages
2. Verify you're logged into Dotloop
3. Try refreshing the Dotloop page
4. Try reinstalling the extension
5. Contact support: support@dotloop-reporter.manus.space

---

**Thank you for testing!**
