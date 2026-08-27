import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const ORIGINAL_ENV = process.env;

  beforeEach(async () => {
    process.env = {
      ...ORIGINAL_ENV,
      AUTH_USERNAME: 'admin',
      AUTH_PASSWORD: 'senha-forte-de-teste',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('fake-token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('recusa iniciar se AUTH_USERNAME não estiver definido', () => {
    delete process.env.AUTH_USERNAME;
    expect(() => service.onModuleInit()).toThrow();
  });

  it('recusa iniciar se AUTH_PASSWORD não estiver definido', () => {
    delete process.env.AUTH_PASSWORD;
    expect(() => service.onModuleInit()).toThrow();
  });

  it('nunca usa as antigas credenciais hardcoded (admin/itam@2024) como fallback', async () => {
    process.env.AUTH_USERNAME = 'outro-usuario';
    process.env.AUTH_PASSWORD = 'outra-senha';
    service.onModuleInit();

    await expect(service.login('admin', 'itam@2024')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('autentica com sucesso quando usuário e senha batem com o .env', async () => {
    service.onModuleInit();

    const result = await service.login('admin', 'senha-forte-de-teste');

    expect(result.access_token).toBe('fake-token');
  });

  it('rejeita senha incorreta', async () => {
    service.onModuleInit();

    await expect(service.login('admin', 'errada')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita usuário incorreto', async () => {
    service.onModuleInit();

    await expect(
      service.login('outro-usuario', 'senha-forte-de-teste'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
