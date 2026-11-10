# ReadMore API

A REST API for the ReadMore bookstore, built with **Express.js**, **MongoDB** and **Mongoose**.
It manages two linked entities, **authors** and **books**, and enforces the store's business rules in
the controllers: no orphan books, no duplicate titles per author, valid prices and years, a safe
author-delete policy, dynamic search and filtering, author statistics and pagination.

**Video walkthrough:** [`video/readmore-walkthrough.mp4`](video/readmore-walkthrough.mp4)

---

## Contents

- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Endpoints](#endpoints)
- [Business rules and design decisions](#business-rules-and-design-decisions)
- [Error responses](#error-responses)
- [Testing the API](#testing-the-api)

---

## Getting started

**Requirements:** Node.js 18+, npm, and MongoDB (local, Docker or Atlas).

1. **Start MongoDB.** With Docker:

   ```sh
   docker run -d --name readmore-mongo -p 27017:27017 mongo:7
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Create your `.env`** from the example. It holds the connection string, which is never committed:

   ```sh
   cp .env.example .env
   ```

   ```ini
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/readmore
   ```

4. **Load sample data** (8 authors, 15 books; safe to run again, it resets the data):

   ```sh
   npm run seed
   ```

5. **Start the server:**

   ```sh
   npm run dev     # restarts on file changes (nodemon)
   npm start       # plain node
   ```

   The server connects to MongoDB first and only starts listening once the connection succeeds:

   ```text
   MongoDB connected: localhost:27017/readmore
   ReadMore API listening on http://localhost:3000
   ```

   If `MONGODB_URI` is missing or the database cannot be reached, it prints the reason and exits instead
   of accepting requests it cannot serve.

6. **Open the interactive docs** at **http://localhost:3000/api-docs** to browse and try every endpoint.

---

## Project structure

```text
.
├── server.js                  entry point: load .env, connect to MongoDB, then start listening
├── app.js                     Express app: JSON parsing, health check, Swagger UI, routes, 404 and error handlers
├── config/
│   └── db.js                  MongoDB connection with Mongoose
├── docs/
│   └── openapi.js             OpenAPI 3 description of every endpoint, served by Swagger UI
├── models/
│   ├── Author.js              Author schema
│   └── Book.js                Book schema, author reference and unique (author, title) index
├── controllers/
│   ├── authorController.js    author CRUD, author's books, stats, delete policy
│   └── bookController.js      book CRUD, orphan and duplicate checks, filtered listing
├── routes/
│   ├── authorRoutes.js        /authors URLs → author controller
│   └── bookRoutes.js          /books URLs → book controller
├── middleware/
│   ├── validateObjectId.js    rejects malformed :id values with 400
│   └── errorHandler.js        JSON 404 for unknown routes and the central error handler
├── utils/
│   ├── validateBook.js        required fields, types, price and year rules
│   ├── bookQuery.js           builds the filter, sort and pagination for GET /books
│   ├── collation.js           case-insensitive collation shared by the index and queries
│   └── pick.js                copies only allowed fields from a request body
├── seed.js                    sample data (npm run seed)
├── requests.http              every demo request for the VS Code REST Client
└── .env.example               environment variables template
```

Routes only map a URL to a controller function. Controllers hold the logic: they read the request,
apply the business rules, talk to the database and choose the status code. Rules shared by create and
update live in `utils/` so they are written once.

Express 5 forwards errors thrown in `async` handlers to the error handler automatically, so controllers
use plain `async/await` without a `try/catch` in every function.

---

## Data model

```text
authors ──< books
```

One author has many books; each book belongs to one author through `book.author`, an `ObjectId` that
references the `Author` model. `populate('author')` replaces that id with the author's details when
books are read.

| Model  | Field           | Type     | Required | Notes                                   |
|--------|-----------------|----------|----------|-----------------------------------------|
| Author | `name`          | String   | yes      | trimmed                                 |
| Author | `country`       | String   | no       |                                         |
| Author | `bio`           | String   | no       |                                         |
| Book   | `title`         | String   | yes      | unique per author, case-insensitive     |
| Book   | `genre`         | String   | yes      |                                         |
| Book   | `price`         | Number   | yes      | must be greater than 0                  |
| Book   | `publishedYear` | Number   | yes      | whole year from 1450 to the current year |
| Book   | `author`        | ObjectId | yes      | references `Author`; must exist         |

Only `name` is required for an author because a store can list an author before knowing their country
or bio. Every book field is required: the store cannot sell a book without a title, genre, price, year
or author. Both models record `createdAt` and `updatedAt`.

---

## Endpoints

### Health and documentation

| Method | Path        | Response |
|--------|-------------|----------|
| GET    | `/`         | `200` `{ status, message, database }` |
| GET    | `/api-docs` | Swagger UI: interactive documentation of every endpoint |

### Authors

| Method | Path                   | Success | Errors |
|--------|------------------------|---------|--------|
| POST   | `/authors`             | `201` created author | `400` missing name |
| GET    | `/authors`             | `200` all authors, sorted by name | |
| GET    | `/authors/:id`         | `200` one author | `400` malformed id, `404` not found |
| PUT    | `/authors/:id`         | `200` updated author | `400` empty name or malformed id, `404` not found |
| DELETE | `/authors/:id`         | `200` deleted author | `409` author still has books, `404` not found |
| GET    | `/authors/:id/books`   | `200` `{ author, count, books }` | `404` author not found |
| GET    | `/authors/:id/stats`   | `200` statistics | `404` author not found |

### Books

| Method | Path          | Success | Errors |
|--------|---------------|---------|--------|
| POST   | `/books`      | `201` created book, author populated | `400` missing/invalid field or unknown author, `409` duplicate title, `422` invalid price or year |
| GET    | `/books`      | `200` `{ page, limit, total, totalPages, results }`, authors populated | `400` invalid query parameter |
| GET    | `/books/:id`  | `200` one book, author populated | `400` malformed id, `404` not found |
| PUT    | `/books/:id`  | `200` updated book, author populated | same as POST, plus `404` not found |
| DELETE | `/books/:id`  | `200` deleted book | `404` not found |

`PUT` updates only the fields sent in the body; the others keep their values. Unknown fields such as
`_id` or `createdAt` are ignored on create and update.

Example: create a book

```http
POST /books
Content-Type: application/json

{
  "title": "The Silent Sea",
  "genre": "Thriller",
  "price": 24.99,
  "publishedYear": 2021,
  "author": "<an existing author id>"
}
```

---

## Business rules and design decisions

MongoDB stores whatever it is given, so every rule below is enforced in the controllers.
For create and update, checks run in this order, and the first failure is returned:

1. Missing or wrongly typed fields → `400`
2. Price or year outside the allowed range → `422`
3. Author does not exist → `400`
4. Title already used by that author → `409`

Format problems are reported before the database is queried at all.

### 1. No orphan books (`400`)

A book can only be created for, or moved to, an author that exists. The controller looks the author up
with `Author.exists()` and rejects the request with `400` if it is missing; nothing is saved.

**Why `required` is not enough:** `required` only checks that *a* value was sent, and the `ObjectId`
type only checks its format. `"000000000000000000000000"` passes both. MongoDB has no foreign keys,
so nothing on the database side checks that the referenced author exists.

### 2. No duplicate titles per author (`409`)

The same author cannot have two books with the same title, ignoring case and surrounding spaces:
`"the silent sea"`, `"The Silent Sea"` and `"  THE SILENT SEA "` are the same title. Different authors
may share a title: Toni Morrison and Marilynne Robinson both have a novel called *Home* in the seed data.

The rule is enforced at two levels:

- **Controller check:** before saving, `Book.exists({ author, title })` runs with a case-insensitive
  collation and returns a clear `409`. On update it excludes the book itself, so a book can change the
  capitalisation of its own title, and it also runs when a book is moved to another author.
- **Unique index:** `{ author: 1, title: 1 }` is unique with the same case-insensitive collation. If two
  identical requests arrive at the same moment, both can pass the controller check before either is
  saved; the index guarantees the database keeps only one, and the error handler turns the duplicate-key
  error (`11000`) into a `409` too.

### 3. Rules the schema cannot express (`422`)

| Field           | Rule                                             |
|-----------------|--------------------------------------------------|
| `price`         | greater than 0                                   |
| `publishedYear` | whole number from 1450 to the current year       |

These return `422 Unprocessable Entity`: the request is well-formed but the values are impossible.
A missing field or a value of the wrong type (for example `"price": "15"`) is a malformed request and
returns `400`. The rules apply to updates as well as creates. The upper year limit is computed on each
request, so it moves forward every January without a code change.

### 4. Deleting an author who still has books: **policy A, block** (`409`)

**Choice:** `DELETE /authors/:id` is refused with `409 Conflict` while the author still has books.
The response says how many books are in the way. Once those books are deleted or reassigned to another
author (with `PUT /books/:id`), the author can be deleted.

```json
{
  "message": "Cannot delete \"Chinua Achebe\": they still have 4 book(s). Delete or reassign those books first.",
  "bookCount": 4
}
```

**Why block:**

- **It never loses data by accident.** A delete that cannot be undone should not quietly take other
  records with it. Blocking makes removing the books an explicit, separate decision.
- **Sold books stay meaningful.** Orders, receipts and reports refer to books and their authors. Deleting
  the books (cascade) would break that history; reassigning them to a placeholder would rewrite who wrote
  them.
- **It keeps every other rule intact.** No book is ever left pointing at an author that does not exist.

**Downside:** it is less convenient. Removing an author with a large catalogue takes several requests,
and an admin has to decide what happens to each book first.

**Why not the other options:**

| Option | What it does | Why it was not chosen |
|--------|--------------|-----------------------|
| B. Cascade | deletes the author and all their books | one request can silently wipe out a catalogue, including books that have already been sold |
| C. Reassign | moves the books to a fallback author, then deletes | needs a permanent fake "Unknown Author", hides who really wrote each book, and can break rule 2: two deleted authors' books called *Home* would end up as duplicates under the fallback author |

**Known limitation:** the count and the delete are two separate operations, so a book created for the
author in the split second between them would be orphaned. Closing that gap needs a MongoDB
transaction, which requires a replica set; for a single bookstore admin this window is acceptable.

### 5. Search and filter on `GET /books`

All parameters are optional and can be combined in any way:

| Parameter              | Effect                                                              |
|------------------------|---------------------------------------------------------------------|
| `genre`                | books of that genre (case-insensitive)                              |
| `minPrice`, `maxPrice` | price range; either, both or neither                                |
| `author`               | books by that author id                                             |
| `search`               | title contains this text (case-insensitive)                         |
| `sort`, `order`        | sort by `price`, `title` or `publishedYear`, `asc` (default) or `desc` |
| `page`, `limit`        | pagination (see below)                                              |

```text
GET /books?genre=Thriller&minPrice=10&maxPrice=30&search=sea&sort=price&order=asc
```

**How the query is built:** `utils/bookQuery.js` starts from an empty filter and adds one condition for
each parameter that is present, so there is a single query instead of one per combination:

| Request                             | MongoDB filter                                        |
|-------------------------------------|-------------------------------------------------------|
| `/books`                            | `{}` (every book)                                     |
| `/books?genre=Thriller`             | `{ genre: "Thriller" }`                               |
| `/books?minPrice=10`                | `{ price: { $gte: 10 } }`                             |
| `/books?minPrice=10&maxPrice=30`    | `{ price: { $gte: 10, $lte: 30 } }`                   |
| `/books?genre=Thriller&search=sea`  | `{ genre: "Thriller", title: { $regex: "sea", $options: "i" } }` |

**Safety checks:**

- Invalid values return `400` with a message: non-numeric prices, `minPrice` above `maxPrice`, a
  malformed `author` id, or a `sort` field that is not allowed.
- `sort` only accepts the three listed fields, so clients cannot sort on internal fields.
- The `search` text is escaped before it becomes a regular expression, so characters like `.*` or `(`
  are matched literally instead of matching everything or causing an error.
- If a parameter is repeated (`?genre=A&genre=B`), the last value is used.
- `_id` is added as a tie-breaker to every sort, so books with equal prices always come back in the same
  order, which keeps pages stable.

### 6. Author statistics

`GET /authors/:id/stats` computes the summary in MongoDB with an aggregation pipeline: match the
author's books, sort them by price, then group them to count them, average their prices and take the
first (cheapest) and last (most expensive) titles.

```json
{
  "author": "Chinua Achebe",
  "bookCount": 4,
  "averagePrice": 21.5,
  "cheapestBook": "Things Fall Apart",
  "mostExpensiveBook": "Anthills of the Savannah"
}
```

**Author with no books:** the endpoint returns `bookCount: 0` and `null` for the average, cheapest and
most expensive book.

```json
{
  "author": "Scholastique Mukasonga",
  "bookCount": 0,
  "averagePrice": null,
  "cheapestBook": null,
  "mostExpensiveBook": null
}
```

`null` means "no data". An average of `0` would wrongly suggest the books are free, and an empty string
would look like a book with no title. The average is rounded to two decimals. If two books share the
lowest or highest price, the one that comes first or last alphabetically is reported.

### Challenge: pagination

`GET /books` always returns the same envelope:

```json
{ "page": 2, "limit": 5, "total": 17, "totalPages": 4, "results": [ ... ] }
```

- Without `page` or `limit`, every matching book is returned (`limit: null`), as rule 5 requires.
- With `page` only, `limit` defaults to 10. `limit` is capped at 100.
- `total` counts every book that matches the filters, not just the current page.
- A page past the end returns an empty `results` array.
- `page` must be a whole number of 1 or more, and `limit` from 1 to 100; otherwise `400`.

---

## Error responses

Every error is JSON with a `message`:

| Status | When |
|--------|------|
| `400`  | malformed JSON, malformed id, missing or wrongly typed field, unknown author, invalid query parameter |
| `404`  | no author or book with that id, or an unknown route |
| `409`  | duplicate title for the same author, or deleting an author who still has books |
| `422`  | price not above 0, or published year outside 1450 to the current year |
| `500`  | unexpected server error (logged; details are not sent to the client) |

---

## Testing the API

### Swagger UI

With the server running, open **http://localhost:3000/api-docs**. Every endpoint is listed with its
parameters, request body and possible responses. Click an endpoint to open it: it is ready to edit
straight away, so change the request and click **Execute**. Type in the **Filter by tag** box at the top to
jump to Authors or Books. The video walkthrough uses Swagger UI.

1. Run `npm run seed`, then use **GET /authors** to copy an author id.
2. For **POST /books**, pick a request from the **Examples** dropdown: a valid book, or one that breaks a
   rule (unknown author, duplicate title, zero price, future year, year before 1450). Replace
   `PASTE_AN_AUTHOR_ID` with the id you copied.
3. **GET /books** has a field for every filter, sort and pagination parameter, so combinations can be
   tried without typing a URL.

The specification lives in `docs/openapi.js`.

### REST Client

`requests.http` contains every demo request, in order, for the
[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension in VS Code.
Run `npm run seed`, start the server, open the file and click **Send Request** above each request from
top to bottom. Ids are captured from earlier responses automatically, so no ids need to be copied.

It covers:

- every author and book endpoint, including the `404` and `400` cases
- the `GET /authors/:id/books` linking endpoint
- each Part 4 rule: the rejected orphan (`400`), the rejected duplicate (`409`), the rejected price and
  years (`422`), filters combined with sorting, pagination, statistics with and without books
- the full delete policy flow: blocked with 2 books, blocked with 1, then allowed with 0

The same requests can be sent from Postman or Insomnia.
