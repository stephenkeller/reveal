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
  const [selectedPeople, setSelectedPeople] = useState([]);

  const handleAddPerson = (person) => {
    if (!selectedPeople.includes(person)) {
      setSelectedPeople([...selectedPeople, person]);
    }
  };

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

  const [sortBy, setSortBy] = useState('reviewDate'); // 'reviewDate' | 'releaseDate' | 'genre' | 'title'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  const filteredReviews = useMemo(() => {
    let result = reviewsData.filter(review => {
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

      // Selected People filter
      if (selectedPeople.length > 0) {
        const matchesAll = selectedPeople.every(person => {
          const query = person.toLowerCase();
          const dirMatch = review.tmdb?.director?.toLowerCase().includes(query);
          const castMatch = review.tmdb?.cast?.some(c => c.toLowerCase().includes(query));
          return dirMatch || castMatch;
        });
        if (!matchesAll) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortBy === 'reviewDate') {
        valA = a.date ? new Date(a.date).getTime() : 0;
        valB = b.date ? new Date(b.date).getTime() : 0;
      } else if (sortBy === 'releaseDate') {
        valA = a.tmdb?.releaseDate ? new Date(a.tmdb.releaseDate).getTime() : 0;
        valB = b.tmdb?.releaseDate ? new Date(b.tmdb.releaseDate).getTime() : 0;
      } else if (sortBy === 'genre') {
        valA = a.tmdb?.genres?.[0] || 'Z'; // Fallback to Z
        valB = b.tmdb?.genres?.[0] || 'Z';
      } else if (sortBy === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else if (sortBy === 'rating') {
        valA = parseFloat(a.rating) || 0;
        valB = parseFloat(b.rating) || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [filterReviewer, searchQuery, filterGenre, filterYear, sortBy, sortOrder, selectedPeople]);

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
            {selectedPeople.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                {selectedPeople.map(person => (
                  <button 
                    key={person} 
                    className="filter-btn active"
                    style={{ margin: 0, padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => setSelectedPeople(prev => prev.filter(p => p !== person))}
                  >
                    {person} &times;
                  </button>
                ))}
                {selectedPeople.length > 1 && (
                  <button 
                    className="filter-btn" 
                    style={{ margin: 0, padding: '0.25rem 0.5rem', fontSize: '0.8rem', border: 'none', color: 'var(--text-secondary)' }}
                    onClick={() => setSelectedPeople([])}
                  >
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="filter-group">
            <h3>Sort By</h3>
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="reviewDate">Review Date</option>
              <option value="releaseDate">Movie Release Date</option>
              <option value="rating">Rating</option>
              <option value="genre">Genre</option>
              <option value="title">Alphabetical</option>
            </select>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                className={`filter-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                onClick={() => setSortOrder('asc')}
                style={{ flex: 1 }}
              >
                Ascending
              </button>
              <button 
                className={`filter-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                onClick={() => setSortOrder('desc')}
                style={{ flex: 1 }}
              >
                Descending
              </button>
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
          <MoviesGrid 
            reviews={filteredReviews} 
            onSearchClick={handleAddPerson} 
            onGenreClick={setFilterGenre}
          />
        ) : (
          <Analytics reviews={filteredReviews} />
        )}
      </main>
    </div>
  );
}

export default App;
