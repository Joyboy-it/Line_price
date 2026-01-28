import { NextAuthOptions } from 'next-auth'
import LineProvider from 'next-auth/providers/line'
import { supabaseAdmin } from './supabase'
import { headers } from 'next/headers'

export const authOptions: NextAuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'line') {
        try {
          const h = await headers()
          const xForwardedFor = h.get('x-forwarded-for')
          const ip_address = (xForwardedFor ? xForwardedFor.split(',')[0]?.trim() : null) || h.get('x-real-ip') || 'unknown'
          const user_agent = h.get('user-agent') || 'unknown'

          // Check if user exists
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('provider_id', user.id)
            .single()

          if (!existingUser) {
            // Create new user
            const { data: newUser } = await supabaseAdmin.from('users').insert({
              provider_id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              provider: 'line',
              is_admin: false,
            }).select('id').single()

            // Log first login (non-blocking)
            if (newUser) {
              supabaseAdmin.from('user_logs').insert({
                user_id: newUser.id,
                action: 'register',
                details: { name: user.name },
                ip_address,
                user_agent
              }).then(({ error }) => {
                if (error) console.error('Failed to log register:', error)
              })
            }
          } else {
            // Update user info
            await supabaseAdmin
              .from('users')
              .update({
                name: user.name,
                image: user.image,
              })
              .eq('provider_id', user.id)

            // Log login (non-blocking)
            supabaseAdmin.from('user_logs').insert({
              user_id: existingUser.id,
              action: 'login',
              details: { name: user.name },
              ip_address,
              user_agent
            }).then(({ error }) => {
              if (error) console.error('Failed to log login:', error)
            })
          }
        } catch (error) {
          console.error('Error saving user:', error)
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Get user from database
        const { data: dbUser } = await supabaseAdmin
          .from('users')
          .select('id, is_admin, is_operator')
          .eq('provider_id', token.sub)
          .single()

        if (dbUser) {
          session.user.id = dbUser.id
          session.user.isAdmin = dbUser.is_admin
          session.user.isOperator = dbUser.is_operator || false
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
