import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import ExerciseCard from './ExerciseCard';

const AIChat = ({ apiKey, prompt, model, onExerciseClick, onSaveToDB }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! I'm FitAI Coach. Ask me anything about fitness or a specific exercise!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !apiKey) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const res = await axios.post('http://localhost:3001/api/chat', {
        message: userMsg,
        history: history,
        apiKey,
        prompt,
        model
      });
      
      const aiResponse = res.data.text;
      const exercise = res.data.exercise;
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: aiResponse,
        exercise: exercise 
      }]);
      
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "Oops! " + (error.response?.data?.error || "Connection error.") 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className={`chat-fab ${isOpen ? 'hidden' : ''}`} onClick={() => setIsOpen(true)}>
        <MessageSquare size={24} />
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title"><Bot size={20} /> FitAI Coach</div>
            <button className="chat-close" onClick={() => setIsOpen(false)}><X size={18} /></button>
          </div>
          
          <div className="chat-messages">
            {!apiKey && (
              <div className="chat-alert">
                Please configure your Gemini API Key in Settings first.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`message-bubble ${msg.role}`}>
                <div className="msg-icon">{msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}</div>
                <div className="msg-content">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {msg.exercise && (
                    <div className="chat-exercise-wrapper">
                       <ExerciseCard exercise={msg.exercise} onClick={onExerciseClick} />
                       {msg.exercise.isAiGenerated && (
                         <SaveDbButton exercise={msg.exercise} onSaveToDB={onSaveToDB} />
                       )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message-bubble ai typing">
                <div className="dot"></div><div className="dot"></div><div className="dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about Chest Fly Machine..."
              disabled={!apiKey || loading}
            />
            <button onClick={handleSend} disabled={!apiKey || loading || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const SaveDbButton = ({ exercise, onSaveToDB }) => {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    const success = await onSaveToDB(exercise);
    if (success) setSaved(true);
    setSaving(false);
  };

  return (
    <button 
      className={`save-db-btn ${saved ? 'saved' : ''}`} 
      onClick={handleSave}
      disabled={saved || saving}
    >
      {saved ? '✓ Đã Lưu Vào Kho' : (saving ? 'Đang lưu...' : '💾 Lưu vào Database')}
    </button>
  );
};

export default AIChat;
