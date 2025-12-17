import { Module } from "@nestjs/common"
import { ScoreService } from "./score.service"
import { Neo4jModule } from "../neo4j/neo4j.module"

@Module({
  imports: [Neo4jModule],
  providers: [ScoreService],
  exports: [ScoreService],
})
export class ScoreModule {}
