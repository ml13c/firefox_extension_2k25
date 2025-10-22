// Background script for Job Application Tracker
chrome.runtime.onInstalled.addListener(function() {
  console.log('Job Application Tracker installed');
  
  // Initialize storage with empty applications array
  chrome.storage.local.get(['applications'], function(result) {
    if (!result.applications) {
      chrome.storage.local.set({ applications: [] });
    }
  });
});

// Listen for tab updates to potentially auto-fill company name
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    // Extract domain name for potential company name suggestion
    try {
      const url = new URL(tab.url);
      const domain = url.hostname.replace('www.', '');
      
      // Store current domain for potential use in popup
      chrome.storage.local.set({ currentDomain: domain });
    } catch (e) {
      // Invalid URL, ignore
    }
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getCurrentTab') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      sendResponse({tab: tabs[0]});
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'getCurrentDomain') {
    chrome.storage.local.get(['currentDomain'], function(result) {
      sendResponse({domain: result.currentDomain || ''});
    });
    return true;
  }
  
  if (request.action === 'autoFillJobData') {
    // Store the auto-filled job data for the popup to use
    chrome.storage.local.set({ 
      autoFillData: request.data,
      autoFillTimestamp: Date.now()
    });
    return true;
  }
  
  if (request.action === 'getAutoFillData') {
    chrome.storage.local.get(['autoFillData', 'autoFillTimestamp'], function(result) {
      // Only return data if it's less than 5 minutes old
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      if (result.autoFillTimestamp && result.autoFillTimestamp > fiveMinutesAgo) {
        sendResponse({data: result.autoFillData});
      } else {
        sendResponse({data: null});
      }
    });
    return true;
  }
});
