import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService) {}

  async login(
    username: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const validUsername = process.env.AUTH_USERNAME || 'admin';
    const validPassword = process.env.AUTH_PASSWORD || 'itam@2024';

    if (username !== validUsername || password !== validPassword) {
      this.logger.warn(`Tentativa de login inválida para o usuário: ${username}`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const payload = { sub: 'itam-admin', username };
    const token = this.jwtService.sign(payload);

    this.logger.log(`Login bem-sucedido: ${username}`);
    return { access_token: token };
  }
}
