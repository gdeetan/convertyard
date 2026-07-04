import { CategoryPage } from '@/components/category-page/category-page'
import { CATEGORY_META } from '@/content/category-meta'
import { toolsByCategory } from '@/content/tool-catalog'

export const metadata = {
  title: CATEGORY_META['image-to-text'].seoTitle,
  description: CATEGORY_META['image-to-text'].seoDescription,
}

export default function ImageToTextPage() {
  return <CategoryPage meta={CATEGORY_META['image-to-text']} tools={toolsByCategory('image-to-text')} />
}
