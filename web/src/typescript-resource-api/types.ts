/**
 * TypeScript Resource API (TRA) - 类型定义
 * 统一管理所有TRA相关的类型定义
 */

/**
 * API路径配置
 */
export interface ApiPaths {
  resources: string    // 资源API路径前缀
  realtime: string     // 实时API路径前缀
}

/**
 * 基础配置接口
 */
export interface ResourceConfig {
  baseUrl?: string
  timeout?: number
  headers?: Record<string, string>
  // 扩展配置选项
  retries?: number
  retryDelay?: number
  // API路径配置
  apiPaths?: Partial<ApiPaths>
}

/**
 * HTTP请求选项
 */
export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  headers: Record<string, string>
  body?: string
  timeout?: number
}

/**
 * TRA错误类型
 */
export class TRAError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public url?: string
  ) {
    super(message)
    this.name = 'TRAError'
  }
}

/**
 * 排序方向
 */
export type SortDirection = 'ASC' | 'DESC'

/**
 * 排序字段配置
 */
export interface SortField {
  field: string
  direction: SortDirection
}

/**
 * 排序配置 - 相当于Spring Data的Sort
 */
export interface Sort {
  fields: SortField[]
}

/**
 * 分页请求参数 - 相当于Spring Data的Pageable
 */
export interface Pageable {
  page: number      // 页码，从0开始
  size: number      // 每页大小
  sort?: Sort       // 排序配置（可选）
}

/**
 * 分页响应结果 - 相当于Spring Data的Page<T>
 */
export interface Page<T> {
  content: T[]              // 当前页的数据
  totalElements: number     // 总记录数
  totalPages: number        // 总页数
  size: number              // 每页大小
  number: number            // 当前页码（从0开始）
  numberOfElements: number  // 当前页实际记录数
  first: boolean            // 是否第一页
  last: boolean             // 是否最后一页
  empty: boolean            // 是否为空页
}

/**
 * 基础Resource接口 - 相当于Spring Data JPA的CrudRepository<T, ID>
 * 明确区分：update=全量更新，patch=部分更新，都不包含id
 */
export interface Resource<T> {
  // 查询操作
  findAll(): Promise<T[]>
  findById(id: string): Promise<T | null>
  
  // 🆕 分页查询操作 - 参考Spring Data JPA的PagingAndSortingRepository
  findAllPaged(pageable: Pageable): Promise<Page<T>>
  
  // 创建操作 - Omit<T, 'id'> 表示排除id字段的T类型
  create(entity: Omit<T, 'id'>): Promise<T>
  
  // 更新操作
  update(id: string, entity: Omit<T, 'id'>): Promise<T>           // 全量更新，不包含id
  patch(id: string, partial: Partial<Omit<T, 'id'>>): Promise<T> // 部分更新，排除id后所有字段可选
  
  // 删除操作
  deleteById(id: string): Promise<void>
}

/**
 * 实时资源配置
 */
export interface RealtimeConfig extends ResourceConfig {
  reconnect?: boolean
  reconnectDelay?: number
}

/**
 * 实时资源接口 - 完全屏蔽HTTP层的高级抽象
 * 设计理念：像ORM屏蔽SQL一样，完全屏蔽HTTP/SSE细节
 */
export interface RealtimeResource<T> extends Resource<T> {
  /**
   * 订阅资源变更 - 完全屏蔽底层实现
   * 用户只需要处理业务对象，不需要知道HTTP/SSE的存在
   */
  subscribe(callback: (item: T) => void): () => void
  
  /**
   * 订阅资源变更，支持错误处理
   */
  subscribe(
    callback: (item: T) => void,
    errorCallback: (error: Error) => void
  ): () => void
}

/**
 * 资源代理创建函数类型
 */
export type CreateResourceProxy = <TResource extends Resource<any>>(
  resourceName: string,
  config?: ResourceConfig
) => TResource

/**
 * 实时资源代理创建函数类型
 */
export type CreateRealtimeResourceProxy = <TResource extends RealtimeResource<any>>(
  resourceName: string,
  config?: RealtimeConfig
) => TResource 