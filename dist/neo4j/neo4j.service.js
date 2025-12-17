"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Neo4jService = void 0;
const common_1 = require("@nestjs/common");
const neo4j = __importStar(require("neo4j-driver"));
let Neo4jService = class Neo4jService {
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
            defaultAccessMode: neo4j.session.READ,
        });
        try {
            return await session.run(query, params);
        }
        finally {
            await session.close();
        }
    }
    async write(query, params = {}) {
        const session = this.driver.session({
            defaultAccessMode: neo4j.session.WRITE,
        });
        try {
            return await session.run(query, params);
        }
        finally {
            await session.close();
        }
    }
};
exports.Neo4jService = Neo4jService;
exports.Neo4jService = Neo4jService = __decorate([
    (0, common_1.Injectable)()
], Neo4jService);
