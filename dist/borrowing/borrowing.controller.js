"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BorrowingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const borrowing_service_1 = require("./borrowing.service");
const create_borrow_dto_1 = require("./dto/create-borrow.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let BorrowingController = class BorrowingController {
    constructor(borrowingService) {
        this.borrowingService = borrowingService;
    }
    async borrowBook(createBorrowDto, user) {
        return this.borrowingService.borrowBook(user.userId, createBorrowDto);
    }
    async returnBook(borrowId, user) {
        return this.borrowingService.returnBook(borrowId, user.userId);
    }
    async getUserBorrows(user) {
        return this.borrowingService.getUserBorrows(user.userId);
    }
    async getUserBorrowsById(id) {
        return this.borrowingService.getUserBorrows(id);
    }
    async getOverdueBooks(user) {
        return this.borrowingService.getOverdueBooks(user.userId);
    }
    async getNearbyLatestBorrows(user, tolerance, limit) {
        const tol = tolerance ? parseFloat(tolerance) : 10;
        const lim = limit ? parseInt(limit, 10) : 10;
        return this.borrowingService.getLatestBorrowsByNearbyScores(user.userId, tol, lim);
    }
    async getMonthlyStatsLast(months) {
        const m = months ? parseInt(months, 10) : 6;
        return this.borrowingService.getMonthlyBorrowStatsLastMonths(m);
    }
};
exports.BorrowingController = BorrowingController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Borrow a book" }),
    (0, swagger_1.ApiBody)({ type: create_borrow_dto_1.CreateBorrowDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_borrow_dto_1.CreateBorrowDto, Object]),
    __metadata("design:returntype", Promise)
], BorrowingController.prototype, "borrowBook", null);
__decorate([
    (0, common_1.Post)(":id/return"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Return a borrowed book" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BorrowingController.prototype, "returnBook", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Get user borrow history" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BorrowingController.prototype, "getUserBorrows", null);
__decorate([
    (0, common_1.Get)("user/:id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Get user borrow history" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BorrowingController.prototype, "getUserBorrowsById", null);
__decorate([
    (0, common_1.Get)("overdue"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Get overdue books" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BorrowingController.prototype, "getOverdueBooks", null);
__decorate([
    (0, common_1.Get)("nearby-latest"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({
        summary: "Get latest borrowings from users with score close to yours",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("tolerance")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], BorrowingController.prototype, "getNearbyLatestBorrows", null);
__decorate([
    (0, common_1.Get)("stats/monthly/last"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Monthly borrow stats for the past N months (default 6)" }),
    __param(0, (0, common_1.Query)("months")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BorrowingController.prototype, "getMonthlyStatsLast", null);
exports.BorrowingController = BorrowingController = __decorate([
    (0, swagger_1.ApiTags)("Borrowing"),
    (0, common_1.Controller)("borrowing"),
    __metadata("design:paramtypes", [borrowing_service_1.BorrowingService])
], BorrowingController);
