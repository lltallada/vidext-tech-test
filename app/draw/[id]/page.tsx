import TldrawPage from '@/app/components/TldrawPage'

export default function Page({ params }: { params: { id: string } }) {
  return <TldrawPage designId={params.id} />
}
