import { NestFactory } from "@nestjs/core"
import { ValidationPipe, ClassSerializerInterceptor } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"
import { join } from "path"
import * as express from "express"
const uploadPath = join(process.cwd(), "uploads")

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use("/uploads", express.static(uploadPath))

  app.setGlobalPrefix("api")
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get("Reflector")))
  app.enableCors()

  const config = new DocumentBuilder()
    .setTitle("Library Management API")
    .setDescription("Neo4j-powered REST API for library management system")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("docs", app, document)

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))



  const port = process.env.PORT || 3000
  await app.listen(port)
  console.log(`Application is running on: http://localhost:${port}`)
}

bootstrap()
