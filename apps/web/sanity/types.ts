export type TaxonomyTerm = {
  _id: string
  name: string | null
}

export type UkAddress = {
  line1?: string | null
  line2?: string | null
  town?: string | null
  county?: string | null
  postcode?: string | null
  country?: string | null
}

export type RestaurantLocation = {
  _id: string
  city: string | null
  region: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  address: UkAddress | null
}

export type Restaurant = {
  _id: string
  restaurant_name: string | null
  avg_rating: number | null
  gluten_free: boolean | null
  locations: RestaurantLocation[]
  cuisines: TaxonomyTerm[]
  top_tags: TaxonomyTerm[]
  features: TaxonomyTerm[]
}
