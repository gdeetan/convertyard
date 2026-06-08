import { CategoryPage } from '@/components/category-page/category-page'
import { CATEGORY_META } from '@/content/category-meta'
import { toolsByCategory } from '@/content/tool-catalog'

export default function ImagesPage() {
  return <CategoryPage meta={CATEGORY_META['images']} tools={toolsByCategory('images')} />
}
