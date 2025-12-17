import { type OnModuleInit, type OnModuleDestroy } from "@nestjs/common";
export declare class Neo4jService implements OnModuleInit, OnModuleDestroy {
    private driver;
    private session;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private verifyConnection;
    private initializeConstraints;
    run(query: string, params?: Record<string, any>): Promise<any>;
    read(query: string, params?: Record<string, any>): Promise<any>;
    write(query: string, params?: Record<string, any>): Promise<any>;
}
