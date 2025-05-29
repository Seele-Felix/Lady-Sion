# 前端服务客户端(Frontend Service Client)

## 📋 概述

前端服务客户端是一个让前端代码调用远程服务如同调用本地方法的系统。它通过代理模式和约定，将HTTP请求抽象成类型安全的方法调用，消除前端与后端通信的复杂性。

## 🎯 核心概念

### 什么是前端服务客户端？

前端服务客户端不是ORM（对象关系映射），而是一个**RPC代理系统**，目标是：

1. **消除HTTP复杂性** - 前端开发者无需处理fetch、错误处理、序列化等
2. **提供类型安全** - 通过TypeScript接口确保调用的正确性
3. **统一调用体验** - 远程调用和本地调用看起来一样

### 核心思想

```typescript
// 传统方式：手工HTTP调用
const response = await fetch('/api/chat/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'hello' })
})
const data = await response.json()

// 服务客户端：直接方法调用
const messages = await chatService.getMessages('hello')
```

## 🏗️ 系统架构

### 1. 架构层次

```
┌─────────────────────────────────────┐
│           前端业务层                 │
│    (Vue组件/React组件/纯JS逻辑)      │
└─────────────────┬───────────────────┘
                  │ 直接方法调用
┌─────────────────▼───────────────────┐
│         服务客户端代理层              │
│    (createServiceClient生成的代理)    │
└─────────────────┬───────────────────┘
                  │ HTTP请求/SSE连接
┌─────────────────▼───────────────────┐
│            网络传输层               │
│        (fetch/EventSource)         │
└─────────────────┬───────────────────┘
                  │ HTTP/SSE协议
┌─────────────────▼───────────────────┐
│             后端服务                │
│      (LadySion Backend API)        │
└─────────────────────────────────────┘
```

### 2. 核心组件

#### ServiceClient生成器
- **职责**：根据服务接口生成客户端代理
- **输入**：服务接口类 + 配置选项
- **输出**：类型安全的服务代理对象

#### HTTP调用处理器
- **职责**：处理普通方法的HTTP请求
- **支持**：GET/POST请求、错误处理、超时控制

#### 流式调用处理器
- **职责**：处理流式方法的SSE连接
- **检测规则**：方法名包含"Stream"关键字
- **支持**：EventSource连接、实时数据流

## 🔧 技术规范

### 1. 服务接口约定

每个服务必须继承BaseService并遵循约定：

```typescript
interface BaseService {
  readonly serviceName: string
}

interface ChatService extends BaseService {
  readonly serviceName: 'ChatService'
  
  // 普通HTTP方法
  getMessages(query: string): Promise<ServiceResponse<Message[]>>
  
  // 流式方法（包含Stream关键字）
  streamMessages(query: string): AsyncIterable<MessageChunk>
}
```

### 2. URL生成规则

- **基础路径**：`/api/service-client/`
- **服务路径**：`{servicename}/`（小写）
- **方法路径**：`{methodname}`
- **完整例子**：`/api/service-client/chatservice/getMessages`

### 3. 请求格式约定

#### HTTP请求
```json
{
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "args": ["参数1", "参数2", "..."]
  }
}
```

#### 流式请求
- 使用EventSource连接
- URL参数传递：`?args=["参数1","参数2"]`
- 实时接收JSON数据块

### 4. 响应格式约定

#### 成功响应
```typescript
interface ServiceResponse<T> {
  success: true
  data: T
  timestamp: Date
}
```

#### 错误响应
```typescript
interface ServiceResponse<T> {
  success: false
  error: string
  timestamp: Date
}
```

#### 流式响应
```typescript
// 每个SSE事件包含
interface StreamChunk {
  data: any  // 业务数据
}
```

## 🛠️ 实现原则

### 1. 约定优于配置
- 通过命名约定自动检测流式方法
- 通过服务名自动生成URL路径
- 最小化配置需求

### 2. 类型安全优先
- 全程TypeScript类型检查
- 编译时发现接口不匹配
- 自动补全和IDE支持

### 3. 渐进式增强
- 可以与传统HTTP调用共存
- 支持自定义配置覆盖默认行为
- 支持中间件扩展

### 4. 错误处理透明
- 网络错误自动转换为失败响应
- HTTP状态码错误统一处理
- 保持调用方式的简洁性

## 📋 API设计

### 创建服务客户端

```typescript
function createServiceClient<T extends BaseService>(
  ServiceClass: new() => T,
  config?: ServiceClientConfig
): T

interface ServiceClientConfig {
  baseUrl?: string           // 自定义API基础URL
  timeout?: number          // 请求超时时间(ms)
  headers?: Record<string, string>  // 自定义请求头
}
```

### 使用示例

```typescript
// 1. 定义服务接口
interface ChatService extends BaseService {
  readonly serviceName: 'ChatService'
  getMessages(query: string): Promise<ServiceResponse<Message[]>>
  streamChat(prompt: string): AsyncIterable<ChatChunk>
}

// 2. 创建客户端
const chatClient = createServiceClient(ChatServiceImpl, {
  baseUrl: '/api',
  timeout: 10000,
  headers: { 'Authorization': 'Bearer token' }
})

// 3. 使用客户端
const messages = await chatClient.getMessages('hello')
for await (const chunk of chatClient.streamChat('tell me a story')) {
  console.log(chunk.content)
}
```

## 🧪 测试策略

### 1. 单元测试范围
- 代理对象创建和方法绑定
- HTTP请求格式和错误处理  
- 流式连接建立和数据接收
- 配置项应用和URL生成

### 2. 集成测试范围
- 与真实后端服务的通信
- 端到端的数据流验证
- 性能和稳定性测试

### 3. 测试文件命名
- 使用 `.test.ts` 后缀（Jest/Vitest标准）
- 测试文件位于 `__tests__` 目录

## 📚 相关文档

- [前端架构设计](../architecture/frontend-architecture.md)
- [后端API设计](../architecture/backend-api.md)
- [类型系统设计](./typescript-contracts.md)

## 🔄 更新记录

- 2024-12-26: 创建文档，定义核心概念和架构 