// Content script for Job Application Tracker
// This script runs on all web pages to help with job application tracking

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getPageInfo') {
    // Extract potential job-related information from the page
    const pageInfo = {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname.replace('www.', ''),
      // Look for common job-related elements
      jobTitle: extractJobTitle(),
      companyName: extractCompanyName(),
      jobLocation: extractJobLocation()
    };
    
    sendResponse(pageInfo);
  }
});

// Extract job title from common selectors
function extractJobTitle() {
  const selectors = [
    'h.job-title',  // Primary selector as requested
    'h1[class*="job"]',
    'h1[class*="title"]',
    '.job-title',
    '.position-title',
    '[data-testid*="job-title"]',
    'h1',
    '[class*="job-title"]',
    '[class*="position-title"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  return '';
}

// Extract company name from common selectors
function extractCompanyName() {
  const selectors = [
    '[class*="company"]',
    '[class*="employer"]',
    '[data-testid*="company"]',
    '.company-name',
    '.employer-name',
    '[class*="company-name"]',
    '[class*="employer-name"]',
    'a[href*="company"]',
    'a[href*="employer"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  // Fallback: look for job reference number and extract position name
  const jobRef = extractJobReferenceNumber();
  if (jobRef) {
    return jobRef;
  }
  
  // Final fallback to domain name
  return window.location.hostname.replace('www.', '').split('.')[0];
}

// Extract job reference number and position name
function extractJobReferenceNumber() {
  // Look for common job reference patterns
  const jobRefSelectors = [
    '[class*="job-ref"]',
    '[class*="job-id"]',
    '[class*="reference"]',
    '[class*="req-id"]',
    '[class*="position-id"]',
    '[data-testid*="job-ref"]',
    '[data-testid*="job-id"]'
  ];
  
  for (const selector of jobRefSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      const text = element.textContent.trim();
      // Extract position name from job reference (usually after a dash or colon)
      const match = text.match(/(?:ref|id|#)[\s:]*[\w-]+[\s-]+(.+)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
      // If no clear pattern, return the whole text
      return text;
    }
  }
  
  // Look in page text for job reference patterns
  const pageText = document.body.textContent;
  const patterns = [
    /job\s*ref(?:erence)?[\s:]*[\w-]+[\s-]+(.+)/i,
    /position\s*id[\s:]*[\w-]+[\s-]+(.+)/i,
    /req(?:uest)?\s*id[\s:]*[\w-]+[\s-]+(.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = pageText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

// Extract job location from common selectors
function extractJobLocation() {
  const selectors = [
    '[class*="location"]',
    '[class*="address"]',
    '[data-testid*="location"]',
    '.job-location',
    '.location',
    '[class*="job-location"]',
    '[class*="work-location"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  return '';
}

// Auto-detect if we're on a job application page
function isJobApplicationPage() {
  const jobKeywords = [
    'apply', 'application', 'career', 'job', 'position', 'hiring',
    'work', 'employment', 'opportunity', 'openings', 'vacancy'
  ];
  
  const pageText = document.body.textContent.toLowerCase();
  const url = window.location.href.toLowerCase();
  
  return jobKeywords.some(keyword => 
    pageText.includes(keyword) || url.includes(keyword)
  );
}

// Auto-fill job application data when on a job page
function autoFillJobData() {
  if (isJobApplicationPage()) {
    const jobData = {
      companyName: extractCompanyName(),
      jobTitle: extractJobTitle(),
      jobLocation: extractJobLocation(),
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    // Send data to background script for auto-filling
    chrome.runtime.sendMessage({
      action: 'autoFillJobData',
      data: jobData
    });
  }
}

// Run auto-fill when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoFillJobData);
} else {
  autoFillJobData();
}

// Also run when page content changes (for SPAs)
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Small delay to let new content load
      setTimeout(autoFillJobData, 500);
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
