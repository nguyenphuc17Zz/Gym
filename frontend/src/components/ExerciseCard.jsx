import React from 'react';

const ExerciseCard = ({ exercise, onClick }) => {
  return (
    <div className="exercise-card" onClick={() => onClick(exercise)}>
      <div className="card-image-wrapper">
        {exercise.gif_url ? (
          <>
            <img 
              src={`http://localhost:3001/${exercise.image}`} 
              alt={exercise.name} 
              className="card-image"
              loading="lazy"
            />
            <img 
              src={`http://localhost:3001/${exercise.gif_url}`} 
              alt={exercise.name} 
              className="card-gif"
              loading="lazy"
            />
          </>
        ) : exercise.youtube_id ? (
          <img 
            src={`https://img.youtube.com/vi/${exercise.youtube_id}/mqdefault.jpg`} 
            alt={exercise.name} 
            className="card-image"
            style={{ opacity: 1, zIndex: 1 }}
            loading="lazy"
          />
        ) : (
          <div className="fallback-media">
            <span className="fallback-icon">✨</span>
          </div>
        )}
      </div>
      
      <div className="card-content">
        <h3 className="card-title">
          {exercise.name} {exercise.isAiGenerated && <span className="ai-badge">AI</span>}
        </h3>
        <div className="tags">
          <span className="tag">
             {exercise.equipment}
          </span>
          <span className="tag target">
             {exercise.target}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExerciseCard;
