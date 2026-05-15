import {defineQuery} from 'next-sanity'

export const RESTAURANTS_QUERY = defineQuery(`*[
  _type == "restaurant"
  && count(locations) > 0
]{
  _id,
  restaurant_name,
  avg_rating,
  gluten_free,
  "locations": locations[]->{
    _id,
    city,
    region,
    country,
    latitude,
    longitude,
    address
  },
  "cuisines": cuisines[]->{
    _id,
    name
  },
  "top_tags": top_tags[]->{
    _id,
    name
  },
  "features": features[]->{
    _id,
    name
  }
}`)

export const CUISINES_QUERY = defineQuery(`*[
  _type == "cuisine"
]{
  _id,
  name
} | order(name asc)`)

export const TAGS_QUERY = defineQuery(`*[
  _type == "tag"
]{
  _id,
  name
} | order(name asc)`)

export const FEATURES_QUERY = defineQuery(`*[
  _type == "feature"
]{
  _id,
  name
} | order(name asc)`)

export const SEARCH_QUERY = defineQuery(`
*[_type == "restaurant"] | score(
    restaurant_name match $q
) [0...100] {
  _id,
  restaurant_name,
  avg_rating,
  gluten_free,
  "locations": locations[]->{
    _id,
    city,
    region,
    country,
    latitude,
    longitude,
    address
  },
  "cuisines": cuisines[]->{
    _id,
    name
  },
  "top_tags": top_tags[]->{
    _id,
    name
  },
  "features": features[]->{
    _id,
    name
  }
}`)
