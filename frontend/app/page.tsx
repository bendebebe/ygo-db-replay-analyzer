import { redirect } from 'next/navigation'

export default function Home(): JSX.Element {
  redirect('/replay-recorder')
}

