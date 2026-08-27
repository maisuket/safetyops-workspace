/**
 * Única fonte de verdade para o segredo do JWT. Nunca cair para um valor
 * padrão embutido no código — se a variável de ambiente não estiver
 * definida, a aplicação deve recusar iniciar em vez de aceitar tokens
 * assinados com um segredo público e previsível.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET precisa estar definido no .env. A aplicação não inicia ' +
        'com um segredo padrão por segurança.',
    );
  }
  return secret;
}
