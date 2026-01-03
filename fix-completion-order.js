const fs = require('fs');
const path = require('path');

// Read the backup file
const backupPath = path.join('C:', 'Users', 'rob', 'Downloads', 'book-tracker-backup-2026-01-03.json');
const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Sort books by completionOrder
const booksWithOrder = data.books.filter(book => book.completionOrder);
booksWithOrder.sort((a, b) => a.completionOrder - b.completionOrder);

console.log('Current completion order:');
booksWithOrder.forEach(book => {
  console.log(`  ${book.title}: ${book.completionOrder}`);
});

// Renumber sequentially starting from 1
booksWithOrder.forEach((book, index) => {
  book.completionOrder = index + 1;
});

console.log('\nNew completion order:');
booksWithOrder.forEach(book => {
  console.log(`  ${book.title}: ${book.completionOrder}`);
});

// Write back to file
fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

console.log('\n✓ File updated successfully!');
