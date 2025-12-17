import { Module } from "@nestjs/common"
import { AnalyticsService } from "./analytics.service"
import { AnalyticsController } from "./analytics.controller"
import { Neo4jModule } from "../neo4j/neo4j.module"

@Module({
  imports: [Neo4jModule],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
