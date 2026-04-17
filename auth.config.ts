import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: { signIn: '/admin/login' },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isAdmin = request.nextUrl.pathname.startsWith('/admin');
      const isLogin = request.nextUrl.pathname === '/admin/login';
      if (isAdmin && !isLogin) return !!auth;
      return true;
    },
  },
  session: { strategy: 'jwt' },
};
