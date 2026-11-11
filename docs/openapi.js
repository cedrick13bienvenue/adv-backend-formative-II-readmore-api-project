const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

const jsonContent = (schema, example) => ({
  'application/json': example === undefined ? { schema } : { schema, example },
});

const ok = (description, schema, example) => ({ description, content: jsonContent(schema, example) });

const fail = (description, message) => ({ description, content: jsonContent(ref('Error'), { message }) });

const idParam = (entity) => ({
  name: 'id',
  in: 'path',
  required: true,
  description: `${entity} id: a 24-character hexadecimal ObjectId`,
  schema: { type: 'string' },
});

const queryParam = (name, description, schema) => ({ name, in: 'query', required: false, description, schema });

const exampleAuthor = {
  _id: '6af39bd29abecae113637841',
  name: 'Chinua Achebe',
  country: 'Nigeria',
  bio: 'Novelist and critic, author of the African Trilogy.',
  createdAt: '2026-11-10T22:30:25.883Z',
  updatedAt: '2026-11-10T22:30:25.883Z',
};

const exampleBook = {
  _id: '6af39bd29abecae113637850',
  title: 'Things Fall Apart',
  genre: 'Fiction',
  price: 15,
  publishedYear: 1958,
  author: { _id: exampleAuthor._id, name: exampleAuthor.name, country: exampleAuthor.country, bio: exampleAuthor.bio },
  createdAt: '2026-11-10T22:30:25.990Z',
  updatedAt: '2026-11-10T22:30:25.990Z',
};

const bookBody = (overrides) => ({
  title: 'The Silent Sea',
  genre: 'Thriller',
  price: 24.99,
  publishedYear: 2021,
  author: 'PASTE_AN_AUTHOR_ID',
  ...overrides,
});

