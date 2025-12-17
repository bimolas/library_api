import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { Neo4jModule } from "./neo4j/neo4j.module"
import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { BooksModule } from "./books/books.module"
import { BorrowingModule } from "./borrowing/borrowing.module"
import { ReservationModule } from "./reservation/reservation.module"
import { AnalyticsModule } from "./analytics/analytics.module"
import { ScoreModule } from "./score/score.module"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    Neo4jModule,
    AuthModule,
    UsersModule,
    BooksModule,
    BorrowingModule,
    ReservationModule,
    AnalyticsModule,
    ScoreModule,
  ],
})
export class AppModule {}
