import { redirect } from 'next/navigation';

export default function RootPage() {
  // Reindirizza automaticamente tutto il traffico dalla root alla lingua di default
  redirect('/en');
}