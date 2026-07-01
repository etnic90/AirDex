import { getRequestConfig } from 'next-intl/server';
import path from 'path';
import fs from 'fs';

const locales = ['en', 'it', 'es', 'fr', 'de'];

export default getRequestConfig(async (params) => {
  let locale = params.locale as string;

  if (!locales.includes(locale)) {
    locale = 'en';
  }

  // Percorso assoluto alla cartella messages nella root
  const messagesPath = path.join(process.cwd(), 'messages', `${locale}.json`);
  
  return {
    locale,
    messages: JSON.parse(fs.readFileSync(messagesPath, 'utf-8'))
  };
});