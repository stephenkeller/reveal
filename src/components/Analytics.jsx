import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function Analytics({ reviews }) {
  const histogramData = useMemo(() => {
    // Initialize bins for possible star ratings
    const bins = {
      '0.5': 0, '1.0': 0, '1.5': 0, '2.0': 0, '2.5': 0,
      '3.0': 0, '3.5': 0, '4.0': 0, '4.5': 0, '5.0': 0
    };

    reviews.forEach(review => {
      // Safely parse the rating. Some might be empty or invalid.
      if (!review.rating) return;
      const score = parseFloat(review.rating);
      if (isNaN(score)) return;

      // Ensure the score is formatted as one decimal place (e.g., '3' -> '3.0')
      const binKey = score.toFixed(1);
      
      // If the bin exists, increment it. (handles unexpected values gracefully by ignoring or adding to generic bin if we wanted)
      if (bins[binKey] !== undefined) {
        bins[binKey]++;
      }
    });

    // Convert to array for Recharts
    return Object.entries(bins).map(([rating, count]) => ({
      rating,
      count
    }));
  }, [reviews]);

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
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-container" style={{ flex: 1, padding: '1rem' }}>
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
          Histogram of scores based on your current filters ({reviews.length} total reviews).
        </p>

        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
                  <Cell key={`cell-${index}`} fill="var(--accent-star)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
