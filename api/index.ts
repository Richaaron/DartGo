import app, { startServer } from '../server/src/index.js';

// Initialize the database connection and configuration
// This runs once when the serverless function is cold-started
await startServer();

export default app;
