import {StarIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/**
 * Feature schema. An amenity or feature offered by a restaurant.
 */
export const feature = defineType({
  name: 'feature',
  title: 'Feature',
  icon: StarIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required().error('A feature must have a name'),
    }),
  ],
  preview: {
    select: {title: 'name'},
  },
})
