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
      companyName: extractCompanyName()
    };
    
    sendResponse(pageInfo);
  }
});

// Extract job title from common selectors
function extractJobTitle() {
  const selectors = [
    'h1[class*="job"]',
    'h1[class*="title"]',
    '.job-title',
    '.position-title',
    '[data-testid*="job-title"]',
    'h1'
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
    '.employer-name'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  // Fallback to domain name
  return window.location.hostname.replace('www.', '').split('.')[0];
}

// Auto-detect if we're on a job application page
function isJobApplicationPage() {
  const jobKeywords = [
    'apply', 'application', 'career', 'job', 'position', 'hiring',
    'work', 'employment', 'opportunity'
  ];
  
  const pageText = document.body.textContent.toLowerCase();
  const url = window.location.href.toLowerCase();
  
  return jobKeywords.some(keyword => 
    pageText.includes(keyword) || url.includes(keyword)
  );
}

// Notify background script if this looks like a job page
if (isJobApplicationPage()) {
  chrome.runtime.sendMessage({
    action: 'jobPageDetected',
    url: window.location.href,
    title: document.title
  });
}
