/**
 * Dotloop Reporting Tool - Background Service Worker
 * Handles background tasks and messaging
 */

console.log('[Dotloop Extension] Service worker loaded');

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Dotloop Extension] Extension installed');
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Dotloop Extension] Message received:', request.action);

  if (request.action === 'saveData') {
    // Save extracted data to storage
    chrome.storage.local.set({
      extractedData: request.data,
      extractedAt: new Date().toISOString()
    }, () => {
      console.log('[Dotloop Extension] Data saved to storage');
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'getData') {
    // Retrieve saved data from storage
    chrome.storage.local.get(['extractedData', 'extractedAt'], (result) => {
      console.log('[Dotloop Extension] Data retrieved from storage');
      sendResponse({
        success: true,
        data: result.extractedData || [],
        extractedAt: result.extractedAt || null
      });
    });
    return true;
  }

  if (request.action === 'clearData') {
    // Clear saved data
    chrome.storage.local.remove(['extractedData', 'extractedAt'], () => {
      console.log('[Dotloop Extension] Data cleared from storage');
      sendResponse({ success: true });
    });
    return true;
  }
});

console.log('[Dotloop Extension] Service worker ready');
