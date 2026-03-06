import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 简单演示：允许任何邮箱注册登录
        if (credentials?.email && credentials?.password) {
          return { 
            id: credentials.email, 
            email: credentials.email, 
            name: credentials.email.split('@')[0] 
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-prod'
})

export { handler as GET, handler as POST }
