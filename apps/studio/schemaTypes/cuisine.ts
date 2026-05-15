import {IceCreamIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/**
 * Cuisine schema. A type of cuisine a restaurant serves.
 */
export const cuisine = defineType({
  name: 'cuisine',
  title: 'Cuisine',
  icon: IceCreamIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required().error('A cuisine must have a name'),
    }),
  ],
  preview: {
    select: {title: 'name'},
  },
})
