// AI Detection Content Script for Online Tests
(function() {
  'use strict';
  
  const API_ENDPOINT = 'http://localhost:3001/api/v1/analyze';
  const MIN_TEXT_LENGTH = 50;
  
  let isEnabled = true;
  let detectionResults = new Map();
  
  // Initialize the extension
  function init() {
    console.log('AI Detection Extension loaded');
    
    // Monitor form submissions
    monitorFormSubmissions();
    
    // Monitor text input changes
    monitorTextInputs();
    
    // Add visual indicators
    addDetectionIndicators();
  }
  
  // Monitor form submissions for real-time analysis
  function monitorFormSubmissions() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        if (!isEnabled) return;
        
        const textInputs = form.querySelectorAll('textarea, input[type="text"]');
        
        for (const input of textInputs) {
          const text = input.value.trim();
          if (text.length >= MIN_TEXT_LENGTH) {
            await analyzeText(text, input);
          }
        }
      });
    });
  }
  
  // Monitor text inputs for real-time feedback
  function monitorTextInputs() {
    const textInputs = document.querySelectorAll('textarea, input[type="text"]');
    
    textInputs.forEach(input => {
      let timeout;
      
      input.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          const text = input.value.trim();
          if (text.length >= MIN_TEXT_LENGTH) {
            await analyzeText(text, input);
          }
        }, 2000); // Analyze after 2 seconds of no typing
      });
    });
  }
  
  // Analyze text using the API
  async function analyzeText(text, inputElement) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          studentId: getUserId(),
          questionId: getQuestionId(inputElement)
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Store result
      detectionResults.set(inputElement, result);
      
      // Update visual indicators
      updateInputIndicator(inputElement, result);
      
      // Show alert for high-risk content
      if (result.isSuspectedAI && result.aiScore > 0.7) {
        showHighRiskAlert(result);
      }
      
    } catch (error) {
      console.error('AI Detection failed:', error);
    }
  }
  
  // Add visual indicators to form inputs
  function addDetectionIndicators() {
    const textInputs = document.querySelectorAll('textarea, input[type="text"]');
    
    textInputs.forEach(input => {
      // Add indicator container
      const indicator = document.createElement('div');
      indicator.className = 'ai-detection-indicator';
      indicator.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #64748b;
        z-index: 1000;
        opacity: 0.7;
      `;
      
      // Make parent relative if needed
      const parent = input.parentElement;
      if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      
      parent.appendChild(indicator);
    });
  }
  
  // Update input indicator based on analysis result
  function updateInputIndicator(inputElement, result) {
    const parent = inputElement.parentElement;
    const indicator = parent.querySelector('.ai-detection-indicator');
    
    if (!indicator) return;
    
    if (result.aiScore > 0.7) {
      indicator.style.background = '#ef4444'; // Red for high risk
      indicator.title = `High AI probability: ${Math.round(result.aiScore * 100)}%`;
    } else if (result.aiScore > 0.4) {
      indicator.style.background = '#f59e0b'; // Yellow for medium risk
      indicator.title = `Medium AI probability: ${Math.round(result.aiScore * 100)}%`;
    } else {
      indicator.style.background = '#10b981'; // Green for low risk
      indicator.title = `Low AI probability: ${Math.round(result.aiScore * 100)}%`;
    }
  }
  
  // Show high-risk alert
  function showHighRiskAlert(result) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.ai-detection-alert');
    if (existingAlert) {
      existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = 'ai-detection-alert';
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: #ef4444;
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    `;
    
    alert.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">⚠️ AI Content Detected</div>
      <div>Probability: ${Math.round(result.aiScore * 100)}%</div>
      <div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">
        Risk Level: ${result.riskLevel}
      </div>
      <button onclick="this.parentElement.remove()" style="
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
      ">×</button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (alert.parentElement) {
        alert.remove();
      }
    }, 10000);
  }
  
  // Get user ID from the page
  function getUserId() {
    // Try to extract from Google account info
    const emailElement = document.querySelector('[data-email]');
    if (emailElement) {
      return emailElement.getAttribute('data-email');
    }
    
    // Try to extract from URL or other sources
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('user') || 'unknown-user';
  }
  
  // Get question ID from input element
  function getQuestionId(inputElement) {
    // Try to find question identifier
    const questionContainer = inputElement.closest('[data-question-id]');
    if (questionContainer) {
      return questionContainer.getAttribute('data-question-id');
    }
    
    // Use input name or ID
    return inputElement.name || inputElement.id || 'unknown-question';
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggle') {
      isEnabled = request.enabled;
      sendResponse({ status: 'ok' });
    } else if (request.action === 'getResults') {
      const results = Array.from(detectionResults.values());
      sendResponse({ results });
    }
  });
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();