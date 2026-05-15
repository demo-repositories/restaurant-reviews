import {at, append, defineMigration, setIfMissing, unset} from 'sanity/migrate'

/**
 * Migrate the legacy single `location` reference on `restaurant` documents
 * into the new `locations` array of references, then remove the old field.
 *
 * Run with:
 *   npx sanity migration run locationToLocations           # dry run
 *   npx sanity migration run locationToLocations --no-dry-run
 */
export default defineMigration({
  title: 'Convert restaurant.location (reference) to restaurant.locations (array of references)',
  documentTypes: ['restaurant'],
  filter: 'defined(location) && !defined(locations)',
  migrate: {
    document(restaurant) {
      return [
        at('locations', setIfMissing([])),
        at('locations', append(restaurant.location)),
        at('location', unset()),
      ]
    },
  },
})
