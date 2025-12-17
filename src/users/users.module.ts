import { Module } from "@nestjs/common"
import { UsersService } from "./users.service"
import { UsersController } from "./users.controller"
import { Neo4jModule } from "../neo4j/neo4j.module"
import { ScoreModule } from "../score/score.module"

@Module({
  imports: [Neo4jModule, ScoreModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
