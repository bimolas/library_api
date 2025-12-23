"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Neo4jService = void 0;
const common_1 = require("@nestjs/common");
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const NEO4J_URI = process.env.NEO4J_URI || "neo4j://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "password";
let Neo4jService = class Neo4jService {
    async onModuleInit() {
        this.driver = neo4j_driver_1.default.driver(NEO4J_URI, neo4j_driver_1.default.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
        this.session = this.driver.session();
        await this.verifyConnection();
        await this.initializeConstraints();
        console.log("✅ Connected to Neo4j (Docker)");
    }
    async verifyConnection() {
        try {
            const result = await this.session.run("RETURN 1");
            console.log("Neo4j connection verified");
        }
        catch (error) {
            console.error("Failed to connect to Neo4j:", error);
            throw error;
        }
    }
    async initializeConstraints() {
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
    async run(query, params = {}) {
        const result = await this.session.run(query, params);
        return result;
    }
    async read(query, params = {}) {
        const session = this.driver.session({
            defaultAccessMode: neo4j_driver_1.default.session.READ,
        });
        try {
            const normalizedParams = { ...params };
            if (normalizedParams.skip !== undefined && normalizedParams.skip !== null) {
                normalizedParams.skip = neo4j_driver_1.default.int(Number(normalizedParams.skip));
            }
            if (normalizedParams.limit !== undefined && normalizedParams.limit !== null) {
                normalizedParams.limit = neo4j_driver_1.default.int(Number(normalizedParams.limit));
            }
            const result = await session.run(query, normalizedParams);
            return result;
        }
        finally {
            await session.close();
        }
    }
    async write(query, params = {}) {
        const session = this.driver.session({
            defaultAccessMode: neo4j_driver_1.default.session.WRITE,
        });
        try {
            return await session.run(query, params);
        }
        finally {
            await session.close();
        }
    }
    async onModuleDestroy() {
        await this.session.close();
        await this.driver.close();
    }
    getDriver() {
        return this.driver;
    }
};
exports.Neo4jService = Neo4jService;
exports.Neo4jService = Neo4jService = __decorate([
    (0, common_1.Injectable)()
], Neo4jService);
