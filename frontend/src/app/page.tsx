import { redirect } from 'next/navigation';

/**
 * Root path: default home is the user-facing landing.
 * Admin entry is /login.
 */
export default function RootPage() {
  redirect('/home');
}
