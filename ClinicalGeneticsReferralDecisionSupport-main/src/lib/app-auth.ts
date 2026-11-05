import { cookies } from 'next/headers'
import { getPayloadClient } from './payload'
import { helixCache, CACHE_TAGS, invalidateClinicalCache } from './cache'
import type { User } from '../payload-types'

export function createAppAuth(collection: 'users') {
  return {
    async currentSessionUser(): Promise<User | null> {
      const cookieStore = await cookies()
      const token = cookieStore.get('app-session')?.value || cookieStore.get('payload-token')?.value
      if (!token) return null

      // High-scale Multi-Tier Cache Lookup:
      // L1 RAM (0.01 ms) -> L2 PostgreSQL UNLOGGED cache (< 1 ms)
      const tokenSig = token.slice(-32)
      const cacheKey = `auth:session:${tokenSig}`
      const cached = await helixCache.get<User>(cacheKey)
      if (cached) {
        return cached
      }

      try {
        const payload = await getPayloadClient()
        const { user } = await payload.auth({
          headers: new Headers({ Authorization: `JWT ${token}` }),
        })
        if (user?.collection === collection) {
          const authenticatedUser = user as unknown as User
          // Cache verified session for 180 seconds across L1 RAM and L2 PostgreSQL unlogged table
          await helixCache.set(
            cacheKey,
            authenticatedUser,
            180,
            [CACHE_TAGS.userSession(authenticatedUser.id)]
          )
          return authenticatedUser
        }
        return null
      } catch {
        return null
      }
    },

    async currentUser(): Promise<User | null> {
      const user = await this.currentSessionUser()
      // Full clinical access requires the account to be enabled AND approved
      if (!user || user.enabled === false) return null
      const status = user.verificationStatus
      if (status && status !== 'APPROVED') return null
      return user
    },

    async login(email: string, password: string) {
      const payload = await getPayloadClient()
      const result = await payload.login({
        collection,
        data: { email, password },
        overrideAccess: false,
      })
      if (!result.token || !result.user) {
        throw new Error('Sign-in failed.')
      }

      const embeddedHTTPS = !!process.env.FIGMA_PUBLIC_URL?.startsWith('https:')
      const cookieStore = await cookies()
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || embeddedHTTPS,
        sameSite: (embeddedHTTPS ? 'none' : 'lax') as 'none' | 'lax',
        path: '/',
        maxAge: 3600, // 1 hour
      }

      cookieStore.set('app-session', result.token, cookieOptions)
      cookieStore.set('payload-token', result.token, cookieOptions)

      // Prime the L1 & L2 cache immediately for sub-millisecond post-login transitions
      const tokenSig = result.token.slice(-32)
      const cacheKey = `auth:session:${tokenSig}`
      const authenticatedUser = result.user as unknown as User
      await helixCache.set(cacheKey, authenticatedUser, 180, [
        CACHE_TAGS.userSession(authenticatedUser.id),
      ])

      return {
        user: result.user,
        token: result.token,
      }
    },

    async logout() {
      const cookieStore = await cookies()
      const token = cookieStore.get('app-session')?.value || cookieStore.get('payload-token')?.value
      if (token) {
        const tokenSig = token.slice(-32)
        await helixCache.delete(`auth:session:${tokenSig}`)
      }
      cookieStore.delete('app-session')
      cookieStore.delete('payload-token')
    },
  }
}

export const appAuth = createAppAuth('users')
