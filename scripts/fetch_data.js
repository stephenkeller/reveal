import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as XLSX from 'xlsx';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const XLSX_URL = 'https://docs.google.com/spreadsheets/d/142d91qR1faUzUc1tE17PAMa6OXvAzZd20b5IZpwjD68/export?format=xlsx&gid=0';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.error('Error: TMDB_API_KEY is not set in .env');
  process.exit(1);
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const OUTPUT_FILE = path.join(__dirname, '../src/data/reviews.json');

// Map of exact spreadsheet titles to their TMDB IDs to bypass finicky search
const OVERRIDES = {
  'The Rose of Nevada': 1399525,
  'Nirvana The Band The Show The Movie': 1154538,
  'White Noise': 744594,
  'Dracula (Luc Besson)': 1246049,
  'Dracula (Radu Jude)': 1323409,
  'The Beast': 914206,
  '28 Days Later: The Bone Temple': 1272837,
  'Loves Lies Bleeding': 948549,
  'Napolean': 753342,
  'The Fablemans': 804095,
  'Keane': 13468,
  'Mr. Malcom\'s List': 585379,
  'The Matrix Ressurrections ': 624860,
  'Tron:Ares': 533533
};

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function fetchMovieData(title, year, originalSpreadsheetTitle) {
  try {
    let movieId = null;

    if (OVERRIDES[originalSpreadsheetTitle]) {
      movieId = OVERRIDES[originalSpreadsheetTitle];
    } else {
      const params = {
        api_key: TMDB_API_KEY,
        query: title,
      };
      
      if (year) {
        params.year = year; // Use fuzzy year instead of primary_release_year to account for festival vs wide release
      }

      // 1. Search for the movie
      const searchRes = await axios.get(`${TMDB_BASE_URL}/search/movie`, { params });

      if (searchRes.data.results && searchRes.data.results.length > 0) {
        movieId = searchRes.data.results[0].id;
      }
    }

    if (movieId) {
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

async function main() {
  console.log('Downloading XLSX from Google Sheets...');
  try {
    const xlsxResponse = await axios.get(XLSX_URL, { responseType: 'arraybuffer' });
    const workbook = XLSX.read(xlsxResponse.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    const headers = rows[0];
    
    const movieColIdx = headers.indexOf('Movie');
    const ratingColIdx = headers.indexOf('Star Rating');
    const reviewerColIdx = headers.indexOf('Scott/Keith');
    const dateColIdx = headers.indexOf('Date');
    const linksColIdx = headers.indexOf('Links');

    console.log(`Found ${rows.length - 1} rows.`);

    const enrichedData = [];
    let currentLink = '';

    // Process sequentially to respect API rate limits nicely
    // Start at row 1 (skip headers)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const movieTitle = row[movieColIdx];
      if (!movieTitle) continue;

      // Extract hyperlink object directly from the Excel cell if available
      const linkCellAddress = XLSX.utils.encode_cell({ c: linksColIdx, r: i });
      const linkCell = worksheet[linkCellAddress];
      
      let parsedLink = '';
      if (linkCell?.l?.Target) {
        parsedLink = linkCell.l.Target; // It's a real hyperlink!
      } else if (row[linksColIdx]) {
        parsedLink = row[linksColIdx]; // Fallback to raw text
      }

      if (parsedLink) {
        currentLink = parsedLink;
      }

      console.log(`Processing [${i}/${rows.length - 1}]: ${movieTitle}`);
      
      let year = null;
      const yearMatch = String(movieTitle).match(/\((\d{4})\)/);
      if (yearMatch) {
        year = yearMatch[1];
      } else {
        const dateStr = row[dateColIdx];
        if (dateStr) {
          const dateMatch = String(dateStr).match(/\b(20\d{2})\b/);
          if (dateMatch) {
            year = dateMatch[1];
          }
        }
      }
      
      const cleanTitle = String(movieTitle).replace(/\(\d{4}\)/g, '').trim();
      
      const tmdbData = await fetchMovieData(cleanTitle, year, movieTitle);

      enrichedData.push({
        id: i,
        title: movieTitle,
        rating: row[ratingColIdx],
        reviewer: row[reviewerColIdx]?.trim(),
        date: row[dateColIdx],
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
