import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Helper function to handle SSL parameters for remote databases
// Windows has TLS/Schannel issues with some PostgreSQL servers
function ensureSSLParams(url) {
  if (!url) return url;
  
  // Check if it's a remote database (not localhost)
  const isRemote = !url.includes('localhost') && !url.includes('127.0.0.1');
  if (!isRemote) return url;
  
  // Check if SSL params already exist
  if (url.includes('sslmode=')) return url;
  
  // Windows workaround: disable SSL for development
  // Note: For production on Linux/Railway, SSL will work properly
  const isWindows = process.platform === 'win32';
  const sslMode = isWindows ? 'disable' : 'require';
  
  const separator = url.includes('?') ? '&' : '?';
  console.log(`🔐 Setting sslmode=${sslMode} for ${isWindows ? 'Windows' : 'non-Windows'} environment`);
  return `${url}${separator}sslmode=${sslMode}`;
}

// Set DATABASE_URL with priority: DATABASE_PUBLIC_URL > DATABASE_URL > constructed from DB_* variables
if (!process.env.DATABASE_URL) {
  // Priority 1: Use DATABASE_PUBLIC_URL if available
  if (process.env.DATABASE_PUBLIC_URL) {
    process.env.DATABASE_URL = ensureSSLParams(process.env.DATABASE_PUBLIC_URL);
    console.log('✅ DATABASE_URL set from DATABASE_PUBLIC_URL');
  }
  // Priority 2: Construct from separate DB variables
  else if (process.env.DB_HOST) {
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME;
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;

    if (dbHost && dbName && dbUser && dbPassword) {
      let url = `postgresql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}?schema=public`;
      process.env.DATABASE_URL = ensureSSLParams(url);
      console.log('✅ DATABASE_URL constructed from separate DB variables');
    } else {
      console.warn('⚠️  Missing DB environment variables. Please set DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD');
    }
  }
} else {
  process.env.DATABASE_URL = ensureSSLParams(process.env.DATABASE_URL);
  console.log('✅ Using DATABASE_URL from environment');
}

// Export environment variables
export default {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
};
