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
exports.BooksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const books_service_1 = require("./books.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const role_guard_1 = require("../auth/guards/role.guard");
const create_book_dto_1 = require("./dto/create-book.dto");
const class_validator_1 = require("class-validator");
const authenticated_user_decorator_1 = require("../utils/authenticated-user.decorator");
const Create_Comment_Dto_1 = require("./dto/Create-Comment.Dto");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
class AddCopiesDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddCopiesDto.prototype, "quantity", void 0);
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
let BooksController = class BooksController {
    constructor(booksService) {
        this.booksService = booksService;
    }
    async createBook(createBookDto, file) {
        if (!file)
            throw new common_1.BadRequestException("No file uploaded");
        const avatarPath = `${BASE_URL}/uploads/books/${file.filename}`;
        createBookDto.coverImage = avatarPath;
        return this.booksService.createBook(createBookDto);
    }
    async updateBook(bookId, updateBookDto, file) {
        console.log("Updating book with ID:", bookId);
        if (file) {
            const avatarPath = `${BASE_URL}/uploads/books/${file.filename}`;
            updateBookDto.coverImage = avatarPath;
        }
        return this.booksService.updateBook(bookId, updateBookDto);
    }
    async addCopies(bookId, body) {
        return this.booksService.addBookCopy(bookId, body.quantity);
    }
    async deleteBook(bookId) {
        return this.booksService.deleteBook(bookId);
    }
    async deleteBookCopies(bookId, quantity) {
        return this.booksService.removeBookCopies(bookId, quantity);
    }
    async searchBooks(query, limit = 20, skip = 0) {
        return this.booksService.searchBooks(query, limit, skip);
    }
    async getBook(id) {
        return this.booksService.getBook(id);
    }
    async addComment(bookId, user, body) {
        return this.booksService.createComment(bookId, user.userId, body.message, body.rating);
    }
    async getComments(bookId) {
        return this.booksService.getComments(bookId);
    }
};
exports.BooksController = BooksController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Create a new book (admin only)" }),
    (0, swagger_1.ApiBody)({
        type: create_book_dto_1.CreateBookDto,
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        storage: (0, multer_1.diskStorage)({
            destination: "./uploads/books",
            filename: (_req, file, cb) => {
                const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${(0, path_1.extname)(file.originalname)}`;
                cb(null, unique);
            },
        }),
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_book_dto_1.CreateBookDto, Object]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "createBook", null);
__decorate([
    (0, common_1.Put)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Update a book (admin only)" }),
    (0, swagger_1.ApiBody)({
        type: create_book_dto_1.CreateBookDto,
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        storage: (0, multer_1.diskStorage)({
            destination: "./uploads/books",
            filename: (_req, file, cb) => {
                const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${(0, path_1.extname)(file.originalname)}`;
                cb(null, unique);
            },
        }),
    })),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_book_dto_1.CreateBookDto, Object]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "updateBook", null);
__decorate([
    (0, common_1.Post)(":id/copies"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Add copies to a book (admin only)" }),
    (0, swagger_1.ApiBody)({
        type: AddCopiesDto,
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AddCopiesDto]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "addCopies", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Delete a book (admin only)" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "deleteBook", null);
__decorate([
    (0, common_1.Delete)(":id/copies"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Delete copies of a book (admin only)" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("quantity")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "deleteBookCopies", null);
__decorate([
    (0, common_1.Get)("search"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiQuery)({ name: "q", required: true }),
    (0, swagger_1.ApiOperation)({ summary: "Search books by title, author, or ISBN" }),
    __param(0, (0, common_1.Query)("q")),
    __param(1, (0, common_1.Query)("limit")),
    __param(2, (0, common_1.Query)("skip")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "searchBooks", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Get book details" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "getBook", null);
__decorate([
    (0, common_1.Post)(":id/comments"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("access-token"),
    (0, swagger_1.ApiOperation)({ summary: "Add a comment/review to a book" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, authenticated_user_decorator_1.AuthenticatedUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Create_Comment_Dto_1.CreateCommentDto]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "addComment", null);
__decorate([
    (0, common_1.Get)(":id/comments"),
    (0, swagger_1.ApiOperation)({ summary: "Get all comments for a book" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "getComments", null);
exports.BooksController = BooksController = __decorate([
    (0, swagger_1.ApiTags)("Books"),
    (0, common_1.Controller)("books"),
    __metadata("design:paramtypes", [books_service_1.BooksService])
], BooksController);
