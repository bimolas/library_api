"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BorrowingModule = void 0;
const common_1 = require("@nestjs/common");
const borrowing_service_1 = require("./borrowing.service");
const borrowing_controller_1 = require("./borrowing.controller");
const neo4j_module_1 = require("../neo4j/neo4j.module");
const score_module_1 = require("../score/score.module");
const books_module_1 = require("../books/books.module");
let BorrowingModule = class BorrowingModule {
};
exports.BorrowingModule = BorrowingModule;
exports.BorrowingModule = BorrowingModule = __decorate([
    (0, common_1.Module)({
        imports: [neo4j_module_1.Neo4jModule, score_module_1.ScoreModule, books_module_1.BooksModule],
        providers: [borrowing_service_1.BorrowingService],
        controllers: [borrowing_controller_1.BorrowingController],
        exports: [borrowing_service_1.BorrowingService],
    })
], BorrowingModule);
