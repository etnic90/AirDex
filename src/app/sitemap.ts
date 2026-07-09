import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://airdex.com'; 
  const locales = ['en', 'it', 'es', 'fr'];

  // 1. Pagine Statiche di Base
  const staticPaths = ['', '/radar', '/airlines', '/airports', '/compare', '/stats', '/blog'];
  const staticEntries: MetadataRoute.Sitemap = [];
  
  for (const path of staticPaths) {
    for (const lang of locales) {
      staticEntries.push({
        url: `${baseUrl}/${lang}${path}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: path === '' ? 1.0 : 0.8,
      });
    }
  }

  // 2. Aerei Dinamici (SSG)
  const { data: aircrafts } = await supabase
    .from('aircraft_models')
    .select('slug');
    
  const aircraftEntries: MetadataRoute.Sitemap = [];
  if (aircrafts) {
    for (const a of aircrafts) {
      for (const lang of locales) {
        aircraftEntries.push({
          url: `${baseUrl}/${lang}/aircraft/${a.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  }

  // 3. Blog Dinamico (Articoli)
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, published_at')
    .eq('is_published', true);
    
  const blogEntries: MetadataRoute.Sitemap = [];
  if (articles) {
    for (const art of articles) {
      for (const lang of locales) {
        blogEntries.push({
          url: `${baseUrl}/${lang}/blog/${art.slug}`,
          lastModified: new Date(art.published_at || new Date()),
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      }
    }
  }

  // 4. Compagnie Dinamiche (Airlines)
  const { data: airlines } = await supabase
    .from('airlines')
    .select('slug');
    
  const airlineEntries: MetadataRoute.Sitemap = [];
  if (airlines) {
    for (const a of airlines) {
      for (const lang of locales) {
        airlineEntries.push({
          url: `${baseUrl}/${lang}/airlines/${a.slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
        });
      }
    }
  }

  // 5. Aeroporti Dinamici (Airports)
  const { data: airports } = await supabase
    .from('airports')
    .select('slug');
    
  const airportEntries: MetadataRoute.Sitemap = [];
  if (airports) {
    for (const a of airports) {
      for (const lang of locales) {
        airportEntries.push({
          url: `${baseUrl}/${lang}/airports/${a.slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
        });
      }
    }
  }

  return [...staticEntries, ...aircraftEntries, ...blogEntries, ...airlineEntries, ...airportEntries];
}
