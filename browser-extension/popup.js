// Popup script for AI Detection Extension
document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusIndicator = document.getElementById('statusIndicator');
  const totalAnalyses = document.getElementById('totalAnalyses');
  const highRisk = document.getElementById('highRisk');
  const mediumRisk = document.getElementById('mediumRisk');
  const lowRisk = document.getElementById('lowRisk');
  
  let isEnabled = true;
  
  // Load saved state
  chrome.storage.sync.get(['aiDetectionEnabled'], function(result) {
    isEnabled = result.aiDetectionEnabled !== false;
    updateUI();
  });
  
  // Toggle switch event
  toggleSwitch.addEventListener('click', function() {
    isEnabled = !isEnabled;
    
    // Save state
    chrome.storage.sync.set({ aiDetectionEnabled: isEnabled });
    
    // Update content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggle',
        enabled: isEnabled
      });
    });
    
    updateUI();
  });
  
  // Update UI based on current state
  function updateUI() {
    if (isEnabled) {
      toggleSwitch.classList.add('active');
      statusIndicator.classList.add('status-active');
      statusIndicator.classList.remove('status-inactive');
    } else {
      toggleSwitch.classList.remove('active');
      statusIndicator.classList.add('status-inactive');
      statusIndicator.classList.remove('status-active');
    }
  }
  
  // Load and display statistics
  function loadStats() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'getResults'
      }, function(response) {
        if (response && response.results) {
          updateStats(response.results);
        }
      });
    });
  }
  
  // Update statistics display
  function updateStats(results) {
    const total = results.length;
    const high = results.filter(r => r.riskLevel === 'HIGH' || r.aiScore > 0.7).length;
    const medium = results.filter(r => r.riskLevel === 'MEDIUM' || (r.aiScore > 0.4 && r.aiScore <= 0.7)).length;
    const low = results.filter(r => r.riskLevel === 'LOW' || r.aiScore <= 0.4).length;
    
    totalAnalyses.textContent = total;
    highRisk.textContent = high;
    mediumRisk.textContent = medium;
    lowRisk.textContent = low;
  }
  
  // Load stats on popup open
  loadStats();
  
  // Refresh stats every 5 seconds
  setInterval(loadStats, 5000);
});