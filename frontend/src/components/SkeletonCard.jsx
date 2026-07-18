import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="exercise-card skeleton">
      <div className="card-image-wrapper shimmer"></div>
      <div className="card-content">
        <div className="skeleton-title shimmer"></div>
        <div className="tags">
          <div className="skeleton-tag shimmer"></div>
          <div className="skeleton-tag shimmer"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
