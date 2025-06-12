import React, { useState } from 'react';
import { Settings, Shield, Bell, Database, Cpu, Eye } from 'lucide-react';

const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState({
    enableVideoDetection: true,
    enableAudioDetection: true,
    alertThreshold: 40,
    autoRecordSuspicious: true,
    showOverlay: true,
    notificationsEnabled: true,
    cpuOptimization: true,
    dataRetention: 7,
    modelAccuracy: 'balanced',
    encryptEvidence: true
  });

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSliderChange = (key: string, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-6 h-6 text-slate-400" />
          <h2 className="text-2xl font-bold">Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Detection Settings */}
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-medium">Detection Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Enable Video Detection</label>
                  <p className="text-xs text-slate-400 mt-1">Analyze video frames for deepfake artifacts</p>
                </div>
                <button
                  onClick={() => handleToggle('enableVideoDetection')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableVideoDetection ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableVideoDetection ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Enable Audio Detection</label>
                  <p className="text-xs text-slate-400 mt-1">Analyze audio for synthetic voice patterns</p>
                </div>
                <button
                  onClick={() => handleToggle('enableAudioDetection')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableAudioDetection ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableAudioDetection ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="text-sm font-medium">Alert Threshold</label>
                <p className="text-xs text-slate-400 mt-1 mb-3">
                  Trigger alerts when trust score falls below {settings.alertThreshold}%
                </p>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={settings.alertThreshold}
                  onChange={(e) => handleSliderChange('alertThreshold', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>10%</span>
                  <span className="text-blue-400 font-medium">{settings.alertThreshold}%</span>
                  <span>90%</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Model Accuracy</label>
                <p className="text-xs text-slate-400 mt-1 mb-3">Balance between accuracy and performance</p>
                <select
                  value={settings.modelAccuracy}
                  onChange={(e) => handleSelectChange('modelAccuracy', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="fast">Fast (Lower accuracy, better performance)</option>
                  <option value="balanced">Balanced (Recommended)</option>
                  <option value="accurate">Accurate (Higher accuracy, slower)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interface Settings */}
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Eye className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-medium">Interface Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Show Overlay</label>
                  <p className="text-xs text-slate-400 mt-1">Display trust score overlay on video calls</p>
                </div>
                <button
                  onClick={() => handleToggle('showOverlay')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showOverlay ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showOverlay ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Enable Notifications</label>
                  <p className="text-xs text-slate-400 mt-1">Show browser notifications for alerts</p>
                </div>
                <button
                  onClick={() => handleToggle('notificationsEnabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notificationsEnabled ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Storage */}
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Database className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-medium">Privacy & Storage</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto-Record Suspicious Segments</label>
                  <p className="text-xs text-slate-400 mt-1">Automatically save evidence when alerts trigger</p>
                </div>
                <button
                  onClick={() => handleToggle('autoRecordSuspicious')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoRecordSuspicious ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoRecordSuspicious ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Encrypt Evidence</label>
                  <p className="text-xs text-slate-400 mt-1">Use client-side encryption for stored evidence</p>
                </div>
                <button
                  onClick={() => handleToggle('encryptEvidence')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.encryptEvidence ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.encryptEvidence ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="text-sm font-medium">Data Retention Period</label>
                <p className="text-xs text-slate-400 mt-1 mb-3">
                  Automatically delete evidence after {settings.dataRetention} days
                </p>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={settings.dataRetention}
                  onChange={(e) => handleSliderChange('dataRetention', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>1 day</span>
                  <span className="text-purple-400 font-medium">{settings.dataRetention} days</span>
                  <span>30 days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Settings */}
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Cpu className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-medium">Performance Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">CPU Optimization</label>
                  <p className="text-xs text-slate-400 mt-1">Reduce CPU usage for better performance</p>
                </div>
                <button
                  onClick={() => handleToggle('cpuOptimization')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.cpuOptimization ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.cpuOptimization ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Current Performance</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">CPU Usage:</span>
                    <span className="text-green-400">12%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Memory Usage:</span>
                    <span className="text-blue-400">45 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Processing Latency:</span>
                    <span className="text-yellow-400">380ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
              Reset to Defaults
            </button>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;