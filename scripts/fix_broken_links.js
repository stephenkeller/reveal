import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_FILE = path.join(__dirname, '../src/data/reviews.json');

function formatLink(link) {
  if (!link) return link;
  if (link.startsWith('http')) return link;
  
  // Slugify the title
  let slug = link
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove non-alphanumeric (keeps spaces and hyphens)
    .trim()
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/-+/g, '-'); // dedupe hyphens

  return `https://thereveal.film/${slug}/`;
}

function main() {
  const reviews = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
  
  let fixedCount = 0;
  for (const review of reviews) {
    if (review.link && !review.link.startsWith('http')) {
      review.link = formatLink(review.link);
      fixedCount++;
    }
  }

  fs.writeFileSync(JSON_FILE, JSON.stringify(reviews, null, 2));
  console.log(`Successfully fixed ${fixedCount} broken links.`);
}

main();
