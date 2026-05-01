import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: '7yy13k46',
  dataset: 'production',
  apiVersion: '2025-05-01',
  useCdn: true,
})
