import { Module } from "@nestjs/common"
import { ReservationService } from "./reservation.service"
import { ReservationController } from "./reservation.controller"
import { Neo4jModule } from "../neo4j/neo4j.module"
import { ScoreModule } from "../score/score.module"

@Module({
  imports: [Neo4jModule, ScoreModule],
  providers: [ReservationService],
  controllers: [ReservationController],
  exports: [ReservationService],
})
export class ReservationModule {}
