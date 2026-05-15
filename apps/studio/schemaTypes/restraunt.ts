import {DocumentTextIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType, useCurrentUser} from 'sanity'

/**
 * Restaurant schema. Define and edit the fields for the 'restaurant' content type.
 */
export const restaurant = defineType({
  name: 'restaurant',
  title: 'Restaurant',
  icon: DocumentTextIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'restaurant_name',
      title: 'Restaurant Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      options: {},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'review',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'locations',
      title: 'Locations',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'location'}]})],
    }),
    defineField({
      name: 'avg_rating',
      title: 'Average Rating',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'default_language',
      title: 'Default Language',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gluten_free',
      title: 'Gluten Free',
      type: 'boolean',
    }),
    defineField({
      name: 'cuisines',
      title: 'Cuisines',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'cuisine'}]})],
    }),
    defineField({
      name: 'top_tags',
      title: 'Top Tags',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'tag'}]})],
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'feature'}]})],
    }),
    // ... omitted for brevity
  ],
})
