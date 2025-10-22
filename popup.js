// Popup script for Job Application Tracker
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('applicationForm');
  const applicationsList = document.getElementById('applicationsList');
  const exportBtn = document.getElementById('exportBtn');
  const quickAddBtn = document.getElementById('quickAddBtn');
  
  // Set today's date as default
  document.getElementById('applicationDate').valueAsDate = new Date();
  
  // Load applications on popup open
  loadApplications();
  
  // Try to auto-fill form data from current tab
  autoFillFormData();
  
  // Handle form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const application = {
      id: Date.now(),
      companyName: document.getElementById('companyName').value,
      applicationDate: document.getElementById('applicationDate').value,
      jobLocation: document.getElementById('jobLocation').value,
      status: document.getElementById('status').value
    };
    
    // Save application
    saveApplication(application);
    
    // Clear form
    form.reset();
    document.getElementById('applicationDate').valueAsDate = new Date();
    
    // Reload applications list
    loadApplications();
  });
  
  // Handle export button
  exportBtn.addEventListener('click', function() {
    exportToCSV();
  });
  
  // Handle quick add button
  quickAddBtn.addEventListener('click', function() {
    quickAddCurrentJob();
  });
  
  // Auto-fill form data from current tab
  function autoFillFormData() {
    // First try to get auto-filled data from background script
    chrome.runtime.sendMessage({action: 'getAutoFillData'}, function(response) {
      if (response.data) {
        // Use the auto-filled data from the content script
        document.getElementById('companyName').value = response.data.companyName || '';
        document.getElementById('jobLocation').value = response.data.jobLocation || '';
        
        // Show a notification that data was auto-filled
        showAutoFillNotification(response.data);
      } else {
        // Fallback to basic domain-based auto-fill
        autoFillFromDomain();
      }
    });
  }
  
  // Fallback auto-fill from domain name
  function autoFillFromDomain() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const url = tabs[0].url;
        try {
          const domain = new URL(url).hostname.replace('www.', '');
          const companyName = domain.split('.')[0];
          
          // Only auto-fill if it looks like a company domain
          if (companyName && companyName.length > 2 && !companyName.includes('localhost')) {
            document.getElementById('companyName').value = companyName.charAt(0).toUpperCase() + companyName.slice(1);
          }
        } catch (e) {
          // Invalid URL, ignore
        }
      }
    });
  }
  
  // Show notification when data is auto-filled
  function showAutoFillNotification(data) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      max-width: 200px;
    `;
    notification.innerHTML = `
      <strong>Auto-filled from job page:</strong><br>
      Company: ${data.companyName}<br>
      Location: ${data.jobLocation || 'Not detected'}
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
  
  // Quick add current job application
  function quickAddCurrentJob() {
    chrome.runtime.sendMessage({action: 'getAutoFillData'}, function(response) {
      if (response.data) {
        // Use the auto-filled data to create an application
        const application = {
          id: Date.now(),
          companyName: response.data.companyName,
          applicationDate: new Date().toISOString().split('T')[0],
          jobLocation: response.data.jobLocation || '',
          status: 'pending' // Default to pending
        };
        
        // Save application
        saveApplication(application);
        
        // Show success notification
        showSuccessNotification(application);
        
        // Reload applications list
        loadApplications();
      } else {
        // No auto-fill data available, show error
        showErrorNotification('No job data detected on current page. Please fill the form manually.');
      }
    });
  }
  
  // Show success notification
  function showSuccessNotification(application) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      max-width: 200px;
    `;
    notification.innerHTML = `
      <strong>Application Added!</strong><br>
      Company: ${application.companyName}<br>
      Status: Pending
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
  
  // Show error notification
  function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #f44336;
      color: white;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      max-width: 200px;
    `;
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
  
  // Load applications from storage
  function loadApplications() {
    chrome.storage.local.get(['applications'], function(result) {
      const applications = result.applications || [];
      displayApplications(applications);
    });
  }
  
  // Display applications in the list
  function displayApplications(applications) {
    applicationsList.innerHTML = '';
    
    if (applications.length === 0) {
      applicationsList.innerHTML = '<p>No applications yet. Add your first application above!</p>';
      return;
    }
    
    // Sort by application date (newest first)
    applications.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));
    
    applications.forEach(app => {
      const appDiv = document.createElement('div');
      appDiv.className = 'application-item';
      
      const statusClass = `status-${app.status}`;
      const statusText = app.status.charAt(0).toUpperCase() + app.status.slice(1);
      
      appDiv.innerHTML = `
        <h4>${app.companyName}</h4>
        <p><strong>Date:</strong> ${formatDate(app.applicationDate)}</p>
        <p><strong>Location:</strong> ${app.jobLocation || 'Not specified'}</p>
        <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
        <button onclick="deleteApplication(${app.id})" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">Delete</button>
      `;
      
      applicationsList.appendChild(appDiv);
    });
  }
  
  // Save application to storage
  function saveApplication(application) {
    chrome.storage.local.get(['applications'], function(result) {
      const applications = result.applications || [];
      applications.push(application);
      
      chrome.storage.local.set({ applications: applications }, function() {
        console.log('Application saved');
      });
    });
  }
  
  // Delete application
  window.deleteApplication = function(id) {
    chrome.storage.local.get(['applications'], function(result) {
      const applications = result.applications || [];
      const filteredApplications = applications.filter(app => app.id !== id);
      
      chrome.storage.local.set({ applications: filteredApplications }, function() {
        loadApplications();
      });
    });
  };
  
  // Export to CSV
  function exportToCSV() {
    chrome.storage.local.get(['applications'], function(result) {
      const applications = result.applications || [];
      
      if (applications.length === 0) {
        alert('No applications to export');
        return;
      }
      
      // Create CSV content
      let csvContent = 'Company Name,Application Date,Job Location,Status\n';
      
      applications.forEach(app => {
        const companyName = `"${app.companyName}"`;
        const applicationDate = app.applicationDate;
        const jobLocation = `"${app.jobLocation || ''}"`;
        const status = app.status;
        
        csvContent += `${companyName},${applicationDate},${jobLocation},${status}\n`;
      });
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job_applications_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }
  
  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
});