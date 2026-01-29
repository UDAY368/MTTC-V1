import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from backend directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Helper function to handle SSL parameters for remote databases
function ensureSSLParams(url) {
  if (!url) return url;
  
  // Check if it's a remote database (not localhost)
  const isRemote = !url.includes('localhost') && !url.includes('127.0.0.1');
  if (!isRemote) return url;
  
  // Check if SSL params already exist
  if (url.includes('sslmode=')) return url;
  
  // Windows workaround: disable SSL for development
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
      console.log(`   Host: ${dbHost}:${dbPort}`);
      console.log(`   Database: ${dbName}`);
    } else {
      console.error('❌ Missing DB environment variables');
      console.error('   Required: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
      process.exit(1);
    }
  } else {
    console.error('❌ No database configuration found');
    console.error('   Please set either DATABASE_PUBLIC_URL or DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
    process.exit(1);
  }
} else {
  process.env.DATABASE_URL = ensureSSLParams(process.env.DATABASE_URL);
  console.log('✅ Using DATABASE_URL from environment');
}

// Export for use in other scripts
export default process.env;
