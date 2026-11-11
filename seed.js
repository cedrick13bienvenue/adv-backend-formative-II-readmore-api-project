require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Author = require('./models/Author');
const Book = require('./models/Book');

const authors = [
  { name: 'James Clear', country: 'USA', bio: 'Writer on habits, decision-making and continuous improvement.' },
  { name: 'David Goggins', country: 'USA', bio: 'Retired Navy SEAL, ultramarathon runner and author.' },
  { name: 'Martin Kleppmann', country: 'United Kingdom', bio: 'Researcher in distributed systems and data infrastructure.' },
  { name: 'Sam Newman', country: 'United Kingdom', bio: 'Consultant and author on microservices and cloud architecture.' },
  { name: 'Adam Bellemare', country: 'Canada', bio: 'Engineer and author on event-driven architecture.' },
  { name: 'Dale Carnegie', country: 'USA', bio: 'Writer and lecturer on self-improvement and public speaking.' },
  { name: 'Todd Herman', country: 'Canada', bio: 'Performance coach and author.' },
  { name: 'Kobe Bryant', country: 'USA', bio: 'Five-time NBA champion and author.' },
  { name: 'Robert Greene', country: 'USA', bio: 'Author of books on strategy, power and human nature.' },
  { name: 'George Leonard', country: 'USA', bio: 'Writer, educator and aikido teacher.' },
  { name: 'Ryan Holiday', country: 'USA', bio: 'Writer on Stoicism, with no titles in stock yet.' },
];

const booksByAuthor = {
  'James Clear': [{ title: 'Atomic Habits', genre: 'Self-Help', price: 16.99, publishedYear: 2018 }],
  'David Goggins': [
    { title: "Can't Hurt Me", genre: 'Memoir', price: 18.5, publishedYear: 2018 },
    { title: 'Never Finished', genre: 'Memoir', price: 19.99, publishedYear: 2022 },
  ],
  'Martin Kleppmann': [
    { title: 'Designing Data-Intensive Applications', genre: 'Technology', price: 49.99, publishedYear: 2017 },
  ],
  'Sam Newman': [
    { title: 'Building Microservices', genre: 'Technology', price: 44.99, publishedYear: 2021 },
    { title: 'Monolith to Microservices', genre: 'Technology', price: 39.99, publishedYear: 2019 },
  ],
  'Adam Bellemare': [
    { title: 'Building Event-Driven Microservices', genre: 'Technology', price: 54.99, publishedYear: 2020 },
  ],
  'Dale Carnegie': [
    { title: 'How to Win Friends and Influence People', genre: 'Self-Help', price: 12.99, publishedYear: 1936 },
  ],
  'Todd Herman': [{ title: 'The Alter Ego Effect', genre: 'Psychology', price: 17.5, publishedYear: 2019 }],
  'Kobe Bryant': [{ title: 'The Mamba Mentality', genre: 'Sports', price: 25, publishedYear: 2018 }],
  'Robert Greene': [
    { title: 'The 48 Laws of Power', genre: 'Self-Help', price: 18, publishedYear: 1998 },
    { title: 'The 33 Strategies of War', genre: 'Strategy', price: 22, publishedYear: 2006 },
    { title: 'Mastery', genre: 'Self-Help', price: 20, publishedYear: 2012 },
    { title: 'The Laws of Human Nature', genre: 'Psychology', price: 24, publishedYear: 2018 },
  ],
  'George Leonard': [{ title: 'Mastery', genre: 'Self-Help', price: 14, publishedYear: 1991 }],
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
