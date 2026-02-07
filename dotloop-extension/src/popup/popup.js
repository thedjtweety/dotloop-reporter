/**
 * Dotloop Reporting Tool - Popup Script
 * Handles UI interactions and data management
 */

console.log('[Dotloop Extension] Popup script loaded');

// DOM Elements
const extractBtn = document.getElementById('extract-btn');
const downloadBtn = document.getElementById('download-btn');
const sendBtn = document.getElementById('send-btn');
const resetBtn = document.getElementById('reset-btn');
const retryBtn = document.getElementById('retry-btn');
const errorResetBtn = document.getElementById('error-reset-btn');

const idleState = document.getElementById('idle-state');
const loadingState = document.getElementById('loading-state');
const successState = document.getElementById('success-state');
const errorState = document.getElementById('error-state');
const statusMessage = document.getElementById('status-message');

const transactionCount = document.getElementById('transaction-count');
const totalValue = document.getElementById('total-value');
const extractedTime = document.getElementById('extracted-time');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const loadingMessage = document.getElementById('loading-message');
const errorMessage = document.getElementById('error-message');

let extractedData = [];

// Event Listeners
extractBtn.addEventListener('click', startExtraction);
downloadBtn.addEventListener('click', downloadCSV);
sendBtn.addEventListener('click', sendToDashboard);
resetBtn.addEventListener('click', resetUI);
retryBtn.addEventListener('click', startExtraction);
errorResetBtn.addEventListener('click', resetUI);

// Load saved data on popup open
loadSavedData();

/**
 * Load previously extracted data
 */
function loadSavedData() {
  chrome.storage.local.get(['extractedData', 'extractedAt'], (result) => {
    if (result.extractedData && result.extractedData.length > 0) {
      extractedData = result.extractedData;
      showSuccessState(result.extractedAt);
    }
  });
}

/**
 * Start extraction process
 */
async function startExtraction() {
  console.log('[Dotloop Extension] Starting extraction...');
  showLoadingState();

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if on Dotloop
    if (!tab.url.includes('dotloop.com')) {
      throw new Error('Please navigate to Dotloop.com first');
    }

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: 'extractTransactions' }, (response) => {
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError?.message || 'Unknown error';
        console.error('[Dotloop Extension] Error:', errorMsg);
        showErrorState('Could not connect to Dotloop. Please refresh the page and try again.');
        return;
      }

      if (!response) {
        console.error('[Dotloop Extension] No response from content script');
        showErrorState('No response from page. Please refresh and try again.');
        return;
      }

      if (response.success) {
        extractedData = response.data.filter(t => t !== null);
        console.log(`[Dotloop Extension] Extraction successful: ${extractedData.length} transactions`);

        // Save to storage
        chrome.storage.local.set({
          extractedData: extractedData,
          extractedAt: new Date().toISOString()
        });

        showSuccessState();
      } else {
        console.error('[Dotloop Extension] Extraction failed:', response.error);
        showErrorState(response.error || 'Extraction failed. Please try again.');
      }
    });
  } catch (error) {
    console.error('[Dotloop Extension] Error:', error);
    showErrorState(error.message);
  }
}

/**
 * Show loading state
 */
function showLoadingState() {
  idleState.style.display = 'none';
  successState.style.display = 'none';
  errorState.style.display = 'none';
  loadingState.style.display = 'flex';
  progressFill.style.width = '0%';
  progressText.textContent = '0%';

  // Simulate progress
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 30;
    if (progress > 90) progress = 90;
    progressFill.style.width = progress + '%';
    progressText.textContent = Math.round(progress) + '%';

    if (progress >= 90) clearInterval(interval);
  }, 500);
}

/**
 * Show success state
 */
function showSuccessState(extractedAt) {
  idleState.style.display = 'none';
  loadingState.style.display = 'none';
  errorState.style.display = 'none';
  successState.style.display = 'flex';

  // Update results
  transactionCount.textContent = extractedData.length.toLocaleString();

  const totalVal = extractedData.reduce((sum, t) => {
    return sum + (t.salePrice || t.price || 0);
  }, 0);
  totalValue.textContent = '$' + totalVal.toLocaleString('en-US', { maximumFractionDigits: 0 });

  if (extractedAt) {
    const date = new Date(extractedAt);
    extractedTime.textContent = date.toLocaleTimeString();
  } else {
    extractedTime.textContent = 'Just now';
  }

  // Complete progress
  progressFill.style.width = '100%';
  progressText.textContent = '100%';
}

