// AnimaWeave 执行引擎
// 框架核心引擎，动态加载和执行插件

import { ExecutionStatus, PluginRegistry as Registry } from "./core.ts";
import type {
  ErrorDetails,
  FateEcho,
  IAnimaPlugin,
  NodeDefinition,
  PluginDefinition,
  PluginRegistry,
  SemanticValue,
  TypeDefinition,
  WeaveConnection,
  WeaveGraph,
  WeaveNode,
} from "./core.ts";
import { WeaveParser } from "../parser/weave_parser.ts";

/**
 * AnimaWeave 动态执行引擎
 */
export class AnimaWeaveEngine {
  private parser: WeaveParser;
  private registry: PluginRegistry;
  private initialized = false;

  constructor() {
    this.parser = new WeaveParser();
    this.registry = new Registry();
  }

  /**
   * 初始化引擎 - 动态发现和加载插件
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("🚀 初始化AnimaWeave引擎...");

    // 动态发现和加载插件
    await this.discoverAndLoadPlugins();

    this.initialized = true;
    console.log("✅ AnimaWeave引擎初始化完成");
  }

  /**
   * 执行图
   */
  async executeGraph(sanctumPath: string, weaveName: string): Promise<FateEcho> {
    await this.initialize();

    try {
      console.log(`🎯 执行图: ${sanctumPath}/${weaveName}.weave`);

      // 1. 读取weave文件
      const weaveContent = await this.readWeaveFile(sanctumPath, weaveName);

      // 2. 解析图结构  
      const graph = await this.parser.parseWeave(weaveContent);

      // 3. 静态检查阶段 - 类型检查、连接验证等
      await this.validateGraph(graph);

      // 4. 确保所需插件已加载
      await this.ensureRequiredPluginsLoaded(graph, sanctumPath);

      // 5. 执行图
      const result = await this.executeWeaveGraph(graph);
      const rawResult = this.extractRawOutputs(result);

      return {
        status: ExecutionStatus.Success,
        outputs: JSON.stringify(result),
        error: undefined,
        getOutputs: () => result,
        getRawOutputs: () => rawResult,
        getErrorDetails: () => null,
      };
    } catch (error) {
      return this.createErrorFateEcho(error, sanctumPath, weaveName);
    }
  }

  /**
   * 静态图验证 - 在执行前进行类型检查和连接验证
   */
  private async validateGraph(graph: WeaveGraph): Promise<void> {
    console.log("🔍 开始静态图验证...");
    
    // 检查所有数据连接的类型兼容性
    for (const connection of graph.connections) {
      if (connection.from && connection.to) {
        await this.validateConnection(connection, graph);
      }
    }
    
    console.log("✅ 静态图验证通过");
  }

