import { CategoryPage } from '@/components/category-page/category-page'
import { CATEGORY_META } from '@/content/category-meta'
import { toolsByCategory } from '@/content/tool-catalog'

export default function ImageEditingPage() {
  return <CategoryPage meta={CATEGORY_META['image-editing']} tools={toolsByCategory('image-editing')} />
}
