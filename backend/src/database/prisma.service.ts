import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Passamos configurações adicionais para o PrismaClient se necessário (ex: logs de query em dev)
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  /**
   * Executado automaticamente quando o módulo é inicializado.
   * Estabelece a ligação com a base de dados de forma assíncrona.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log(
        'Ligação à base de dados estabelecida com sucesso via Prisma.',
      );
    } catch (error) {
      this.logger.error(
        'Falha ao ligar à base de dados',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Executado automaticamente quando a aplicação é encerrada.
   * Garante que as ligações pendentes são fechadas de forma graciosa.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Ligação à base de dados encerrada com segurança.');
  }
}
