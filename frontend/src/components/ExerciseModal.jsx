import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, PlayCircle, Edit3, Save } from 'lucide-react';
import axios from 'axios';

const ExerciseModal = ({ exercise, onClose, onExerciseUpdated }) => {
  const [localExercise, setLocalExercise] = useState(null);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [videoInput, setVideoInput] = useState('');
  const [activeTab, setActiveTab] = useState('dataset');

  useEffect(() => {
    setLocalExercise(exercise);
    if (exercise) {
       if (!exercise.gif_url && exercise.youtube_id) {
           setActiveTab('youtube');
       } else {
           setActiveTab('dataset');
       }
    }
  }, [exercise]);

  if (!localExercise) return null;

  // Handle instruction_steps
  let steps = [];
  if (Array.isArray(localExercise.instruction_steps)) {
    steps = localExercise.instruction_steps; // Direct array from AI
  } else if (typeof localExercise.instruction_steps === 'string') {
    try {
      const parsed = JSON.parse(localExercise.instruction_steps);
      steps = parsed?.en || [];
    } catch (e) {
      console.error('Error parsing instruction steps');
    }
  } else if (localExercise.instruction_steps?.en) {
    steps = localExercise.instruction_steps.en;
  }

  // Fallback to old instructions if steps missing
  let fallbackInstructions = '';
  if (steps.length === 0 && localExercise.instructions) {
    if (typeof localExercise.instructions === 'string') {
      try {
        const parsedInst = JSON.parse(localExercise.instructions);
        fallbackInstructions = parsedInst?.en || '';
      } catch (e) {}
    } else {
      fallbackInstructions = localExercise.instructions.en || '';
    }
  }

  const handleUpdateVideo = async () => {
    if (!videoInput.trim()) return;
    let ytId = videoInput.trim();
    // parse youtube url
    const match = ytId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (match) {
        ytId = match[1];
    } else if (ytId.length === 11 && !ytId.includes('/')) {
        // it's already an ID
    } else {
        alert('Link YouTube không hợp lệ! Vui lòng nhập link đúng định dạng.');
        return;
    }

    if (!localExercise.isAiGenerated) {
        try {
            await axios.put(`http://localhost:3001/api/exercises/${localExercise.id}/youtube`, { youtube_id: ytId });
            const updated = {...localExercise, youtube_id: ytId};
            setLocalExercise(updated);
            if (onExerciseUpdated) onExerciseUpdated(updated);
        } catch(e) {
            alert('Lỗi khi cập nhật DB');
        }
    } else {
        const updated = {...localExercise, youtube_id: ytId};
        setLocalExercise(updated);
        if (onExerciseUpdated) onExerciseUpdated(updated);
    }
    setIsEditingVideo(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="modal-media" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="media-tabs" style={{width: '100%'}}>
            {localExercise.gif_url && (
              <button 
                className={`media-tab-btn ${activeTab === 'dataset' ? 'active' : ''}`} 
                onClick={() => setActiveTab('dataset')}
              >
                📸 Ảnh Gốc
              </button>
            )}
            <button 
              className={`media-tab-btn ${activeTab === 'youtube' ? 'active' : ''}`} 
              onClick={() => setActiveTab('youtube')}
            >
              📺 YouTube Video
            </button>
          </div>

          <div className="media-content-area" style={{ flex: 1, width: '100%', position: 'relative', background: activeTab === 'dataset' ? '#fff' : '#000' }}>
            {activeTab === 'dataset' ? (
              <img 
                src={`http://localhost:3001/${localExercise.gif_url}`} 
                alt={localExercise.name} 
                style={{width: '100%', height: '100%', objectFit: 'contain'}} 
              />
            ) : isEditingVideo ? (
              <div className="video-edit-container">
                 <h4 style={{color: 'white', margin: '0 0 1rem 0'}}>Đổi Link YouTube</h4>
                 <input 
                   type="text" 
                   placeholder="Dán link YouTube (VD: https://youtube.com/watch?v=...)" 
                   value={videoInput}
                   onChange={e => setVideoInput(e.target.value)}
                   className="settings-input premium-input"
                   style={{marginBottom: '1rem'}}
                 />
                 <div style={{display: 'flex', gap: '0.5rem'}}>
                   <button className="save-btn premium-btn" style={{flex: 1, margin: 0, padding: '0.75rem'}} onClick={handleUpdateVideo}><Save size={16}/> Lưu Link</button>
                   <button className="close-btn" style={{position: 'static', background: 'rgba(255,255,255,0.1)', color: 'white', width: 'auto', padding: '0 1rem', borderRadius: '8px'}} onClick={() => setIsEditingVideo(false)}>Huỷ</button>
                 </div>
              </div>
            ) : localExercise.youtube_id ? (
              <div style={{position: 'relative', width: '100%', height: '100%'}}>
                <button className="edit-video-btn" onClick={() => { setIsEditingVideo(true); setVideoInput(''); }}><Edit3 size={16}/></button>
                <iframe 
                  width="100%" 
                  height="100%" 
                  style={{ minHeight: '300px', display: 'block' }}
                  src={`https://www.youtube.com/embed/${localExercise.youtube_id}?autoplay=1`} 
                  title={localExercise.name}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="fallback-media-large">
                <button className="edit-video-btn text-btn" onClick={() => { setIsEditingVideo(true); setVideoInput(''); }}><Edit3 size={16}/> Thêm Video</button>
                <span className="fallback-icon-large">✨ Trống</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-details">
          <h2 className="modal-title">{localExercise.name}</h2>
          
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Category</div>
              <div className="info-value">{localExercise.category}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Equipment</div>
              <div className="info-value">{localExercise.equipment}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Target Muscle</div>
              <div className="info-value">{localExercise.target}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Body Part</div>
              <div className="info-value">{localExercise.body_part}</div>
            </div>
          </div>

          <div className="instructions">
            <h3><CheckCircle2 size={20} className="text-accent" /> Instructions</h3>
            {steps.length > 0 ? (
              <ol className="step-list">
                {steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            ) : (
              <p>{fallbackInstructions || 'No instructions available.'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseModal;
