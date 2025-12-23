"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticatedUser = void 0;
const common_1 = require("@nestjs/common");
exports.AuthenticatedUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // JwtAuthGuard / Passport strategy should have set this
    return data ? (user ? user[data] : undefined) : user;
});
