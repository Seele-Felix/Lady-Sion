# Lady Sion 项目文档中心

## 🎯 概述

欢迎来到 Lady Sion 项目文档中心。这里整理了项目的所有文档，帮助开发者快速了解和上手项目。

## 📚 文档目录

### 🚀 快速开始
- [项目介绍](../README.md) - 项目概述、特性、安装和运行
- [快速上手指南](./guides/quick-start.md) - 5分钟快速搭建开发环境

### 🏗️ 架构设计
- [后端架构](./architecture/backend.md) - 后端领域驱动设计架构
- [前端架构](./architecture/frontend.md) - Vue3 + TypeScript 前端架构
- [系统整体架构](./architecture/system.md) - 全栈系统架构概览

### 📋 开发指南
- [开发环境配置](./guides/development-setup.md) - 详细的开发环境配置步骤
- [代码规范](./guides/coding-standards.md) - 前后端代码规范和最佳实践
- [ESLint配置指南](./guides/eslint-setup.md) - 现代化ESLint配置说明

### 🔧 技术指南
- [OpenRouter集成指南](./technical/openrouter-guide.md) - LLM API集成和配置
- [LangGraph集成指南](./technical/langgraph-guide.md) - AI工作流编排框架
- [文件索引指南](./technical/index-files-guide.md) - 项目文件组织和索引

### 🎨 设计文档
- [Lady Sion设计哲学](./design/lady-sion-philosophy.md) - 核心设计理念和目标
- [UI设计系统](./design/ui-design.md) - SillyTavern风格设计系统和组件库
- [交互设计模式](./design/interaction-patterns.md) - 用户交互和体验设计

### 🛠️ 部署运维
- [部署指南](./deployment/README.md) - 生产环境部署说明
- [Docker配置](./deployment/docker.md) - 容器化部署配置
- [监控和日志](./deployment/monitoring.md) - 系统监控和日志管理

### 📖 API文档
- [REST API参考](./api/rest-api.md) - 完整的REST API接口文档
- [WebSocket API](./api/websocket.md) - 实时通信接口文档
- [错误码参考](./api/error-codes.md) - API错误码说明

### 🧪 测试指南
- [测试策略](./testing/strategy.md) - 前后端测试策略和框架
- [单元测试指南](./testing/unit-testing.md) - 单元测试编写规范
- [端到端测试](./testing/e2e-testing.md) - E2E测试配置和用例

## 🗂️ 文档组织结构

```
docs/
├── README.md                   # 当前文件 - 文档索引
├── architecture/               # 架构设计文档
│   ├── backend.md             # 后端架构（从BACKEND_ARCHITECTURE.md迁移）
│   ├── frontend.md            # 前端架构（从FRONTEND_ARCHITECTURE.md迁移）
│   └── system.md              # 系统整体架构
├── guides/                     # 开发指南
│   ├── quick-start.md         # 快速开始指南
│   ├── development-setup.md   # 开发环境配置
│   ├── coding-standards.md    # 代码规范
│   └── eslint-setup.md        # ESLint配置（从相关文档迁移）
├── technical/                  # 技术文档
│   ├── openrouter-guide.md    # OpenRouter指南（迁移）
│   ├── langgraph-guide.md     # LangGraph指南（迁移）
│   └── index-files-guide.md   # 文件索引指南（迁移）
├── design/                     # 设计文档
│   ├── lady-sion-philosophy.md # Lady Sion设计哲学（从构建指南提取）
│   ├── ui-design.md           # UI设计规范
│   └── interaction-patterns.md # 交互设计模式
├── deployment/                 # 部署文档
│   ├── README.md              # 部署概览
│   ├── docker.md              # Docker配置
│   └── monitoring.md          # 监控配置
├── api/                        # API文档
│   ├── rest-api.md            # REST API
│   ├── websocket.md           # WebSocket API
│   └── error-codes.md         # 错误码
└── testing/                    # 测试文档
    ├── strategy.md            # 测试策略
    ├── unit-testing.md        # 单元测试
    └── e2e-testing.md         # E2E测试
```

## 🔍 文档查找指南

### 按用户角色查找

**新加入的开发者**:
1. [项目介绍](../README.md)
2. [快速上手指南](./guides/quick-start.md)
3. [开发环境配置](./guides/development-setup.md)
4. [代码规范](./guides/coding-standards.md)

**前端开发者**:
1. [前端架构](./architecture/frontend.md)
2. [UI设计规范](./design/ui-design.md)
3. [前端测试指南](./testing/unit-testing.md)

**后端开发者**:
1. [后端架构](./architecture/backend.md)
2. [API文档](./api/rest-api.md)
3. [技术集成指南](./technical/)

**DevOps工程师**:
1. [部署指南](./deployment/)
2. [Docker配置](./deployment/docker.md)
3. [监控和日志](./deployment/monitoring.md)

**产品设计师**:
1. [Lady Sion设计哲学](./design/lady-sion-philosophy.md)
2. [交互设计模式](./design/interaction-patterns.md)
3. [UI设计规范](./design/ui-design.md)

### 按开发阶段查找

**项目启动阶段**:
- 快速开始 → 环境配置 → 架构了解

**开发阶段**:
- 代码规范 → API文档 → 技术指南

**测试阶段**:
- 测试策略 → 单元测试 → E2E测试

**部署阶段**:
- 部署指南 → Docker配置 → 监控配置

## 📝 文档维护规范

### 文档更新流程
1. 修改相关文档
2. 更新本索引文件
3. 确保链接有效性
4. 提交时包含文档变更说明

### 文档编写规范
- 使用中文编写，专业术语可保留英文
- 统一使用Markdown格式
- 包含适当的代码示例
- 保持结构清晰，使用合适的标题层级
- 添加必要的图表和示例

### 版本控制
- 重要文档变更需要在git commit中说明
- 架构相关文档修改需要团队review
- 保持文档与代码的同步更新

---

📅 **最后更新**: {当前日期}  
👥 **维护者**: Lady Sion 开发团队  
🔄 **版本**: v1.0.0 