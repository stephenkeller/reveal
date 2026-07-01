import React from 'react';
import { Star, ExternalLink, Image as ImageIcon } from 'lucide-react';

export default function MoviesGrid({ reviews, onSearchClick }) {
  if (reviews.length === 0) {
    return (
      <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
        No reviews found matching your filters.
      </div>
    );
  }

  return (
    <div className="movies-grid">
      {reviews.map(review => (
        <div key={review.id} className="movie-card">
          <div className="poster-container">
            {review.link ? (
              <a href={review.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}>
                {review.tmdb?.posterPath ? (
                  <img src={review.tmdb.posterPath} alt={review.title} className="poster" loading="lazy" />
                ) : (
                  <div className="poster-placeholder">
                    <ImageIcon size={48} opacity={0.2} />
                  </div>
                )}
              </a>
            ) : (
              review.tmdb?.posterPath ? (
                <img src={review.tmdb.posterPath} alt={review.title} className="poster" loading="lazy" />
              ) : (
                <div className="poster-placeholder">
                  <ImageIcon size={48} opacity={0.2} />
                </div>
              )
            )}
          </div>
          
          <div className="card-content">
            <div className="card-header">
               <h2 className="movie-title">{review.title}</h2>
               <div className="rating">
                 <Star size={16} fill="var(--accent-star)" />
                 <span>{review.rating}</span>
               </div>
            </div>
            
            <div className="movie-meta">
              {review.tmdb?.director && (
                <div>
                  Dir:{' '}
                  <span 
                    className="clickable-meta" 
                    onClick={() => onSearchClick?.(review.tmdb.director)}
                  >
                    {review.tmdb.director}
                  </span>
                </div>
              )}
              {review.date && <div>{review.date}</div>}
            </div>

            {review.tmdb?.cast && review.tmdb.cast.length > 0 && (
              <div className="movie-cast" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Starring:{' '}
                {review.tmdb.cast.slice(0, 3).map((actor, idx) => (
                  <React.Fragment key={actor}>
                    <span 
                      className="clickable-meta"
                      onClick={() => onSearchClick?.(actor)}
                    >
                      {actor}
                    </span>
                    {idx < Math.min(review.tmdb.cast.length, 3) - 1 ? ', ' : ''}
                  </React.Fragment>
                ))}
              </div>
            )}

            {review.reviewer && (
              <div className={`reviewer-badge ${review.reviewer.toLowerCase()}`}>
                {review.reviewer}
              </div>
            )}

            {review.tmdb?.genres && (
              <div className="genres">
                {review.tmdb.genres.map(g => (
                  <span key={g} className="genre-tag">{g}</span>
                ))}
              </div>
            )}

            {review.link && (
              <a href={review.link} target="_blank" rel="noopener noreferrer" className="review-link">
                Read Review <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
