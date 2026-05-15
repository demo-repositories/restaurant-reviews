import {TagIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/**
 * Tag schema. A descriptive tag that can be applied to a restaurant.
 */
export const tag = defineType({
  name: 'tag',
  title: 'Tag',
  icon: TagIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required().error('A tag must have a name'),
    }),
  ],
  preview: {
    select: {title: 'name'},
  },
})
