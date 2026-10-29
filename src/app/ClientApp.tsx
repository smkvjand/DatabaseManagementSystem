'use client';
import dynamic from 'next/dynamic';

// App uses localStorage + client state everywhere, so render it in the browser only.
const App = dynamic(() => import('../App'), { ssr: false });

export default function ClientApp() {
  return <App />;
}
