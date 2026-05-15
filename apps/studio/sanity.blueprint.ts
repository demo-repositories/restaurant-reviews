import {defineBlueprint, defineRobotToken, defineScheduledFunction} from '@sanity/blueprints'
import 'dotenv/config'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID

if (!projectId) {
  throw new Error('SANITY_STUDIO_PROJECT_ID is not set in .env')
}

export default defineBlueprint({
  resources: [
    // defineScheduledFunction({
    //   name: 'classify-conversations',
    //   timeout: 600,
    //   robotToken: '$.resources.classify-conversations-robot.token',
    //   env: {
    //     ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
    //     SANITY_PROJECT_ID: projectId,
    //     SANITY_DATASET: process.env.SANITY_STUDIO_DATASET ?? 'production',
    //   },
    //   event: {
    //     // Every 10 minutes
    //     expression: '*/10 * * * *',
    //   },
    // }),
    // defineRobotToken({
    //   name: 'classify-conversations-robot',
    //   label: 'Classify Conversations Robot',
    //   memberships: [
    //     {
    //       resourceType: 'project',
    //       resourceId: projectId,
    //       roleNames: ['editor'],
    //     },
    //   ],
    // }),
  ],
})
