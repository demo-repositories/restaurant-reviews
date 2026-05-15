import {EarthGlobeIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/**
 * Location schema. Define fields for the 'location' content type.
 */

export const location = defineType({
  name: 'location',
  title: 'Location',
  icon: EarthGlobeIcon,
  type: 'document',
  fields: [
  

    defineField({
      name: 'latitude',
      title: 'Latitude',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'longitude',
      title: 'Longitude',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'address',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'address.line1',
      subtitle: 'address.town',
    },
  },
})
