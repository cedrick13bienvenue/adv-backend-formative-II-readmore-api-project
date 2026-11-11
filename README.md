# ReadMore API

A bookstore REST API built with **Express.js**, **MongoDB** and **Mongoose**. Authors and books are linked
(one author has many books), and the controllers enforce the store's business rules.

**Video walkthrough:** https://youtu.be/5H2y8WKx0cg

## Getting started

Requires Node.js 18+ and MongoDB.

1. **Start MongoDB.** With Docker:

   ```sh
   docker run -d --name readmore-mongo -p 27017:27017 mongo:7
   ```

2. **Install dependencies and create your `.env`:**

   ```sh
   npm install
   cp .env.example .env
   ```

3. **Fill in `.env`.** It is git-ignored. For the Docker database above:

   ```ini
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/readmore
   ```

   | Variable | What to put | Notes |
   |----------|-------------|-------|
   | `PORT` | any free port, e.g. `3000` | optional; defaults to `3000` if left empty |
   | `MONGODB_URI` | your MongoDB connection string | required |

   For **MongoDB Atlas**, use the connection string from the Atlas dashboard instead:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/readmore`

4. **Load sample data and start:**

   ```sh
   npm run seed
   npm run dev
   ```

   - **`npm run seed`** loads 11 authors and 15 books, resetting the data each time.
   - **`npm run clear`** deletes every author and book, leaving the database empty.
   - **Startup:** the server connects to MongoDB first and only starts listening once the connection
     works.
   - **Interactive docs:** **http://localhost:3000/api-docs** (Swagger UI). Use your own port if you
     changed it.

## Project structure

```text
server.js         connect to MongoDB, then start the server
app.js            middleware, Swagger UI, routes, error handling
config/           database connection
models/           Author and Book schemas (book.author references Author)
routes/           map URLs to controller functions
controllers/      the logic: business rules, database calls, status codes
middleware/       id validation, 404 and central error handler
utils/            shared validation, query building for GET /books
docs/openapi.js   Swagger specification
seed.js           sample data (npm run seed)
clear.js          empty the database (npm run clear)
requests.http     demo requests for the VS Code REST Client
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/authors` | Create an author |
| GET | `/authors` | Get all authors |
| GET | `/authors/:id` | Get one author |
| PUT | `/authors/:id` | Update an author |
| DELETE | `/authors/:id` | Delete an author (blocked while they have books) |
| GET | `/authors/:id/books` | Get all books by an author |
| GET | `/authors/:id/stats` | Get an author's book statistics |
| POST | `/books` | Create a book for an existing author |
| GET | `/books` | Get books, with filters, sorting and pagination |
| GET | `/books/:id` | Get one book |
| PUT | `/books/:id` | Update a book |
| DELETE | `/books/:id` | Delete a book |

- **Author details:** book reads return the author's full details, filled in with `populate`.
- **Bad ids:** an unknown id returns `404`, and a malformed id returns `400`.

## Business rules

| # | Rule | Status |
|---|------|--------|
| 1 | A book's author must exist | `400` |
| 2 | An author can't have two books with the same title (case-insensitive) | `409` |
| 3 | `price` must be above 0; `publishedYear` from 1450 to the current year | `422` |
| 4 | An author with books can't be deleted | `409` |
| 5 | `GET /books` filters: `genre`, `minPrice`, `maxPrice`, `author`, `search`, `sort`, `order` | |
| 6 | `GET /authors/:id/stats`: book count, average price, cheapest and most expensive book | |

**Why the API checks these itself:**

- **Rule 1:** `required` only checks that an author id was sent, and MongoDB has no foreign keys, so the
  controller looks the author up.
- **Rule 2:** the rule applies per author: Robert Greene and George Leonard both have a book called
  *Mastery*. A unique, case-insensitive index on author and title also blocks duplicates sent at the same
  moment.
- **Rule 5:** the filter starts empty and adds only the parameters that were sent, so any combination
  works:

  ```text
  GET /books?genre=Technology&minPrice=40&maxPrice=50&search=micro&sort=price&order=desc
  ```

- **Rule 6:** an author with no books gets `bookCount: 0` and `null` for the other values. `0` would wrongly
  suggest free books.
- **Pagination:** `page` and `limit` return `{ page, limit, total, totalPages, results }`. Without them,
  every matching book is returned.

### Delete policy: block (option A)

Deleting an author who still has books returns `409` with the number of books in the way. Once their books
are deleted or moved to another author, the author can be deleted.

- **Why:** a bookstore's sales records point at its books and authors. Blocking means nothing is ever lost
  by accident, and no book is left without an author.
- **Why not cascade (B):** one request could wipe out a whole catalogue, including books already sold.
- **Why not reassign (C):** it needs a fake "Unknown Author" and hides who wrote the books. It can also
  break rule 2: two *Mastery* books would end up under the same fallback author.
- **Downside:** it is less convenient. An admin has to deal with every book before deleting the author.

## Testing

- **Swagger UI:** open **http://localhost:3000/api-docs**.
  1. Click an endpoint, click **Try it out**, edit the request, then click **Execute**.
  2. `POST /books` has an **Examples** list with a valid book and one example for each broken rule. Paste
     an author id from `GET /authors` over `PASTE_AN_AUTHOR_ID`.
- **REST Client:** open `requests.http` in VS Code and click **Send Request** from top to bottom. Ids carry
  over between requests automatically.
