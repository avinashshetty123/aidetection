import { useState } from 'react';
import { Globe, Code, Webhook, Mail, Download, Copy, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const PlatformIntegration = () => {
  const [copied, setCopied] = useState<string>('');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const apiEndpoint = API_ENDPOINTS.V1_ANALYZE;
  
  const googleAppsScript = `function onFormSubmit(e) {
  const responses = e.response.getItemResponses();
  const studentEmail = e.response.getRespondentEmail();
  
  responses.forEach((response, index) => {
    const answer = response.getResponse();
    if (typeof answer === 'string' && answer.length > 50) {
      analyzeResponse(answer, studentEmail, \`q\${index + 1}\`);
    }
  });
}

function analyzeResponse(text, studentId, questionId) {
  const payload = {
    text: text,
    studentId: studentId,
    questionId: questionId
  };
  
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch('${apiEndpoint}', options);
    const result = JSON.parse(response.getContentText());
    
    if (result.isSuspectedAI && result.aiScore > 0.7) {
      sendAlert(studentId, questionId, result.aiScore);
    }
  } catch (error) {
    console.error('AI Detection Error:', error);
  }
}

function sendAlert(studentId, questionId, score) {
  const subject = 'AI Detection Alert';
  const body = \`Student \${studentId} may have used AI for \${questionId} (Score: \${Math.round(score * 100)}%)\`;
  GmailApp.sendEmail('teacher@school.edu', subject, body);
}`;

  const browserExtensionCode = `// Content Script for Browser Extension
(function() {
  const API_ENDPOINT = '${apiEndpoint}';
  
  function detectFormSubmission() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        const textInputs = form.querySelectorAll('textarea, input[type="text"]');
        
        for (const input of textInputs) {
          const text = input.value;
          if (text.length > 50) {
            await analyzeText(text, input.name || input.id);
          }
        }
      });
    });
  }
  
  async function analyzeText(text, fieldId) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          studentId: 'browser-user',
          questionId: fieldId
        })
      });
      
      const result = await response.json();
      
      if (result.isSuspectedAI && result.aiScore > 0.6) {
        showWarning(fieldId, result.aiScore);
      }
    } catch (error) {
      console.error('AI Detection failed:', error);
    }
  }
  
  function showWarning(fieldId, score) {
    const warning = document.createElement('div');
    warning.style.cssText = \`
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: #ef4444; color: white; padding: 12px;
      border-radius: 8px; font-family: Arial, sans-serif;
    \`;
    warning.textContent = \`AI content detected (\${Math.round(score * 100)}%)\`;
    document.body.appendChild(warning);
    
    setTimeout(() => warning.remove(), 5000);
  }
  
  detectFormSubmission();
})();`;

  const webhookExample = `// Webhook Integration Example
const express = require('express');
const app = express();

app.post('/webhook/form-submission', async (req, res) => {
  const { studentId, responses } = req.body;
  
  for (const [questionId, answer] of Object.entries(responses)) {
    if (typeof answer === 'string' && answer.length > 50) {
      const result = await fetch('${apiEndpoint}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: answer,
          studentId: studentId,
          questionId: questionId
        })
      });
      
      const analysis = await result.json();
      
      if (analysis.isSuspectedAI) {
        // Send alert to teacher
        await sendTeacherAlert(studentId, questionId, analysis);
      }
    }
  }
  
  res.json({ status: 'processed' });
});`;

  const curlExample = `curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Student response text here...",
    "studentId": "student123",
    "questionId": "q1"
  }'`;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-600 rounded-lg">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Platform Integration</h2>
            <p className="text-sm text-slate-400">Integrate AI detection with any testing platform</p>
          </div>
        </div>

        {/* API Endpoint */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Code className="w-5 h-5 text-blue-400" />
            <span>Public API Endpoint</span>
          </h3>
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <code className="text-green-400 font-mono">POST /api/v1/analyze</code>
              <button
                onClick={() => copyToClipboard(apiEndpoint, 'endpoint')}
                className="flex items-center space-x-1 text-slate-400 hover:text-white"
              >
                {copied === 'endpoint' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-slate-300 text-sm mb-3">Analyze any text for AI-generated content</p>
            <div className="bg-slate-800 rounded p-3 font-mono text-sm">
              <div className="text-slate-400">// Request Body</div>
              <div className="text-slate-200">{`{
  "text": "Student's answer here",
  "studentId": "abc123",
  "questionId": "q5"
}`}</div>
              <div className="text-slate-400 mt-2">// Response</div>
              <div className="text-slate-200">{`{
  "aiScore": 0.87,
  "isSuspectedAI": true,
  "message": "Likely AI-generated (Score: 87%)",
  "riskLevel": "HIGH"
}`}</div>
            </div>
          </div>
        </div>

        {/* Integration Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Google Apps Script */}
          <div className="bg-slate-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <span>Google Forms Integration</span>
            </h4>
            <p className="text-slate-300 text-sm mb-4">
              Auto-analyze Google Forms submissions with Apps Script
            </p>
            <div className="bg-slate-800 rounded p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">Google Apps Script</span>
                <button
                  onClick={() => copyToClipboard(googleAppsScript, 'apps-script')}
                  className="text-slate-400 hover:text-white"
                >
                  {copied === 'apps-script' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="text-xs text-slate-200 overflow-x-auto max-h-32">
                {googleAppsScript.substring(0, 200)}...
              </pre>
            </div>
            <div className="text-xs text-slate-400">
              1. Open Google Forms → Script Editor<br/>
              2. Paste the code above<br/>
              3. Set up form submission trigger
            </div>
          </div>

          {/* Browser Extension */}
          <div className="bg-slate-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Code className="w-5 h-5 text-purple-400" />
              <span>Browser Extension</span>
            </h4>
            <p className="text-slate-300 text-sm mb-4">
              Real-time detection for any web form
            </p>
            <div className="bg-slate-800 rounded p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">Content Script</span>
                <button
                  onClick={() => copyToClipboard(browserExtensionCode, 'extension')}
                  className="text-slate-400 hover:text-white"
                >
                  {copied === 'extension' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="text-xs text-slate-200 overflow-x-auto max-h-32">
                {browserExtensionCode.substring(0, 200)}...
              </pre>
            </div>
            <div className="text-xs text-slate-400">
              Works with any testing platform<br/>
              Detects form submissions automatically
            </div>
          </div>

          {/* Webhook Integration */}
          <div className="bg-slate-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Webhook className="w-5 h-5 text-green-400" />
              <span>Webhook Integration</span>
            </h4>
            <p className="text-slate-300 text-sm mb-4">
              Server-side integration for LMS platforms
            </p>
            <div className="bg-slate-800 rounded p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">Node.js Example</span>
                <button
                  onClick={() => copyToClipboard(webhookExample, 'webhook')}
                  className="text-slate-400 hover:text-white"
                >
                  {copied === 'webhook' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="text-xs text-slate-200 overflow-x-auto max-h-32">
                {webhookExample.substring(0, 200)}...
              </pre>
            </div>
            <div className="text-xs text-slate-400">
              Perfect for Moodle, Canvas, Blackboard<br/>
              Process submissions server-side
            </div>
          </div>

          {/* cURL Example */}
          <div className="bg-slate-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Mail className="w-5 h-5 text-yellow-400" />
              <span>Direct API Call</span>
            </h4>
            <p className="text-slate-300 text-sm mb-4">
              Test the API directly with cURL
            </p>
            <div className="bg-slate-800 rounded p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">cURL Command</span>
                <button
                  onClick={() => copyToClipboard(curlExample, 'curl')}
                  className="text-slate-400 hover:text-white"
                >
                  {copied === 'curl' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="text-xs text-slate-200 overflow-x-auto">
                {curlExample}
              </pre>
            </div>
            <div className="text-xs text-slate-400">
              Test API responses<br/>
              Debug integration issues
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 bg-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Platform-Agnostic Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Real-time AI detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Advanced NLP analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Instant teacher alerts</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Detailed reporting</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Works with any platform</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">No platform modifications needed</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Easy integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Free beta access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h4 className="font-semibold text-blue-400 mb-2">Getting Started</h4>
          <ol className="text-sm text-slate-300 space-y-1">
            <li>1. Choose your integration method above</li>
            <li>2. Copy the relevant code snippet</li>
            <li>3. Configure with your platform</li>
            <li>4. Test with sample responses</li>
            <li>5. Monitor real-time alerts</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PlatformIntegration;