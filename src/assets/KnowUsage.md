# 知识库 JSON 导入说明

当前知识库前端只负责上传 JSON 数组文件。

## 文件要求

请上传一个 `.json` 文件，且顶层必须是数组。

正确示例：

```json
[
  {
    "identifier": "F0001",
    "label": "故障现象",
    "desc": "主机启动后排烟发白，冷启动时间明显变长。",
    "relationships": {
      "relationship_reason": "R0001",
      "relationship_solution": "S0001"
    }
  },
  {
    "identifier": "R0001",
    "label": "故障原因",
    "desc": "燃油压力不足或喷油器雾化不良会导致冷启动困难。"
  },
  {
    "identifier": "S0001",
    "label": "维修步骤",
    "desc": "检查启动空气压力、燃油滤器堵塞情况以及喷油正时。",
    "relationships": {
      "relationship_fault": "F0001",
      "relationship_reason": "R0001"
    }
  }
]
```

错误示例：

```json
{
  "knowledge_items": []
}
```

## 建议字段

- `identifier`：知识编号，建议唯一，例如 `R0437`
- `label`：知识标签
- `desc`：知识描述
- `relationships`：可选，知识之间的关系映射

当前标签建议值：

- `使用材料`
- `故障原因`
- `故障现象`
- `注意事项`
- `维修步骤`
- `设备`
- `零部件`

当前关系字段支持：

- `relationship_fault`
- `relationship_reason`
- `relationship_solution`
- `relationship_component`
- `relationship_precaution`
- `relationship_material`

## 编写建议

- 一条知识只表达一个明确主题
- `desc` 尽量写成完整句，便于检索和问答
- `relationships` 的值填写目标知识的 `identifier`
- 同一个 `identifier` 不要重复导入

## 导入后

导入完成后，建议执行一次“重建索引”。
