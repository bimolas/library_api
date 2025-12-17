import {
  Injectable,
  type OnModuleInit,
  type OnModuleDestroy,
} from "@nestjs/common";
import * as neo4j from "neo4j-driver";

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: any;
  private session: any;

  async onModuleInit() {
    const uri = process.env.NEO4J_URI || "neo4j+s://4c757ba2.databases.neo4j.io";
    const user = process.env.NEO4J_USER || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "0dZ6dfI8v4osa_uuI_9X9qp04EvGToajdp2DHVAh3bw";

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    this.session = this.driver.session();

    await this.verifyConnection();
    await this.initializeConstraints();
  }

  async onModuleDestroy() {
    await this.session.close();
    await this.driver.close();
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
      return await session.run(query, params);
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
}
