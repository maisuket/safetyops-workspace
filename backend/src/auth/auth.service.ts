import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, timingSafeEqual } from 'crypto';

// Compara duas strings em tempo constante (evita vazar, pelo tempo de resposta,
// quantos caracteres iniciais da senha estão corretos).
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Ainda compara contra algo do mesmo tamanho para não retornar instantaneamente
    timingSafeEqual(bufA, randomBytes(bufA.length));
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private validUsername!: string;
  private validPassword!: string;

  constructor(private readonly jwtService: JwtService) {}

  onModuleInit() {
    // Nunca usar credenciais padrão embutidas no código: se as variáveis de
    // ambiente não estiverem definidas, a aplicação recusa iniciar em vez de
    // silenciosamente aceitar um usuário/senha previsível.
    const username = process.env.AUTH_USERNAME;
    const password = process.env.AUTH_PASSWORD;

    if (!username || !password) {
      throw new Error(
        'AUTH_USERNAME e AUTH_PASSWORD precisam estar definidos no .env. ' +
          'A aplicação não inicia com credenciais padrão por segurança.',
      );
    }

    this.validUsername = username;
    this.validPassword = password;
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const isValid =
      safeEqual(username, this.validUsername) &&
      safeEqual(password, this.validPassword);

    if (!isValid) {
      this.logger.warn(`Tentativa de login inválida para o usuário: ${username}`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const payload = { sub: 'itam-admin', username };
    const token = this.jwtService.sign(payload);

    this.logger.log(`Login bem-sucedido: ${username}`);
    return { access_token: token };
  }
}
