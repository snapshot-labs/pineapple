import path from 'path';
import dotenv from 'dotenv';

// Load test environment variables first, then fallback to root .env
dotenv.config({ path: path.join(__dirname, '.env.test') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });
