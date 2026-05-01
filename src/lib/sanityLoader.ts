import type { Loader } from 'astro/loaders'
import { sanityClient } from './sanity'

export function sanityLoader(query: string): Loader {
  return {
    name: 'sanity-loader',
    async load({ store, logger }) {
      logger.info(`Fetching from Sanity: ${query}`)
      const data = await sanityClient.fetch<Record<string, unknown>[]>(query)
      store.clear()
      for (const item of data) {
        store.set({ id: String(item._id), data: item })
      }
    },
  }
}
