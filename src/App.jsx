import React, { useState, useMemo } from 'react';
import { Search, BarChart3, LayoutGrid } from 'lucide-react';
import './index.css';
import reviewsData from './data/reviews.json';
import MoviesGrid from './components/MoviesGrid';
import Analytics from './components/Analytics';

function App() {
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'analytics'
  const [filterReviewer, setFilterReviewer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState(null);
  const [filterYear, setFilterYear] = useState(null);

  // Extract all unique genres and years
  const { allGenres, allYears } = useMemo(() => {
    const genres = new Set();
    const years = new Set();
    
    reviewsData.forEach(review => {
      // Genres
      if (review.tmdb && review.tmdb.genres) {
        review.tmdb.genres.forEach(g => genres.add(g));
      }
      
      // Years
      if (review.tmdb && review.tmdb.releaseDate) {
        const year = review.tmdb.releaseDate.split('-')[0];
        if (year) years.add(year);
      } else {
        // Fallback to checking the date in the original CSV if we want, but TMDB is more accurate
      }
    });
    
    return {
      allGenres: Array.from(genres).sort(),
      allYears: Array.from(years).sort((a, b) => b - a) // Descending
    };
  }, []);

  const filteredReviews = useMemo(() => {
    return reviewsData.filter(review => {
      // Reviewer filter
      if (filterReviewer && review.reviewer !== filterReviewer) return false;
      
      // Genre filter
      if (filterGenre && (!review.tmdb || !review.tmdb.genres || !review.tmdb.genres.includes(filterGenre))) return false;

      // Year filter
      if (filterYear) {
        const year = review.tmdb?.releaseDate?.split('-')[0];
        if (year !== filterYear) return false;
      }

      // Search filter (title, director, or cast)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = review.title.toLowerCase().includes(query);
        const dirMatch = review.tmdb?.director?.toLowerCase().includes(query);
        const castMatch = review.tmdb?.cast?.some(c => c.toLowerCase().includes(query));
        if (!titleMatch && !dirMatch && !castMatch) return false;
      }

      return true;
    });
  }, [filterReviewer, searchQuery, filterGenre, filterYear]);

  return (
    <div className="app-container">
      <header className="header">
        <h1>The Reveal</h1>
        <p>A visual archive of movie reviews by Scott Tobias & Keith Phipps</p>
        
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
            onClick={() => setActiveTab('grid')}
          >
            <LayoutGrid size={18} /> Reviews
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={18} /> Analytics
          </button>
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <div className="filter-group">
            <h3>Search</h3>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Title, Director, Actor..." 
                style={{ paddingLeft: '35px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <h3>Reviewer</h3>
            <button 
              className={`filter-btn ${filterReviewer === 'Scott' ? 'active scott' : ''}`}
              onClick={() => setFilterReviewer(filterReviewer === 'Scott' ? null : 'Scott')}
            >
              Scott Tobias
            </button>
            <button 
              className={`filter-btn ${filterReviewer === 'Keith' ? 'active keith' : ''}`}
              onClick={() => setFilterReviewer(filterReviewer === 'Keith' ? null : 'Keith')}
            >
              Keith Phipps
            </button>
          </div>
          
          <div className="filter-group">
            <h3>Release Year</h3>
            <select 
              className="filter-select"
              value={filterYear || ''}
              onChange={(e) => setFilterYear(e.target.value || null)}
            >
              <option value="">All Years</option>
              {allYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <h3>Genres</h3>
            {allGenres.map(genre => (
              <button 
                key={genre}
                className={`filter-btn ${filterGenre === genre ? 'active' : ''}`}
                onClick={() => setFilterGenre(filterGenre === genre ? null : genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </aside>

        {activeTab === 'grid' ? (
          <MoviesGrid reviews={filteredReviews} />
        ) : (
          <Analytics reviews={filteredReviews} />
        )}
      </main>
    </div>
  );
}

export default App;
