/**
 * TypeScript Resource API (TRA) - HTTP客户端
 * 提供统一的HTTP请求处理，消除重复代码
 */

import { RequestOptions, ResourceConfig, TRAError } from "./types";
import { getResourceConfig } from "./config";

/**
 * 统一的HTTP客户端类
 */
export class HttpClient {
  private config: Required<ResourceConfig>;

  constructor(userConfig?: Partial<ResourceConfig>) {
    // 使用配置管理获取完整配置
    this.config = getResourceConfig(userConfig);
  }

  /**
   * 执行HTTP请求
   */
  async request<T>(options: RequestOptions): Promise<T> {
    const { method, url, headers, body, timeout } = options;

    try {
      const response = await fetch(url, {
        method,
        headers: { ...this.config.headers, ...headers },
        body,
        signal: timeout
          ? AbortSignal.timeout(timeout || this.config.timeout)
          : undefined,
      });

      if (!response.ok) {
        throw new TRAError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          url,
        );
      }

      // DELETE操作可能没有响应体
      if (method === "DELETE") {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TRAError) {
        throw error;
      }

      // 网络错误或其他错误
      throw new TRAError(
        error instanceof Error ? error.message : "Unknown error",
        undefined,
        undefined,
        url,
      );
    }
  }

  /**
   * GET请求
   */
  async get<T>(url: string): Promise<T> {
    return this.request<T>({
      method: "GET",
      url: this.buildUrl(url),
      headers: {},
    });
  }

  /**
   * POST请求
   */
  async post<T>(url: string, data: any): Promise<T> {
    return this.request<T>({
      method: "POST",
      url: this.buildUrl(url),
      headers: {},
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT请求
   */
  async put<T>(url: string, data: any): Promise<T> {
    return this.request<T>({
      method: "PUT",
      url: this.buildUrl(url),
      headers: {},
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH请求
   */
  async patch<T>(url: string, data: any): Promise<T> {
    return this.request<T>({
      method: "PATCH",
      url: this.buildUrl(url),
      headers: {},
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE请求
   */
  async delete(url: string): Promise<void> {
    return this.request<void>({
      method: "DELETE",
      url: this.buildUrl(url),
      headers: {},
    });
  }

  /**
   * 构建完整URL - 修正：支持相对路径
   */
  private buildUrl(path: string): string {
    // 如果baseUrl为空，直接返回相对路径
    if (!this.config.baseUrl) {
      return path;
    }
    // 如果配置了baseUrl，则拼接完整URL（用于跨域场景）
    return `${this.config.baseUrl}${path}`;
  }
}