const malformedId = fail('Malformed id', '"abc" is not a valid id');

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'ReadMore API',
    version: '1.0.0',
    description: 'Bookstore API for linked authors and books, built with Express, MongoDB and Mongoose.',
  },
  servers: [{ url: '/', description: 'This server' }],
  tags: [
    { name: 'Health', description: 'Server and database status' },
    { name: 'Authors', description: 'Author CRUD, an author\'s books and statistics' },
    { name: 'Books', description: 'Book CRUD with search, filters, sorting and pagination' },
  ],
  paths: {
    '/': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: ok('Server is running', ref('Health'), {
            status: 'ok',
            message: 'ReadMore API is running',
            database: 'connected',
          }),
        },
      },
    },
    '/authors': {
      post: {
        tags: ['Authors'],
        summary: 'Create an author',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('AuthorInput'),
              examples: {
                valid: {
                  summary: 'Valid author (201)',
                  value: { name: 'Amara Okafor', country: 'Nigeria', bio: 'Thriller writer from Lagos' },
                },
                missingName: { summary: 'Missing name (400)', value: { country: 'Ghana' } },
              },
            },
          },
        },
        responses: {
          201: ok('Author created', ref('Author'), exampleAuthor),
          400: fail('Name is missing or blank', 'Validation failed'),
        },
      },
      get: {
        tags: ['Authors'],
        summary: 'Get all authors, sorted by name',
        responses: {
          200: ok('All authors', { type: 'array', items: ref('Author') }, [exampleAuthor]),
        },
      },
    },
    '/authors/{id}': {
      parameters: [idParam('Author')],
      get: {
        tags: ['Authors'],
        summary: 'Get one author',
        responses: {
          200: ok('The author', ref('Author'), exampleAuthor),
          400: malformedId,
          404: fail('No author with that id', 'No author found with id 000000000000000000000000'),
        },
      },
      put: {
        tags: ['Authors'],
        summary: 'Update an author',
        description: 'Only the fields sent are changed. The name cannot be set to an empty value.',
        requestBody: {
          required: true,
          content: jsonContent(ref('AuthorUpdate'), { bio: 'Award-winning novelist' }),
        },
        responses: {
          200: ok('Updated author', ref('Author'), exampleAuthor),
          400: fail('Malformed id or empty name', 'Validation failed'),
          404: fail('No author with that id', 'No author found with id 000000000000000000000000'),
        },
      },
      delete: {
        tags: ['Authors'],
        summary: 'Delete an author (blocked while they still have books)',
        description:
          'Delete policy A: an author who still has books cannot be deleted. Delete or reassign their books first ' +
          '(PUT /books/{id} with another author), then delete the author.',
        responses: {
          200: ok('Author deleted', ref('DeleteAuthorResult'), {
            message: 'Author "Amara Okafor" deleted',
            author: exampleAuthor,
          }),
          400: malformedId,
          404: fail('No author with that id', 'No author found with id 000000000000000000000000'),
          409: {
            description: 'The author still has books',
            content: jsonContent(ref('Error'), {
              message: 'Cannot delete "Chinua Achebe": they still have 4 book(s). Delete or reassign those books first.',
              bookCount: 4,
            }),
          },
        },
      },
    },
    '/authors/{id}/books': {
      parameters: [idParam('Author')],
      get: {
        tags: ['Authors'],
        summary: 'Get all books by one author',
        responses: {
          200: ok('The author, how many books they have, and the books ordered by year', ref('AuthorBooks')),
          400: malformedId,
          404: fail('No author with that id', 'No author found with id 000000000000000000000000'),
        },
      },
    },
    '/authors/{id}/stats': {
      parameters: [idParam('Author')],
      get: {
        tags: ['Authors'],
        summary: 'Get statistics for an author\'s books',
        description: 'An author with no books gets bookCount 0 and null for the other values.',
        responses: {
          200: {
            description: 'Statistics',
            content: {
              'application/json': {
                schema: ref('AuthorStats'),
                examples: {
                  withBooks: {
                    summary: 'Author with books',
                    value: {
                      author: 'Chinua Achebe',
                      bookCount: 4,
                      averagePrice: 21.5,
                      cheapestBook: 'Things Fall Apart',
                      mostExpensiveBook: 'Anthills of the Savannah',
                    },
                  },
                  noBooks: {
                    summary: 'Author with no books',
                    value: {
                      author: 'Scholastique Mukasonga',
                      bookCount: 0,
                      averagePrice: null,
                      cheapestBook: null,
                      mostExpensiveBook: null,
                    },
                  },
                },
              },
            },
          },
          400: malformedId,
          404: fail('No author with that id', 'No author found with id 000000000000000000000000'),
        },
      },
    },
    '/books': {
      post: {
        tags: ['Books'],
        summary: 'Create a book for an existing author',
        description:
          'Replace PASTE_AN_AUTHOR_ID with an id from GET /authors. Checks run in this order: ' +
          'missing or wrongly typed fields (400), price and year rules (422), author exists (400), ' +
          'title not already used by that author, ignoring case (409).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('BookInput'),
              examples: {
                valid: { summary: 'Valid book (201)', value: bookBody() },
                missingFields: { summary: 'Missing fields (400)', value: { title: 'Only a title' } },
                unknownAuthor: {
                  summary: 'Rule 1: author does not exist (400)',
                  value: bookBody({ title: 'Ghost Story', author: '000000000000000000000000' }),
                },
                duplicate: {
                  summary: 'Rule 2: same title, different case, same author (409, send after "Valid book")',
                  value: bookBody({ title: 'the silent sea' }),
                },
                zeroPrice: { summary: 'Rule 3: price of 0 (422)', value: bookBody({ title: 'Free Book', price: 0 }) },
                futureYear: {
                  summary: 'Rule 3: published in the future (422)',
                  value: bookBody({ title: "Tomorrow's News", publishedYear: 2099 }),
                },
                tooOld: {
                  summary: 'Rule 3: published before 1450 (422)',
                  value: bookBody({ title: 'Before the Printing Press', publishedYear: 1200 }),
                },
              },
            },
          },
        },
        responses: {
          201: ok('Book created, with the author populated', ref('Book'), exampleBook),
          400: fail('Missing or wrongly typed field, or unknown author', 'Author 000000000000000000000000 does not exist. A book must belong to an existing author.'),
          409: fail('The author already has a book with this title', 'This author already has a book titled "the silent sea"'),
          422: fail('Price or published year out of range', 'price must be greater than 0 (received 0)'),
        },
      },
      get: {
        tags: ['Books'],
        summary: 'Get books with optional search, filters, sorting and pagination',
        description:
          'Every parameter is optional and they can be combined in any way. With no parameters every book is returned. ' +
          'Without page or limit, all matching books are returned and limit is null.',
        parameters: [
          queryParam('genre', 'Only books of this genre (case-insensitive)', { type: 'string' }),
          queryParam('minPrice', 'Lowest price, inclusive', { type: 'number' }),
          queryParam('maxPrice', 'Highest price, inclusive', { type: 'number' }),
          queryParam('author', 'Only books by this author id', { type: 'string' }),
          queryParam('search', 'Title contains this text (case-insensitive)', { type: 'string' }),
          queryParam('sort', 'Field to sort by', { type: 'string', enum: ['price', 'title', 'publishedYear'] }),
          queryParam('order', 'Sort direction (default asc)', { type: 'string', enum: ['asc', 'desc'] }),
          queryParam('page', 'Page number, from 1 (limit defaults to 10 when page is set)', { type: 'integer', minimum: 1 }),
          queryParam('limit', 'Books per page, from 1 to 100', { type: 'integer', minimum: 1, maximum: 100 }),
        ],
        responses: {
          200: ok('Matching books with pagination details', ref('BookList'), {
            page: 1,
            limit: 2,
            total: 5,
            totalPages: 3,
            results: [exampleBook],
          }),
          400: fail('Invalid query parameter', 'sort must be one of: price, title, publishedYear'),
        },
      },
    },
    '/books/{id}': {
      parameters: [idParam('Book')],
      get: {
        tags: ['Books'],
        summary: 'Get one book, with the author populated',
        responses: {
          200: ok('The book', ref('Book'), exampleBook),
          400: malformedId,
          404: fail('No book with that id', 'No book found with id 000000000000000000000000'),
        },
      },
      put: {
        tags: ['Books'],
        summary: 'Update a book',
        description:
          'Only the fields sent are changed. The same rules as create apply: 400 for a wrong type or unknown author, ' +
          '422 for price or year, 409 if the new title or new author would create a duplicate.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('BookUpdate'),
              examples: {
                newPrice: { summary: 'Change the price (200)', value: { price: 22.5 } },
                negativePrice: { summary: 'Rule 3: negative price (422)', value: { price: -5 } },
                moveToAuthor: { summary: 'Move to another author', value: { author: 'PASTE_AN_AUTHOR_ID' } },
              },
            },
          },
        },
        responses: {
          200: ok('Updated book, with the author populated', ref('Book'), exampleBook),
          400: fail('Malformed id, wrongly typed field or unknown author', 'price must be a number'),
          404: fail('No book with that id', 'No book found with id 000000000000000000000000'),
          409: fail('The author already has a book with this title', 'This author already has a book titled "Home"'),
          422: fail('Price or published year out of range', 'price must be greater than 0 (received -5)'),
        },
      },
      delete: {
        tags: ['Books'],
        summary: 'Delete a book',
        responses: {
          200: ok('Book deleted', ref('DeleteBookResult')),
          400: malformedId,
          404: fail('No book with that id', 'No book found with id 000000000000000000000000'),
        },
      },
    },
  },
  components: {
    schemas: {
      Health: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
          database: { type: 'string', enum: ['connected', 'disconnected'] },
        },
      },
      AuthorInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Amara Okafor' },
          country: { type: 'string', example: 'Nigeria' },
          bio: { type: 'string', example: 'Thriller writer from Lagos' },
        },
      },
      AuthorUpdate: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          country: { type: 'string' },
          bio: { type: 'string' },
        },
      },
      Author: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          country: { type: 'string' },
          bio: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthorSummary: {
        type: 'object',
        description: 'Author details populated onto a book',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          country: { type: 'string' },
          bio: { type: 'string' },
        },
      },
      BookInput: {
        type: 'object',
        required: ['title', 'genre', 'price', 'publishedYear', 'author'],
        properties: {
          title: { type: 'string', description: 'Unique per author, ignoring case' },
          genre: { type: 'string' },
          price: { type: 'number', description: 'Must be greater than 0' },
          publishedYear: { type: 'integer', description: 'From 1450 to the current year' },
          author: { type: 'string', description: 'Id of an existing author' },
        },
      },
      BookUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          genre: { type: 'string' },
          price: { type: 'number' },
          publishedYear: { type: 'integer' },
          author: { type: 'string' },
        },
      },
      Book: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          genre: { type: 'string' },
          price: { type: 'number' },
          publishedYear: { type: 'integer' },
          author: ref('AuthorSummary'),
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      BookList: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer', nullable: true, description: 'null when every matching book is returned' },
          total: { type: 'integer', description: 'Number of books matching the filters' },
          totalPages: { type: 'integer' },
          results: { type: 'array', items: ref('Book') },
        },
      },
      AuthorBooks: {
        type: 'object',
        properties: {
          author: ref('Author'),
          count: { type: 'integer' },
          books: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                title: { type: 'string' },
                genre: { type: 'string' },
                price: { type: 'number' },
                publishedYear: { type: 'integer' },
                author: { type: 'string' },
              },
            },
          },
        },
      },
      AuthorStats: {
        type: 'object',
        properties: {
          author: { type: 'string' },
          bookCount: { type: 'integer' },
          averagePrice: { type: 'number', nullable: true },
          cheapestBook: { type: 'string', nullable: true },
          mostExpensiveBook: { type: 'string', nullable: true },
        },
      },
      DeleteAuthorResult: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          author: ref('Author'),
        },
      },
      DeleteBookResult: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          book: { type: 'object' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          errors: { type: 'array', items: { type: 'string' }, description: 'Validation messages, when there are several' },
          bookCount: { type: 'integer', description: 'Books still blocking an author delete' },
        },
      },
    },
  },
};
