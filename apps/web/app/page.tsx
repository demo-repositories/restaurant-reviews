import {loadAppData} from '@/sanity/data'
import RestaurantApp from '@/components/RestaurantApp'

export const revalidate = 300

export default async function Home() {
  const {restaurants, cuisines, tags, features} = await loadAppData()

  return (
    <RestaurantApp restaurants={restaurants} cuisines={cuisines} tags={tags} features={features} />
  )
}
