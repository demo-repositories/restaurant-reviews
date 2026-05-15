import {createClient} from 'next-sanity'
import {apiVersion, dataset, projectId} from './client'

/**
 * Sanity client with write permissions, used server-side to persist agent
 * conversation telemetry. The token must have Editor (or higher) role.
 */
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})
