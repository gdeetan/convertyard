import { CategoryPage } from '@/components/category-page/category-page'
import { CATEGORY_META } from '@/content/category-meta'
import { toolsByCategory } from '@/content/tool-catalog'

export default function DeveloperPage() {
  return <CategoryPage meta={CATEGORY_META['developer']} tools={toolsByCategory('developer')} />
}
