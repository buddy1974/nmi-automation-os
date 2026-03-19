import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

// Author model has no companyId — authors are global

export default async function AuthorsPage() {
  const authors = await prisma.author.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <div>
      <h1>Authors</h1>
      <p>{authors.length} author{authors.length !== 1 ? "s" : ""}</p>

      {authors.length === 0 ? (
        <p>No authors recorded</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {authors.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.phone || "—"}</td>
                <td>{a.email || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
