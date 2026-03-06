import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// 简单实现：邮箱+密码登录
// 生产环境建议用数据库存储用户
const users = [
  { id: '1', email: 'test@example.com', password: 'password123' }
]

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = users.find(u => u.email === credentials?.email && u.password === credentials?.password)
        if (user) return { id: user.id, email: user.email, name: user.email }
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
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production'
})

export { handler as GET, handler as POST }
