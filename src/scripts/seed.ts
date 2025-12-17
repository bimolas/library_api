import * as neo4j from "neo4j"

async function seed() {
  const uri = process.env.NEO4J_URI || "bolt://localhost:7687"
  const user = process.env.NEO4J_USER || "neo4j"
  const password = process.env.NEO4J_PASSWORD || "password"

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  const session = driver.session()

  try {
    console.log("Starting seed...")

    // Create genres
    const genres = ["Fiction", "Science", "History", "Mystery", "Romance", "Technology"]
    for (const genre of genres) {
      await session.run("CREATE (g:Genre { name: $name, createdAt: datetime() })", { name: genre })
    }
    console.log("Created genres")

    // Create admin user
    await session.run(`
      CREATE (u:User {
        id: 'admin-001',
        email: 'admin@library.com',
        name: 'Admin User',
        password: '$2a$10$encrypted_password_here',
        role: 'ADMIN',
        score: 500,
        tier: 'DIAMOND',
        createdAt: datetime()
      })
    `)
    console.log("Created admin user")

    // Create regular users
    for (let i = 1; i <= 5; i++) {
      await session.run(
        `
        CREATE (u:User {
          id: $id,
          email: $email,
          name: $name,
          password: '$2a$10$encrypted_password_here',
          role: 'USER',
          score: $score,
          tier: $tier,
          createdAt: datetime()
        })
      `,
        {
          id: `user-${i}`,
          email: `user${i}@example.com`,
          name: `User ${i}`,
          score: Math.random() * 300,
          tier: ["BRONZE", "SILVER", "GOLD", "DIAMOND"][Math.floor(Math.random() * 4)],
        },
      )
    }
    console.log("Created users")

    // Create books
    const bookSamples = [
      { title: "1984", author: "George Orwell", isbn: "978-0451524935", genre: "Fiction" },
      { title: "Dune", author: "Frank Herbert", isbn: "978-0441172719", genre: "Science" },
      { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "978-0547928227", genre: "Fiction" },
    ]

    for (const book of bookSamples) {
      const bookId = `book-${book.title.replace(/\s+/g, "-").toLowerCase()}`
      await session.run(
        `
        MATCH (g:Genre { name: $genre })
        CREATE (b:Book {
          id: $id,
          title: $title,
          author: $author,
          isbn: $isbn,
          description: 'A classic book',
          publicationYear: 2000,
          createdAt: datetime()
        })
        CREATE (b)-[:BELONGS_TO]->(g)
      `,
        {
          id: bookId,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          genre: book.genre,
        },
      )

      // Add copies
      for (let i = 0; i < 3; i++) {
        await session.run(
          `
          MATCH (b:Book { id: $bookId })
          CREATE (bc:BookCopy {
            id: $copyId,
            status: 'AVAILABLE',
            createdAt: datetime()
          })
          CREATE (b)-[:HAS_COPY]->(bc)
        `,
          {
            bookId,
            copyId: `${bookId}-copy-${i + 1}`,
          },
        )
      }
    }
    console.log("Created books and copies")

    console.log("Seed completed successfully!")
  } catch (error) {
    console.error("Seed failed:", error)
  } finally {
    await session.close()
    await driver.close()
  }
}

seed()
