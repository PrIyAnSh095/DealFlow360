import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect the root path directly to the internal dashboard.
  // The AuthContext/Middleware will automatically intercept this and 
  // redirect to /login if the user is not authenticated.
  redirect('/dashboard');
}
