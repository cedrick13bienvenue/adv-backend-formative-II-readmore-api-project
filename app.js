const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const openApiSpec = require('./docs/openapi');
const authorRoutes = require('./routes/authorRoutes');
const bookRoutes = require('./routes/bookRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

const swaggerUiOptions = {
  swaggerOptions: {
    docExpansion: 'list',
    defaultModelsExpandDepth: -1,
    filter: true,
  },
};

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ReadMore API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, swaggerUiOptions));
app.use('/authors', authorRoutes);
app.use('/books', bookRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
