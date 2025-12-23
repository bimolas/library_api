import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const AuthenticatedUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // JwtAuthGuard / Passport strategy should have set this
    return data ? (user ? user[data] : undefined) : user;
  },
);