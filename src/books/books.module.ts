import { Module } from "@nestjs/common"
import { BooksService } from "./books.service"
import { BooksController } from "./books.controller"
import { Neo4jModule } from "../neo4j/neo4j.module"

@Module({
  imports: [Neo4jModule],
  providers: [BooksService],
  controllers: [BooksController],
  exports: [BooksService],
})
export class BooksModule {}
