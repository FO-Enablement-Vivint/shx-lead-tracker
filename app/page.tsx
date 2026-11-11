/**
 * The whole app lives on one route.
 *
 * Magistrate's SessionProvider gates it: anyone without a session is sent to
 * sign in. The SHX Team roster check happens server-side per request — see
 * server/lib/roster.ts.
 */
import AppRoot from '@/AppRoot';
import { SessionProvider } from '@FO-Enablement-Vivint/magistrate/next';

export default function Page() {
  return (
    <SessionProvider>
      <AppRoot /> 
    </SessionProvider>
  )
}
