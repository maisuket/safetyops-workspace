import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Carrega as variáveis de ambiente antes da inicialização
dotenv.config();

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  /**
   * =============================
   * 🔐 FIREBASE ADMIN INIT
   * =============================
   */
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawKey
    ? rawKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '').trim()
    : undefined;

  try {
    if (
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_CLIENT_EMAIL ||
      !privateKey
    ) {
      logger.warn(
        'Variáveis de ambiente do Firebase incompletas. A autenticação poderá falhar.',
      );
    } else {
      const serviceAccount: admin.ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      };

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        logger.log('✅ Firebase Admin inicializado com sucesso.');
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Erro ao inicializar Firebase Admin: ${errorMessage}`);
  }

  // Criação da aplicação NestJS
  const app = await NestFactory.create(AppModule);

  /**
   * =============================
   * 🛠 CONFIGURAÇÕES GLOBAIS
   * =============================
   */

  // Habilita CORS para permitir a ligação do Frontend React
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Define o prefixo global /api (Ex: http://localhost:3000/api/records)
  app.setGlobalPrefix('api');

  // Habilita validação e transformação automática de DTOs globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades que não estão no DTO
      forbidNonWhitelisted: true, // Lança erro se enviarem propriedades não mapeadas
      transform: true, // Transforma automaticamente os payloads nos tipos dos DTOs
    }),
  );

  // Habilita os hooks de encerramento (essencial para o onModuleDestroy do PrismaService)
  app.enableShutdownHooks();

  // // Aplica filtros e intercetores globais
  // app.useGlobalFilters(new PrismaExceptionFilter());
  // app.useGlobalInterceptors(new TransformInterceptor());

  /**
   * =============================
   * 📚 SWAGGER (Documentação)
   * =============================
   */
  const config = new DocumentBuilder()
    .setTitle('SafetyOps API')
    .setDescription('Documentação da API do sistema de ItSafetyOps')
    .setVersion('1.0')
    .addBearerAuth() // Permite testar rotas protegidas pelo Firebase JWT diretamente no Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Disponibiliza o Swagger no endpoint /docs
  SwaggerModule.setup('docs', app, document);

  /**
   * =============================
   * 🚀 INICIALIZAÇÃO DO SERVIDOR
   * =============================
   */
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');

  const url = await app.getUrl();
  logger.log(`🚀 API a correr em: ${url}/api`);
  logger.log(`📚 Documentação (Swagger) disponível em: ${url}/docs`);
}

bootstrap().catch((err) => {
  console.error('Erro crítico ao iniciar a aplicação:', err);
  process.exit(1);
});