  /**
   * 验证单个连接的类型兼容性
   */
  private async validateConnection(connection: WeaveConnection, graph: WeaveGraph): Promise<void> {
    const fromNode = graph.nodes[connection.from.node];
    const toNode = graph.nodes[connection.to.node];
    
    if (!fromNode || !toNode) {
      throw new Error(`Connection validation failed: node not found`);
    }

    // 获取输出端口和输入端口的类型信息
    const fromPlugin = this.registry.getPlugin(fromNode.plugin);
    const toPlugin = this.registry.getPlugin(toNode.plugin);
    
    if (!fromPlugin || !toPlugin) {
      throw new Error(`Plugin not found for connection validation`);
    }

    const fromDefinition = fromPlugin.getPluginDefinition();
    const toDefinition = toPlugin.getPluginDefinition();
    
    // 从 "basic.Start" 中提取 "Start"
    const fromNodeType = fromNode.type.includes('.') ? fromNode.type.split('.')[1] : fromNode.type;
    const toNodeType = toNode.type.includes('.') ? toNode.type.split('.')[1] : toNode.type;
    
    const fromNodeDef = fromDefinition.nodes[fromNodeType];
    const toNodeDef = toDefinition.nodes[toNodeType];
    
    console.log(`🔍 查找节点定义: ${fromNodeType} -> ${toNodeType}`);
    console.log(`📋 可用节点:`, Object.keys(fromDefinition.nodes), Object.keys(toDefinition.nodes));
    
    if (!fromNodeDef || !toNodeDef) {
      throw new Error(`Node definition not found for connection validation`);
    }

    // 获取端口类型
    const outputType = fromNodeDef.outputs[connection.from.output];
    const inputType = toNodeDef.inputs[connection.to.input];
    
    if (!outputType || !inputType) {
      throw new Error(`Port not found: ${connection.from.output} -> ${connection.to.input}`);
    }

    // 类型兼容性检查
    if (!this.areTypesCompatible(outputType, inputType)) {
      const errorMessage = `Type mismatch in static validation: Cannot connect ${outputType} to ${inputType} (${connection.from.node}.${connection.from.output} -> ${connection.to.node}.${connection.to.input})`;
      
      console.log(`❌ 静态类型检查失败: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log(`✅ 连接类型检查通过: ${outputType} -> ${inputType}`);
  }

  /**
   * 检查两个类型是否兼容
   */
  private areTypesCompatible(outputType: string, inputType: string): boolean {
    // 完全匹配
    if (outputType === inputType) {
      return true;
    }
    
    // 基础类型兼容性规则
    const compatibilityRules: Record<string, string[]> = {
      "basic.String": ["basic.String"],
      "basic.Int": ["basic.Int"],
      "basic.Bool": ["basic.Bool"],
      "basic.UUID": ["basic.UUID", "basic.String"], // UUID可以作为String使用
      "basic.Signal": ["basic.Signal"],
      "basic.Prompt": ["basic.Prompt"], // Prompt是复合类型，不能转换为基础类型
    };
    
    const compatibleTypes = compatibilityRules[outputType] || [];
    return compatibleTypes.includes(inputType);
  }

  /**
   * 创建错误FateEcho - 根据错误类型分类
   */
  private createErrorFateEcho(error: unknown, sanctumPath?: string, weaveName?: string): FateEcho {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ 图执行失败:", errorMessage);

    // 错误分类逻辑
    let errorCode: ExecutionStatus;
    let location: any = undefined;

    if (errorMessage.includes("parse") || errorMessage.includes("syntax")) {
      errorCode = ExecutionStatus.ParseError;
    } else if (errorMessage.includes("type") || errorMessage.includes("connection") || errorMessage.includes("validation")) {
      errorCode = ExecutionStatus.ValidationError;
    } else if (errorMessage.includes("plugin") || errorMessage.includes("import")) {
      errorCode = ExecutionStatus.ConfigError;
    } else if (errorMessage.includes("requires") && errorMessage.includes("input")) {
      // 这是运行时的节点执行错误
      errorCode = ExecutionStatus.RuntimeError;
    } else if (errorMessage.includes("data") || errorMessage.includes("conversion")) {
      errorCode = ExecutionStatus.DataError;
    } else {
      errorCode = ExecutionStatus.FlowError;
    }

    if (sanctumPath && weaveName) {
      location = {
        file: `${sanctumPath}/${weaveName}.weave`
      };
    }

    const errorDetails: ErrorDetails = {
      code: errorCode,
      message: errorMessage,
      location,
      context: { timestamp: new Date().toISOString() }
    };

    const errorSemanticValue: SemanticValue = {
      semantic_label: "system.Error",
      value: errorMessage
    };

    return {
      status: errorCode,
      outputs: JSON.stringify({ error: errorSemanticValue }),
      error: errorDetails,
      getOutputs: () => ({ error: errorSemanticValue }),
      getRawOutputs: () => ({ error: errorMessage }),
      getErrorDetails: () => errorDetails,
    };
  }

  /**
   * 动态发现和加载插件
   */
  private async discoverAndLoadPlugins(): Promise<void> {
    console.log("🔍 动态发现插件...");

    // 策略1: 扫描plugins目录，发现TypeScript插件实现
    await this.scanPluginModules();

    // 策略2: 自动生成anima文件（给AI看的元数据）
    await this.generateAnimaFiles();

    console.log(`📊 已加载插件: ${this.registry.listPlugins().join(", ")}`);
  }

  /**
   * 扫描插件目录，加载TypeScript插件实现
   */
  private async scanPluginModules(): Promise<void> {
    try {
      const pluginsPath = "src/plugins";

      // 读取plugins目录
      for await (const dirEntry of Deno.readDir(pluginsPath)) {
        if (dirEntry.isDirectory) {
          const pluginName = dirEntry.name;
          console.log(`🔍 发现插件模块: ${pluginName}`);

          try {
            // 尝试加载插件的TypeScript实现
            await this.loadPluginModule(pluginName);
          } catch (error) {
            console.warn(
              `⚠️ 无法加载插件 ${pluginName}:`,
              error instanceof Error ? error.message : String(error),
            );
          }
        }
      }
    } catch (error) {
      console.warn(
        "⚠️ 无法扫描plugins目录:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * 加载单个插件模块
   */
  private async loadPluginModule(pluginName: string): Promise<void> {
    console.log(`🔌 加载插件模块: ${pluginName}`);

    try {
      // 动态导入插件的TypeScript实现 - 修复路径问题
      const modulePath = `../plugins/${pluginName}/plugin.ts`;
      const pluginModule = await import(modulePath);

      // 创建插件实例 - 插件自己知道自己的定义
      const PluginClass =
        pluginModule[`${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)}Plugin`];
      if (!PluginClass) {
        throw new Error(`Plugin class not found in module: ${modulePath}`);
      }

      // 插件自己提供定义，不需要外部anima文件
      const plugin = new PluginClass();
      this.registry.register(plugin);

      console.log(`✅ 成功加载插件: ${pluginName}`);
    } catch (error) {
      throw new Error(
        `Failed to load plugin ${pluginName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 根据已加载的插件自动生成anima文件（给AI看的）
   */
  private async generateAnimaFiles(): Promise<void> {
    console.log("📝 自动生成anima文件...");

    for (const pluginName of this.registry.listPlugins()) {
      try {
        const plugin = this.registry.getPlugin(pluginName);
        if (!plugin) continue;

        // 从插件获取定义
        const definition = plugin.getPluginDefinition();

        // 生成anima文件内容
        const animaContent = this.generateAnimaContent(definition);

        // 写入anima文件
        const animaPath = `sanctums/${pluginName}.anima`;
        await Deno.writeTextFile(animaPath, animaContent);

        console.log(`📄 生成anima文件: ${animaPath}`);
      } catch (error) {
        console.warn(
          `⚠️ 无法生成${pluginName}的anima文件:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  /**
   * 生成anima文件内容
   */
  private generateAnimaContent(definition: PluginDefinition): string {
    let content = "-- types\n";

    // 生成类型定义
    for (const [typeName, typeDef] of Object.entries(definition.semantic_labels)) {
      const typeDefinition = typeDef as TypeDefinition;
      if (typeDefinition.kind === "composite" && typeDefinition.fields) {
        content += `${typeName} {\n`;
        for (const [fieldName, fieldType] of Object.entries(typeDefinition.fields)) {
          content += `    ${fieldName} ${fieldType}\n`;
        }
        content += "}\n";
      } else {
        content += `${typeName}\n`;
      }
    }

    content += "--\n\n-- nodes\n";

    // 生成节点定义
    for (const [nodeName, nodeDef] of Object.entries(definition.nodes)) {
      const nodeDefinition = nodeDef as NodeDefinition;
      content += `${nodeName} {\n`;
      content += `    mode ${nodeDefinition.mode}\n`;
      content += `    in {\n`;
      for (const [inputName, inputType] of Object.entries(nodeDefinition.inputs)) {
        content += `        ${inputName} ${inputType}\n`;
      }
      content += `    }\n`;
      content += `    out {\n`;
      for (const [outputName, outputType] of Object.entries(nodeDefinition.outputs)) {
        content += `        ${outputName} ${outputType}\n`;
      }
      content += `    }\n`;
      content += "}\n\n";
    }

    content += "--\n";

    return content;
  }

  /**
   * 确保所需插件已加载
   */
  private async ensureRequiredPluginsLoaded(graph: WeaveGraph, sanctumPath: string): Promise<void> {
    const requiredPlugins = new Set<string>();

    // 从图中提取所需的插件
    for (const node of Object.values(graph.nodes)) {
      requiredPlugins.add(node.plugin);
    }

    // 检查并加载缺失的插件
    for (const pluginName of requiredPlugins) {
      if (!this.registry.getPlugin(pluginName)) {
        await this.loadPlugin(pluginName, sanctumPath);
      }
    }
  }

  /**
   * 动态加载插件
   */
  private async loadPlugin(pluginName: string, sanctumPath: string): Promise<void> {
    console.log(`🔌 动态加载插件: ${pluginName}`);

    try {
      // 直接导入插件的TypeScript实现（插件自己定义能力）
      const modulePath = `./src/plugins/${pluginName}/plugin.ts`;
      const pluginModule = await import(modulePath);

      // 创建插件实例 - 插件自己知道自己的定义
      const PluginClass =
        pluginModule[`${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)}Plugin`];
      if (!PluginClass) {
        throw new Error(`Plugin class not found in module: ${modulePath}`);
      }

      const plugin = new PluginClass();
      this.registry.register(plugin);

      console.log(`✅ 成功动态加载插件: ${pluginName}`);
    } catch (error) {
      throw new Error(
        `Failed to load plugin ${pluginName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 读取weave文件
   */
  private async readWeaveFile(sanctumPath: string, weaveName: string): Promise<string> {
    const filePath = `${sanctumPath}/${weaveName}.weave`;

    try {
      return await Deno.readTextFile(filePath);
    } catch (error) {
      throw new Error(
        `Failed to read weave file ${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 执行图
   */
  private async executeWeaveGraph(graph: WeaveGraph): Promise<Record<string, SemanticValue>> {
    console.log("🔄 开始执行图...");

    const nodeResults = new Map<string, Record<string, unknown>>();

    // 按拓扑顺序执行节点
    const executionOrder = this.topologicalSort(graph);
    console.log("📋 执行顺序:", executionOrder);

    for (const nodeId of executionOrder) {
      const node = graph.nodes[nodeId];

      console.log(`⚙️ 执行节点: ${nodeId} (${node.plugin}.${node.type})`);

      // 收集输入数据
      const inputs = this.collectNodeInputs(node, graph.connections, nodeResults);

      // 执行节点
      const outputs = await this.registry.executeNode(node.plugin, node.type, inputs);

      // 存储结果
      nodeResults.set(nodeId, outputs);

      console.log(`✅ 节点 ${nodeId} 执行完成:`, outputs);
    }

    // 收集终端输出（带语义标签）
    const terminalOutputs = this.collectTerminalOutputs(graph, nodeResults);

    console.log("🎯 图执行完成，终端输出:", terminalOutputs);

    return terminalOutputs;
  }

  /**
   * 拓扑排序
   */
  private topologicalSort(graph: WeaveGraph): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected: ${nodeId}`);
      }

      if (visited.has(nodeId)) return;

      visiting.add(nodeId);

      // 找到依赖当前节点的节点
      const dependents = graph.connections
        .filter((conn) => conn.from.node === nodeId)
        .map((conn) => conn.to.node);

      for (const dependent of dependents) {
        visit(dependent);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      result.unshift(nodeId);
    };

    // 从入口点开始
    for (const entryPoint of graph.metadata.entry_points) {
      visit(entryPoint);
    }

    // 确保所有节点都被访问
    for (const nodeId of Object.keys(graph.nodes)) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }

    return result;
  }

  /**
   * 收集节点输入
   */
  private collectNodeInputs(
    node: WeaveNode,
    connections: WeaveConnection[],
    nodeResults: Map<string, Record<string, unknown>>,
  ): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};

    // 从连接收集输入
    const incomingConnections = connections.filter((conn) => conn.to.node === node.id);

    for (const connection of incomingConnections) {
      const sourceResult = nodeResults.get(connection.from.node);
      if (sourceResult && connection.from.output in sourceResult) {
        inputs[connection.to.input] = sourceResult[connection.from.output];
      }
    }

    // 添加节点参数
    if (node.parameters) {
      Object.assign(inputs, node.parameters);
    }

    return inputs;
  }

  /**
   * 收集终端输出（带语义标签信息）
   */
  private collectTerminalOutputs(
    graph: WeaveGraph,
    nodeResults: Map<string, Record<string, unknown>>,
  ): Record<string, SemanticValue> {
    const terminalOutputs: Record<string, SemanticValue> = {};

    for (const [nodeId, results] of nodeResults) {
      const node = graph.nodes[nodeId];
      
      for (const [outputName, value] of Object.entries(results)) {
        const isConsumed = graph.connections.some((conn) =>
          conn.from.node === nodeId && conn.from.output === outputName
        );

        if (!isConsumed) {
          const key = `${nodeId}.${outputName}`;
          
          // 获取输出端口的语义标签
          const semanticLabel = this.getOutputSemanticLabel(node, outputName);
          
          // 构建语义标签感知的值
          const semanticValue = this.buildSemanticValue(semanticLabel, value);
          
          terminalOutputs[key] = semanticValue;
        }
      }
    }

    return terminalOutputs;
  }

  /**
   * 获取节点输出端口的语义标签
   */
  private getOutputSemanticLabel(node: WeaveNode, outputName: string): string {
    try {
      const plugin = this.registry.getPlugin(node.plugin);
      if (!plugin) {
        console.warn(`⚠️ 插件未找到: ${node.plugin}`);
        return "unknown";
      }

      const definition = plugin.getPluginDefinition();
      const nodeDefinition = definition.nodes[node.type.split('.').pop() || ''];
      
      if (!nodeDefinition) {
        console.warn(`⚠️ 节点定义未找到: ${node.type}`);
        return "unknown";
      }

      const semanticLabel = nodeDefinition.outputs[outputName];
      return semanticLabel || "unknown";
    } catch (error) {
      console.warn(`⚠️ 获取语义标签失败:`, error);
      return "unknown";
    }
  }

  /**
   * 构建语义标签感知的值
   */
  private buildSemanticValue(semanticLabel: string, value: unknown): SemanticValue {
    // 对于复合类型，需要递归构建嵌套结构
    if (this.isCompositeType(semanticLabel) && typeof value === 'object' && value !== null) {
      const compositeValue: Record<string, SemanticValue> = {};
      const typeDefinition = this.getTypeDefinition(semanticLabel);
      
      if (typeDefinition && typeDefinition.fields) {
        for (const [fieldName, fieldValue] of Object.entries(value as Record<string, unknown>)) {
          const fieldSemanticLabel = typeDefinition.fields[fieldName];
          if (fieldSemanticLabel) {
            compositeValue[fieldName] = this.buildSemanticValue(fieldSemanticLabel, fieldValue);
          }
        }
      }
      
      return {
        semantic_label: semanticLabel,
        value: compositeValue
      };
    }

    // 对于基础类型，直接包装
    return {
      semantic_label: semanticLabel,
      value: value
    };
  }

  /**
   * 检查是否为复合类型
   */
  private isCompositeType(semanticLabel: string): boolean {
    const typeDefinition = this.getTypeDefinition(semanticLabel);
    return typeDefinition?.kind === "composite" && !!typeDefinition.fields;
  }

  /**
   * 获取类型定义
   */
  private getTypeDefinition(semanticLabel: string): TypeDefinition | undefined {
    try {
      const [pluginName, typeName] = semanticLabel.split('.');
      const plugin = this.registry.getPlugin(pluginName);
      if (!plugin) return undefined;

      const definition = plugin.getPluginDefinition();
      return definition.semantic_labels[typeName];
    } catch (error) {
      return undefined;
    }
  }

  /**
   * 将语义标签感知的输出转换为原始值（向后兼容）
   */
  private extractRawOutputs(semanticOutputs: Record<string, SemanticValue>): Record<string, unknown> {
    const rawOutputs: Record<string, unknown> = {};
    
    for (const [key, semanticValue] of Object.entries(semanticOutputs)) {
      rawOutputs[key] = this.extractRawValue(semanticValue);
    }
    
    return rawOutputs;
  }

  /**
   * 从语义标签值中提取原始值
   */
  private extractRawValue(semanticValue: SemanticValue): unknown {
    if (typeof semanticValue.value === 'object' && semanticValue.value !== null) {
      // 检查是否为嵌套的语义标签结构
      const firstValue = Object.values(semanticValue.value)[0];
      if (firstValue && typeof firstValue === 'object' && 'semantic_label' in firstValue) {
        // 这是嵌套的语义标签结构，递归提取
        const rawObject: Record<string, unknown> = {};
        for (const [fieldName, fieldSemanticValue] of Object.entries(semanticValue.value as Record<string, SemanticValue>)) {
          rawObject[fieldName] = this.extractRawValue(fieldSemanticValue);
        }
        return rawObject;
      }
    }
    
    return semanticValue.value;
  }

  /**
   * 获取插件注册表（用于调试）
   */
  getRegistry(): PluginRegistry {
    return this.registry;
  }
}
