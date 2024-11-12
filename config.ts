import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './param.env') });

export const botToken = process.env.MY_SECRET_TOKEN || "";
export const CRYPTO_PAY_TOKEN = process.env.CRYPTO_PAY_TOKEN || "";


if (!CRYPTO_PAY_TOKEN) {
    console.error('CRYPTO_PAY_TOKEN is not defined in .env file');
}

if (!botToken) {
    console.error('MY_SECRET_TOKEN is not defined in .env file');
}
