import { Module } from "@nestjs/common"
import { BorrowingService } from "./borrowing.service"
import { BorrowingController } from "./borrowing.controller"
import { Neo4jModule } from "../neo4j/neo4j.module"
import { ScoreModule } from "../score/score.module"
import { BooksModule } from "../books/books.module"

@Module({
  imports: [Neo4jModule, ScoreModule, BooksModule],
  providers: [BorrowingService],
  controllers: [BorrowingController],
  exports: [BorrowingService],
})
export class BorrowingModule {}
