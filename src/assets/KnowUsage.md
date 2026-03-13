# 知识库 JSONL 导入说明

当前知识库导入文件使用 `jsonl` 格式，不是 JSON 数组。

- 一个文件对应一次导入
- 每一行都是一个独立的 JSON 对象
- 前端不传来源分类
- 用户从这里导入的内容应由后端归入用户知识库

## 文件格式

正确示例：

```json
{"identifier":"F0001","label":"故障现象","desc":"主机启动后排烟发白，冷启动时间明显变长。","relationships":{"relationship_reason":"R0001","relationship_solution":"S0001"}}
{"identifier":"R0001","label":"故障原因","desc":"燃油压力不足或喷油器雾化不良会导致冷启动困难。"}
{"identifier":"S0001","label":"维修步骤","desc":"检查启动空气压力、燃油滤器堵塞情况以及喷油正时。","relationships":{"relationship_fault":"F0001","relationship_reason":"R0001"}}
```

错误示例：

```json
[
  {"identifier":"F0001"}
]
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

## 导入后行为

- 上传成功后，前端会清空知识列表缓存
- 知识维护页会重新请求一次列表
- 如果仍未显示，请执行一次“重建索引”
