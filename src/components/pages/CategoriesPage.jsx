// Página: todas las categorías.
import PageHeader from '../molecules/PageHeader'
import CategoryGrid from '../organisms/CategoryGrid'

export default function CategoriesPage({ categories, counts }) {
  return (
    <>
      <PageHeader title="Categorías" subtitle="Encuentra lo que necesitas para tu obra, por rubro." />
      <CategoryGrid categories={categories} counts={counts} />
    </>
  )
}
