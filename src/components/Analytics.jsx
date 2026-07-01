import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import MoviesGrid from './MoviesGrid';

export default function Analytics({ reviews }) {
  const [selectedRating, setSelectedRating] = useState(null);

  const histogramData = useMemo(() => {
    // Initialize bins for possible star ratings
    const bins = {
      '0.5': 0, '1.0': 0, '1.5': 0, '2.0': 0, '2.5': 0,
      '3.0': 0, '3.5': 0, '4.0': 0, '4.5': 0, '5.0': 0
    };

    reviews.forEach(review => {
      if (!review.rating) return;
      const score = parseFloat(review.rating);
      if (isNaN(score)) return;

      const binKey = score.toFixed(1);
      
      if (bins[binKey] !== undefined) {
        bins[binKey]++;
      }
    });

    return Object.entries(bins).map(([rating, count]) => ({
      rating,
      count
    }));
  }, [reviews]);

  // When filters change and the selected rating bin becomes empty, we could clear the selection,
  // but it's often better to let it naturally filter to 0 so the user understands the state.
  const drilledDownReviews = useMemo(() => {
    if (!selectedRating) return [];
    return reviews.filter(review => {
      if (!review.rating) return false;
      const score = parseFloat(review.rating);
      if (isNaN(score)) return false;
      return score.toFixed(1) === selectedRating;
    });
  }, [reviews, selectedRating]);

  if (reviews.length === 0) {
    return (
      <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
        Not enough data to display analytics for these filters.
      </div>
    );
  }

  // Custom Tooltip for premium aesthetic
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(25, 28, 35, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          color: 'var(--text-primary)'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Rating: {label} Stars</p>
          <p style={{ margin: 0, color: 'var(--accent-star)', fontSize: '1.2rem' }}>
            {payload[0].value} Reviews
          </p>
          <p style={{ margin: 0, marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Click to view movies
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-container" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="chart-card" style={{
        background: 'var(--surface-color)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--surface-border)',
        padding: '2rem',
        backdropFilter: 'blur(var(--glass-blur))',
        boxShadow: 'var(--glass-shadow)'
      }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Review Distribution</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Histogram of scores based on your current filters ({reviews.length} total reviews). Click on a bar to see the movies!
        </p>

        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={histogramData} 
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              onClick={(state) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  const rating = state.activePayload[0].payload.rating;
                  setSelectedRating(selectedRating === rating ? null : rating);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" vertical={false} />
              <XAxis 
                dataKey="rating" 
                stroke="var(--text-secondary)" 
                tick={{ fill: 'var(--text-secondary)' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              />
              <YAxis 
                stroke="var(--text-secondary)" 
                tick={{ fill: 'var(--text-secondary)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
              <Bar 
                dataKey="count" 
                radius={[4, 4, 0, 0]}
              >
                {histogramData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={selectedRating === entry.rating ? 'var(--accent-scott)' : 'var(--accent-star)'} 
                    style={{ transition: 'fill 0.3s ease' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {selectedRating && (
        <div style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>
              {selectedRating} Star Reviews ({drilledDownReviews.length})
            </h2>
            <button 
              onClick={() => setSelectedRating(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'var(--text-primary)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                cursor: 'pointer',
                fontFamily: 'var(--font-main)'
              }}
            >
              Clear Selection
            </button>
          </div>
          
          {drilledDownReviews.length > 0 ? (
            <MoviesGrid reviews={drilledDownReviews} />
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No reviews found for this rating with the current filters.</p>
          )}
        </div>
      )}
    </div>
  );
}