/**
 * Show error state
 */
function showErrorState(error) {
  idleState.style.display = 'none';
  loadingState.style.display = 'none';
  successState.style.display = 'none';
  errorState.style.display = 'flex';
  errorMessage.textContent = error || 'An error occurred during extraction.';
}

/**
 * Reset UI to idle state
 */
function resetUI() {
  idleState.style.display = 'flex';
  loadingState.style.display = 'none';
  successState.style.display = 'none';
  errorState.style.display = 'none';
  extractedData = [];
  chrome.storage.local.remove(['extractedData', 'extractedAt']);
}

/**
 * Download extracted data as CSV
 */
function downloadCSV() {
  if (extractedData.length === 0) {
    alert('No data to download');
    return;
  }

  const csv = convertToCSV(extractedData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `dotloop-transactions-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log('[Dotloop Extension] CSV downloaded');
}

/**
 * Send data to Reporting Tool dashboard
 */
function sendToDashboard() {
  if (extractedData.length === 0) {
    alert('No data to send');
    return;
  }

  try {
    // Store data in localStorage (accessible across tabs in same domain)
    const dataToStore = {
      transactions: extractedData,
      extractedAt: new Date().toISOString(),
      source: 'extension'
    };

    // Open dashboard in new tab with extension source parameter
    chrome.tabs.create({
      url: 'https://dotloop-reporter.manus.space?source=extension'
    }, (tab) => {
      // Wait for tab to load, then inject localStorage data
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          
          // Inject data into the new tab's localStorage
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (data) => {
              localStorage.setItem('dotloop_extension_data', JSON.stringify(data));
              console.log('[Extension] Data injected into localStorage');
            },
            args: [dataToStore]
          });
        }
      });
    });

    console.log('[Dotloop Extension] Opening dashboard with data...');
  } catch (error) {
    console.error('[Dotloop Extension] Error sending data:', error);
    alert('Error sending data to dashboard. Please try downloading CSV instead.');
  }
}

/**
 * Convert transaction data to CSV format
 */
function convertToCSV(data) {
  if (data.length === 0) return '';

  // Define headers
  const headers = [
    'Loop ID',
    'Loop Name',
    'Loop Status',
    'Transaction Type',
    'Price',
    'Sale Price',
    'Closing Date',
    'Listing Date',
    'Address',
    'City',
    'State',
    'Zip Code',
    'Lead Source',
    'Sale Commission Rate',
    'Sale Commission Total',
    'Buy Commission Rate',
    'Buy Commission Total',
    'Property Type',
    'Bedrooms',
    'Bathrooms',
    'Square Footage',
    'Year Built',
    'Agent',
    'Created Date',
    'Updated Date'
  ];

  // Convert data to CSV rows
  const rows = data.map(t => [
    t.loopId || '',
    escapeCSV(t.loopName || ''),
    t.loopStatus || '',
    t.transactionType || '',
    t.price || '',
    t.salePrice || '',
    t.closingDate || '',
    t.listingDate || '',
    escapeCSV(t.address || ''),
    t.city || '',
    t.state || '',
    t.zip || '',
    t.leadSource || '',
    t.saleCommissionRate || '',
    t.saleCommissionTotal || '',
    t.buyCommissionRate || '',
    t.buyCommissionTotal || '',
    t.propertyType || '',
    t.bedrooms || '',
    t.bathrooms || '',
    t.squareFootage || '',
    t.yearBuilt || '',
    escapeCSV(t.agent || ''),
    t.createdDate || '',
    t.updatedDate || ''
  ]);

  // Combine headers and rows
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csv;
}

/**
 * Escape CSV values
 */
function escapeCSV(value) {
  if (!value) return '';
  value = value.toString();
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

console.log('[Dotloop Extension] Popup script ready');
