import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {agentContextPlugin} from '@sanity/agent-context/studio'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'restaurant',

  projectId: 's6y3amel',
  dataset: 'production',

  plugins: [structureTool(), visionTool(), agentContextPlugin()],

  schema: {
    types: schemaTypes,
  },
})
