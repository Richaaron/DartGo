
export default async function handler(req: any, res: any) {
  try {
    // Dynamic import to catch errors during module initialization
    const { default: app } = await import('../server/src/index.js');
    return app(req, res);
  } catch (error: any) {
    console.error('Vercel Function Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: error.stack,
      hint: 'Check your environment variables and Supabase connection.'
    });
  }
}
