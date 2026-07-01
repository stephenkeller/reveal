import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_URL = 'https://docs.google.com/spreadsheets/d/142d91qR1faUzUc1tE17PAMa6OXvAzZd20b5IZpwjD68/export?format=csv&gid=0';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.error('Error: TMDB_API_KEY is not set in .env');
  process.exit(1);
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const OUTPUT_FILE = path.join(__dirname, '../src/data/reviews.json');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function fetchMovieData(title, year) {
  try {
    const params = {
      api_key: TMDB_API_KEY,
      query: title,
    };
    
    if (year) {
      params.primary_release_year = year;
    }

    // 1. Search for the movie
    const searchRes = await axios.get(`${TMDB_BASE_URL}/search/movie`, { params });

    if (searchRes.data.results && searchRes.data.results.length > 0) {
      const movie = searchRes.data.results[0];
      const movieId = movie.id;

      // 2. Fetch details including credits
      const detailsRes = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: 'credits',
        },
      });

      const details = detailsRes.data;
      
      // Extract Director
      const director = details.credits?.crew?.find(member => member.job === 'Director')?.name || 'Unknown';
      
      // Extract top 3 actors
      const cast = details.credits?.cast?.slice(0, 3).map(actor => actor.name) || [];

      return {
        tmdbId: details.id,
        title: details.title,
        originalTitle: details.original_title,
        releaseDate: details.release_date,
        overview: details.overview,
        posterPath: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
        genres: details.genres?.map(g => g.name) || [],
        director: director,
        cast: cast,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching data for ${title}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Downloading CSV from Google Sheets...');
  try {
    const csvResponse = await axios.get(CSV_URL);
    const parsed = Papa.parse(csvResponse.data, { header: true, skipEmptyLines: true });
    
function formatLink(link) {
  if (!link) return link;
  if (link.startsWith('http')) return link;
  
  let slug = link
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return `https://thereveal.film/${slug}/`;
}

    const rows = parsed.data;
    console.log(`Found ${rows.length} rows.`);

    const enrichedData = [];

    let currentLink = '';

    // Process sequentially to respect API rate limits nicely
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const movieTitle = row['Movie'];
      if (!movieTitle) continue;

      if (row['Links']) {
        currentLink = row['Links'];
      }

      console.log(`Processing [${i + 1}/${rows.length}]: ${movieTitle}`);
      
      let year = null;
      const yearMatch = movieTitle.match(/\((\d{4})\)/);
      if (yearMatch) {
        year = yearMatch[1];
      }
      
      const cleanTitle = movieTitle.replace(/\(\d{4}\)/g, '').trim();
      
      const tmdbData = await fetchMovieData(cleanTitle, year);

      enrichedData.push({
        id: i + 1,
        title: movieTitle,
        rating: row['Star Rating'],
        reviewer: row['Scott/Keith']?.trim(),
        date: row['Date'],
        link: formatLink(currentLink),
        tmdb: tmdbData
      });

      // Small delay to prevent hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(enrichedData, null, 2));
    console.log(`\nSuccessfully wrote ${enrichedData.length} records to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Fatal Error:', error.message);
  }
}

main();
