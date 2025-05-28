# Lady Sion 后端服务

基于 Node.js + TypeScript + DDD架构的现代化后端服务。

## 🚀 快速启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🛠️ 技术栈

- **Node.js** + **TypeScript** - 服务端环境
- **Express.js** - Web框架
- **SQLite** - 轻量级数据库
- **OpenRouter** - LLM API集成
- **LangGraph** - AI工作流编排

## 📚 完整文档

详细的架构设计、API文档和开发指南请查看：

- **[后端架构文档](../docs/architecture/backend.md)** - DDD架构设计和实现
- **[OpenRouter集成](../docs/technical/openrouter-guide.md)** - LLM API集成指南
- **[LangGraph指南](../docs/technical/langgraph-guide.md)** - AI工作流编排
- **[API文档](../docs/api/)** - 完整的API接口文档
- **[文档中心](../docs/README.md)** - 所有文档的导航和索引

## 🔧 开发命令

```bash
npm run dev          # 启动开发服务器（nodemon）
npm run build        # 构建TypeScript项目
npm start            # 启动生产服务器
npm run type-check   # TypeScript类型检查
npm run lint         # ESLint代码检查
npm test             # 运行测试
```

## 📁 项目结构

```
server/src/
├── presentation/    # 表现层（控制器、路由、中间件）
├── application/     # 应用层（用例、应用服务、DTO）
├── domain/         # 领域层（实体、值对象、领域服务）
├── infrastructure/ # 基础设施层（存储、外部服务、配置）
└── shared/         # 共享工具（错误、类型、工具函数）
```

## 🚀 API服务

- **聊天服务**: `/api/v1/conversations` - 对话管理和消息处理
- **角色服务**: `/api/v1/characters` - 角色管理和配置
- **预设服务**: `/api/v1/presets` - 预设模板管理
- **模型服务**: `/api/v1/models` - 可用模型查询
- **健康检查**: `/api/v1/health` - 服务状态检查

---

💡 **提示**: 更多详细信息请查看 [项目完整文档](../docs/README.md) 