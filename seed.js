require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Author = require('./models/Author');
const Book = require('./models/Book');

const authors = [
  { name: 'Chinua Achebe', country: 'Nigeria', bio: 'Novelist and critic, author of the African Trilogy.' },
  { name: 'Chimamanda Ngozi Adichie', country: 'Nigeria', bio: 'Novelist and essayist.' },
  { name: "Ngũgĩ wa Thiong'o", country: 'Kenya', bio: 'Novelist, playwright and essayist.' },
  { name: 'Toni Morrison', country: 'USA', bio: 'Nobel Prize-winning novelist.' },
  { name: 'Marilynne Robinson', country: 'USA', bio: 'Pulitzer Prize-winning novelist.' },
  { name: 'Gillian Flynn', country: 'USA', bio: 'Thriller writer.' },
  { name: 'Stieg Larsson', country: 'Sweden', bio: 'Journalist and crime novelist.' },
  { name: 'Scholastique Mukasonga', country: 'Rwanda', bio: 'Writer with no titles in stock yet.' },
];

const booksByAuthor = {
  'Chinua Achebe': [
    { title: 'Things Fall Apart', genre: 'Fiction', price: 15, publishedYear: 1958 },
    { title: 'No Longer at Ease', genre: 'Fiction', price: 20, publishedYear: 1960 },
    { title: 'Arrow of God', genre: 'Fiction', price: 22, publishedYear: 1964 },
    { title: 'Anthills of the Savannah', genre: 'Fiction', price: 29, publishedYear: 1987 },
  ],
  'Chimamanda Ngozi Adichie': [
    { title: 'Purple Hibiscus', genre: 'Fiction', price: 18.5, publishedYear: 2003 },
    { title: 'Half of a Yellow Sun', genre: 'Historical Fiction', price: 24, publishedYear: 2006 },
    { title: 'Americanah', genre: 'Fiction', price: 26, publishedYear: 2013 },
  ],
  "Ngũgĩ wa Thiong'o": [
    { title: 'Weep Not, Child', genre: 'Fiction', price: 14, publishedYear: 1964 },
    { title: 'A Grain of Wheat', genre: 'Historical Fiction', price: 19, publishedYear: 1967 },
  ],
  'Toni Morrison': [
    { title: 'Beloved', genre: 'Fiction', price: 22, publishedYear: 1987 },
    { title: 'Home', genre: 'Fiction', price: 17, publishedYear: 2012 },
  ],
  'Marilynne Robinson': [{ title: 'Home', genre: 'Fiction', price: 21, publishedYear: 2008 }],
  'Gillian Flynn': [
    { title: 'Sharp Objects', genre: 'Thriller', price: 12, publishedYear: 2006 },
    { title: 'Gone Girl', genre: 'Thriller', price: 16.5, publishedYear: 2012 },
  ],
  'Stieg Larsson': [
    { title: 'The Girl with the Dragon Tattoo', genre: 'Thriller', price: 19.99, publishedYear: 2005 },
  ],
};

const seed = async () => {
  await connectDB(process.env.MONGODB_URI);

  await Book.deleteMany();
  await Author.deleteMany();
  await Book.syncIndexes();

  const createdAuthors = await Author.insertMany(authors);
  const idByName = Object.fromEntries(createdAuthors.map((author) => [author.name, author._id]));

  const books = Object.entries(booksByAuthor).flatMap(([name, titles]) =>
    titles.map((book) => ({ ...book, author: idByName[name] }))
  );
  await Book.insertMany(books);

  console.log(`Seeded ${createdAuthors.length} authors and ${books.length} books:`);
  createdAuthors.forEach((author) => console.log(`  ${author._id}  ${author.name}`));
};

seed()
  .catch((err) => {
    console.error(`Seeding failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
