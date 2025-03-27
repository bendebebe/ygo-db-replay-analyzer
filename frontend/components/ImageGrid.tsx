import Image from "next/image"
import { DeckImage } from "@/app/deck/page"

export default function ImageGrid({ images }: { images: DeckImage[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <div key={image.id} className="aspect-square relative">
          <Image
            src={image.url || "/placeholder.svg"}
            alt={`Grid image ${image.id}`}
            fill
            className="object-cover rounded-lg"
          />
        </div>
      ))}
    </div>
  )
}

