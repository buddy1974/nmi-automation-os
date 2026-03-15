export type Product = {
  id: string
  code: string
  title: string
  level: string
  class: string
  subject: string
  price: number
  stock: number
}

export const products: Product[] = [
  {
    id: "p1-math-01",
    code: "P1-MATH",
    title: "Mathematics Primary 1",
    level: "Primary",
    class: "Primary 1",
    subject: "Mathematics",
    price: 2500,
    stock: 120
  },
  {
    id: "p1-eng-01",
    code: "P1-ENG",
    title: "English Primary 1",
    level: "Primary",
    class: "Primary 1",
    subject: "English",
    price: 2500,
    stock: 95
  },
  {
    id: "p2-sci-01",
    code: "P2-SCI",
    title: "Science Primary 2",
    level: "Primary",
    class: "Primary 2",
    subject: "Science",
    price: 3000,
    stock: 80
  }
]
