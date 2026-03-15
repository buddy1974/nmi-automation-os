export type Product = {
  id: string
  title: string
  class: string
  subject: string
  price: number
  stock: number
}

export const products: Product[] = [
  {
    id: "book-001",
    title: "Mathematics Primary 1",
    class: "Primary 1",
    subject: "Mathematics",
    price: 2500,
    stock: 120
  },
  {
    id: "book-002",
    title: "English Primary 1",
    class: "Primary 1",
    subject: "English",
    price: 2500,
    stock: 95
  },
  {
    id: "book-003",
    title: "Science Primary 2",
    class: "Primary 2",
    subject: "Science",
    price: 3000,
    stock: 80
  }
]
