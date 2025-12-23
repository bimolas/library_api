import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Driver } from "neo4j-driver";
export declare class Neo4jService implements OnModuleInit, OnModuleDestroy {
    private driver;
    session: any;
    onModuleInit(): Promise<void>;
    private verifyConnection;
    private initializeConstraints;
    run(query: string, params?: Record<string, any>): Promise<any>;
    read(query: string, params?: Record<string, any>): Promise<import("neo4j-driver").QueryResult<import("neo4j-driver").RecordShape>>;
    write(query: string, params?: Record<string, any>): Promise<import("neo4j-driver").QueryResult<import("neo4j-driver").RecordShape>>;
    onModuleDestroy(): Promise<void>;
    getDriver(): Driver;
}
