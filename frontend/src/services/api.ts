/**
 * src/services/api.ts
 * Configuração central do cliente HTTP.
 * Centralizamos a URL base e a injeção de Headers (como o Token de Autenticação)
 * para não repetirmos isso em cada requisição.
 */

// URL base do nosso backend NestJS (ajuste a porta se necessário)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface FetchOptions extends RequestInit {
  data?: any;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const { data, headers, ...customConfig } = options;

    // Recupera o token de sessão/Firebase (se existir)
    const token = localStorage.getItem("itam_auth_token");

    const config: RequestInit = {
      ...customConfig,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      // Tratamento de erros HTTP padronizado
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Erro na requisição: ${response.status}`,
        );
      }

      // Evita erro ao tentar fazer parse de respostas vazias (ex: 204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error);
      throw error;
    }
  }

  // Métodos utilitários fortemente tipados
  public get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public post<T>(
    endpoint: string,
    data: any,
    options?: FetchOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "POST", data });
  }

  public put<T>(
    endpoint: string,
    data: any,
    options?: FetchOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PUT", data });
  }

  public delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient();
