import {HomeIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/**
 * UK Address schema. A structured object representing a postal address in the United Kingdom.
 */
export const address = defineType({
  name: 'address',
  title: 'Address',
  icon: HomeIcon,
  type: 'object',
  fields: [
    defineField({
      name: 'line1',
      title: 'Address Line 1',
      description: 'Building number/name and street, e.g. "10 Downing Street"',
      type: 'string',
      validation: (rule) => rule.required().error('Address line 1 is required'),
    }),
    defineField({
      name: 'line2',
      title: 'Address Line 2',
      description: 'Flat, suite, locality, or other secondary address information',
      type: 'string',
    }),
    defineField({
      name: 'town',
      title: 'Town / City',
      type: 'string',
      validation: (rule) => rule.required().error('Town or city is required'),
    }),
    defineField({
      name: 'county',
      title: 'County',
      description: 'Optional administrative county, e.g. "Greater London"',
      type: 'string',
    }),
    defineField({
      name: 'postcode',
      title: 'Postcode',
      type: 'string',
      validation: (rule) =>
        rule
          .required()
          .regex(
            /^([A-Z]{1,2}\d[A-Z\d]?|ASCN|STHL|TDCU|BBND|[BFS]IQQ|PCRN|TKCA) ?\d[A-Z]{2}$/i,
            {name: 'UK postcode'},
          )
          .error('A valid UK postcode is required'),
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      options: {
        list: [
          {title: 'England', value: 'England'},
          {title: 'Scotland', value: 'Scotland'},
          {title: 'Wales', value: 'Wales'},
          {title: 'Northern Ireland', value: 'Northern Ireland'},
        ],
        layout: 'radio',
      },
      initialValue: 'England',
      validation: (rule) => rule.required().error('Country is required'),
    }),
  ],
  preview: {
    select: {
      line1: 'line1',
      town: 'town',
      postcode: 'postcode',
    },
    prepare({line1, town, postcode}) {
      return {
        title: line1 || 'Untitled address',
        subtitle: [town, postcode].filter(Boolean).join(', '),
      }
    },
  },
})
