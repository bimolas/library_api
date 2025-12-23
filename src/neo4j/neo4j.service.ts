import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import neo4j, { Driver } from "neo4j-driver";
const NEO4J_URI = process.env.NEO4J_URI || "neo4j://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "password";
@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: Driver;
  session: any;

  async onModuleInit() {
    this.driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
    );

    this.session = this.driver.session();
    await this.verifyConnection();
    await this.initializeConstraints();
    console.log("✅ Connected to Neo4j (Docker)");
  }

  private async verifyConnection() {
    try {
      const result = await this.session.run("RETURN 1");
      console.log("Neo4j connection verified");
    } catch (error) {
      console.error("Failed to connect to Neo4j:", error);
      throw error;
    }
  }

  private async initializeConstraints() {
    const constraints = [
      "CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (b:Book) REQUIRE b.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (bc:BookCopy) REQUIRE bc.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE",
    ];

    for (const constraint of constraints) {
      await this.session.run(constraint);
    }
  }

  async run(query: string, params: Record<string, any> = {}) {
    const result = await this.session.run(query, params);
    return result;
  }

  async read(query: string, params: Record<string, any> = {}) {
    const session = this.driver.session({
      defaultAccessMode: neo4j.session.READ,
    });
    try {
       const normalizedParams = { ...params };
      if (normalizedParams.skip !== undefined && normalizedParams.skip !== null) {
        normalizedParams.skip = neo4j.int(Number(normalizedParams.skip));
      }
      if (normalizedParams.limit !== undefined && normalizedParams.limit !== null) {
        normalizedParams.limit = neo4j.int(Number(normalizedParams.limit));
      }
      const result = await session.run(query, normalizedParams);
      return result;
    } finally {
      await session.close();
    }
  }

  async write(query: string, params: Record<string, any> = {}) {
    const session = this.driver.session({
      defaultAccessMode: neo4j.session.WRITE,
    });
    try {
      return await session.run(query, params);
    } finally {
      await session.close();
    }
  }

  async onModuleDestroy() {
    await this.session.close();
    await this.driver.close();
  }

  getDriver(): Driver {
    return this.driver;
  }
}
