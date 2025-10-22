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
});
