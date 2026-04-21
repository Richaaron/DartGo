import app, { startServer } from '../server/src/index';

// Initialize the database connection and configuration
// This runs once when the serverless function is cold-started
const init = async () => {
  try {
    await startServer();
  } catch (error) {
    console.error('Failed to initialize serverless function:', error);
  }
};

init();

export default app;
