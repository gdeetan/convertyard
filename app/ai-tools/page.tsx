import { CategoryPage } from '@/components/category-page/category-page'
import { CATEGORY_META } from '@/content/category-meta'
import { toolsByCategory } from '@/content/tool-catalog'

export default function AiToolsPage() {
  return <CategoryPage meta={CATEGORY_META['ai-tools']} tools={toolsByCategory('ai-tools')} />
}
