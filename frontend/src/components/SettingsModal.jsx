import React, { useState } from 'react';
import { X, Save, Key, FileText, Bot, RotateCcw, Settings } from 'lucide-react';

const DEFAULT_PROMPT = "You are an elite fitness coach. Help the user with workout advice. If they ask how to do an exercise, always call the generate_exercise tool to provide the structured instructions.";
const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash' }
];

const SettingsModal = ({ onClose, onSave, initialApiKey, initialPrompt, initialModel }) => {
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  const [prompt, setPrompt] = useState(initialPrompt || DEFAULT_PROMPT);
  const [model, setModel] = useState(initialModel || 'gemini-3.5-flash');

  const handleSave = () => {
    onSave(apiKey, prompt, model);
    onClose();
  };

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT);
  };

  return (
    <div className="modal-overlay glass-overlay" onClick={onClose}>
      <div className="settings-modal-container" onClick={e => e.stopPropagation()}>
        <button className="settings-close-btn" onClick={onClose}><X size={18} /></button>
        
        <div className="settings-split-layout">
          {/* Left Column */}
          <div className="settings-left-col">
            <h2 className="settings-main-title">
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <Settings size={28} /> FitAI
              </div>
              Configuration
            </h2>
          </div>
          
          {/* Right Column */}
          <div className="settings-right-col">
            <div className="form-group">
              <label><Key size={16} /> Gemini API Key</label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)} 
                placeholder="AIzaSy..." 
                className="settings-input premium-input"
              />
              <small className="hint-text">Stored locally in your browser.<br/>Never shared.</small>
            </div>

            <div className="form-group">
              <label><Bot size={16} /> AI Model</label>
              <select 
                value={model} 
                onChange={e => setModel(e.target.value)}
                className="settings-input premium-input"
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label><FileText size={16} /> System Prompt</label>
                <button className="reset-btn" onClick={handleReset} title="Reset to Default">
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
              <textarea 
                value={prompt} 
                onChange={e => setPrompt(e.target.value)} 
                rows={5}
                className="settings-input premium-input"
                placeholder="You are an elite fitness coach..."
              />
            </div>

            <button className="save-btn premium-btn" onClick={handleSave}>
              <Save size={18} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
