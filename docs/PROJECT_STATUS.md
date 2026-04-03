# Yin01 项目全量审计报告 (2026-04-03)

> **本文件是项目的「单一事实来源」(Single Source of Truth)**。
> 后续开发前请先阅读此文件，避免重复扫描代码。

---

## 一、技术栈 (Tech Stack)

| 层级 | 技术 | 说明 |
|---|---|---|
| **前端框架** | Vue 3 (Composition API `<script setup>`) | Vite 构建 |
| **路由** | vue-router 4 (`createWebHistory`) | 见 `src/router/index.js` |
| **图表** | Chart.js + vue-chartjs | 用于体质雷达图 |
| **图标** | lucide-vue-next | 全局使用 |
| **样式** | Tailwind CSS + 自定义 CSS 变量 (`style.css`) | 古典配色：cinnabar, jade, gold, ink 等 |
| **持久化** | localStorage（自定义封装 `src/utils/storage.js`） | 所有数据存本地 |
| **后端 API** | Vercel Serverless (`api/analyze-diagnosis.js`) | **尚未迁移至 Cloudflare** |
| **AI 模型** | 硅基流动 SiliconFlow - Qwen2.5-VL-72B-Instruct | OpenAI 兼容协议，**已经是国内模型** |
| **部署** | 目标 Cloudflare Pages (+Functions) | 当前有 vercel.json 和 netlify.toml 残留 |

---

## 二、路由与页面总览 (Routes)

| 路径 | 组件 | 布局 | 功能概述 |
|---|---|---|---|
| `/home` | `Home.vue` (1589行) | MainLayout (底部TabBar) | **主页**：播放器(传统/AI/自由创作)、十二时辰推荐、每日音疗计时、科研打卡弹窗 |
| `/diagnosis` | `Diagnosis.vue` (245行) | MainLayout | **测评入口**：问诊、手动录入体质、AI望诊(VIP) |
| `/assessment` | `Assessment.vue` (193行) | 独立页 | **27题问卷**：依据 GB/T 46939-2025，五分量表 |
| `/result` | `Result.vue` (1587行) | 独立页（也挂在Tab下为 result-tab） | **结果页**：体质判定、雷达图(VIP)、兼夹分析(VIP)、五音处方播放器、养生建议 |
| `/diagnosis-ai` | `DiagnosisAI.vue` (292行) | 独立页 | **AI望诊**：拍面→拍舌→调API→显示诊断报告 |
| `/research` | `ResearchStudy.vue` (841行) | 独立页 | **科研系统**：知情同意→基线问卷(PSQI/GAD-7/PHQ-9)→14天跟踪→结束问卷→电子证书 |
| `/profile` | `Profile.vue` (455行) | MainLayout | **个人中心**：历史记录、趋势图(VIP)、科研状态、数据导出JSON、清空数据 |
| `/theory` | `Theory.vue` | 独立页 | 五音理论科普 |
| `/tongue` | `TongueDiagnosis.vue` | 独立页 | 舌诊采集(单独入口) |
| `/face` | `FaceDiagnosis.vue` | 独立页 | 面诊采集(单独入口) |

---

## 三、核心数据模型 (Data)

### 3.1 体质数据 (`src/data/constitutions.js`)

- **CONSTITUTIONS**: 9种中医体质(平和/气虚/阳虚/阴虚/痰湿/湿热/血瘀/气郁/特禀)
  - 每种包含：name, desc, feature, tone(五音key), toneName, tracks(传统古曲数组), advice(饮食/起居/运动), color
- **FIVE_TONES**: 五音理论(宫/商/角/徵/羽)
  - 每种包含：name, element(五行), organ(五脏), emotion(五志), feature, description, color

### 3.2 问卷数据 (`src/data/questions-free.js`)

- 27题问卷，五分量表（从不/很少/有时/经常/总是）

### 3.3 AI音乐数据 (`src/data/ai-music.js`)

- **⚠️ 伪AI**：每个五音对应一个预置MP3文件（如「AI合成宫调」实际播放 guzheng_generic.mp3）
- `getAIMusicByConstitution()` 是一个简单的映射函数

### 3.4 localStorage 存储键 (`src/utils/storage.js`)

| Key | 存储内容 |
|---|---|
| `wuyin_current_constitution` | 当前体质记录（含tracks, toneName等） |
| `wuyin_history` | 历史测评记录数组（最多20条） |
| `wuyin_vip` | VIP状态 (字符串 "true"/"false") |
| `wuyin_research` | 科研计划数据（status, baseline, logs, endSurvey） |
| `wuyin_daily_usage` | 今日聆听时长（date + seconds） |
| `wuyin_feedback` | 曲目评价记录数组 |
| `wuyin_answers` | 最近一次提交的问卷答案 |
| `wuyin_answers_temp` | 问卷进行中的临时答案 |
| `wuyin_playback_cache` | 播放数据缓存（防丢失） |

---

## 四、核心模块详解

### 4.1 Web Audio 合成引擎 (`src/utils/toneGenerator.js`)

**✅ 已实现，450行，功能完整：**

- `ToneGenerator` 类：基于 Web Audio API 的单例播放器
- **频率映射**：
  - `TONE_FREQUENCIES`：宫261Hz(C4), 商293Hz(D4), 角329Hz(E4), 徵392Hz(G4), 羽440Hz(A4)
  - `ORGAN_FREQUENCIES`：宇宙频率体系(心432Hz, 肝417Hz等)
  - `SCALE_FREQUENCIES`：十二平均律 C4-E5
- **核心播放函数**：
  - `playPentatonic(scale, duration)`: 基础五声音阶播放，内置随机打乱+高低八度变化
  - `playPentatonicWithOptions(scale, duration, { rhythm, variation })`: **高级版**，接受节奏(slow/natural/active)和变化度(simple/rich/random)参数
- **音色生成**：正弦波为主(85%)，三角波辅助(15%)，带平滑淡入淡出包络(0.8s↑→4s↓)
- **控制功能**：play/pause/resume/stop/setVolume/fadeIn/fadeOut
- **体质映射**：`getToneByConstitution()` — 体质key→五音key的硬编码映射

### 4.2 AI 望诊后端 (`api/analyze-diagnosis.js`)

**✅ 已实现，215行：**

- **已经使用国内模型**！对接的是 **硅基流动(SiliconFlow) Qwen2.5-VL-72B-Instruct**
- OpenAI Chat Completions 兼容协议
- 极其详细的中医望诊 Prompt（五色辨证、舌象分析、九种体质对应特征）
- 输出 JSON：`{ face, tongue, diagnosis, advice }`
- 有 Mock 模式（无 API Key 时返回固定的「脾虚湿盛」模拟数据）
- **⚠️ 问题**：使用 Vercel Serverless 语法 (`export default function handler(req, res)`)，需迁移为 Cloudflare Pages Functions 语法

### 4.3 自由创作系统 (Home.vue + Result.vue)

**✅ 已实现且功能丰富：**

- **情绪选择**：焦虑→羽、愤怒→商、悲伤→徵、疲惫→宫、兴奋→角
- **音阶选择**：宫/商/角/徵/羽 手动切换
- **节奏选择**：舒缓(6s间隔)/自然(4.5s)/活跃(3s)
- **变化度选择**：简洁/丰富/随机
- 播放时长固定 15 分钟 (900秒)
- **VIP 限制**：AI风格和自由创作均需 VIP 权限

### 4.4 科研系统 (`ResearchStudy.vue`)

**✅ 已实现，841行，非常完整：**

- **知情同意书**：含研究目的、流程、纳入标准、收益与风险、隐私保护条款
- **基线问卷（5模块）**：
  1. 人口学信息（年龄/性别/职业/病史/用药）
  2. 体质与音乐偏好
  3. PSQI 睡眠质量（7题）
  4. GAD-7 焦虑（7题）
  5. PHQ-9 抑郁（6题）
- **14天跟踪期**：每日任务看板 + 进度条
- **结束问卷(复测)**：9题（睡眠/焦虑/情绪复测 + 改善领域 + 依从性 + 满意度 + 推荐意愿 + 开放反馈）
- **奖励系统**：完成给VIP + 电子证书
- **每日打卡弹窗** (`Home.vue`)：听满15分钟后弹出，记录 睡眠/焦虑/心情 三项 0-10 评分

### 4.5 数据导出 (`Profile.vue`)

**✅ 已实现：** 一键导出 JSON，包含 user + research + history + feedback

### 4.6 评分体系 (`src/utils/scoring.js`)

- `getFullAssessment(answers, questions)`：基于国标的体质计分算法
- 输出：主体质 + 兼夹体质 + 各体质转化分

---

## 五、现有能力 vs 比赛需求 对照表

| 比赛要求 | 现有状态 | 差距分析 |
|---|---|---|
| **明确医学应用场景** | ✅ 中医体质辨证 + 五音音乐疗法 | 无差距 |
| **解决医学实际问题** | ✅ 焦虑/失眠的非药物干预 | 无差距 |
| **AI技术贡献 ≥60%** | ⚠️ 部分 | 现有AI仅用于望诊(调API)。**音乐生成部分无AI参与**——toneGenerator的参数靠规则映射，不靠AI。需要打通「AI诊断→AI生成音乐参数→WebAudio合成」的链路 |
| **医学验证数据** | ⚠️ 框架有，数据缺 | 科研系统代码完整但**数据全存本地**，无法集中收集。需要后端存储或至少导出汇总能力 |
| **避免纯技术类** | ✅ | 有完整的中医理论基础和临床路径 |
| **千人千面个性化** | ⚠️ 部分 | 自由创作模块已有参数化能力(rhythm/variation)，但**不是由AI根据个人状态自动生成**，而是用户手动选 |
| **AI与科研全过程深度融合** | ⚠️ 弱 | AI只在望诊环节出现。科研评估、音乐处方、效果分析均无AI参与 |

---

## 六、升级路线图 (按优先级)

### P0 (必须 - 赛道资格)

1. **打通 AI→音乐参数 链路**
   - 新建 `src/utils/aiComposer.js`
   - 让 AI 望诊/问卷结果直接输出 `{ tone, rhythm, variation, baseFreqShift }` 参数
   - `toneGenerator.js` 接收这些参数自动播放，无需用户手动选

2. **后端迁移至 Cloudflare Pages Functions**
   - 将 `api/analyze-diagnosis.js` 的 Vercel 语法改为 Cloudflare Workers 语法
   - 新建 `functions/api/analyze-diagnosis.js` 或 `functions/api/analyze-diagnosis.ts`

### P1 (高价值 - 竞争力)

3. **A/B 对照实验设计**
   - 在科研系统中增加随机分组（传统古曲 vs AI合成音乐）
   - 14天后对比 PSQI/GAD-7 改善

4. **音乐「心理投射」增强**
   - 让用户在自由创作时看到实时波形可视化
   - 生成时标注「此音乐专为您的[体质]在[情绪]状态下编写」

### P2 (锦上添花)

5. **科研数据集中存储**
   - 通过 Cloudflare Workers 转存到 D1 数据库或 KV
   - 实现导出 CSV 格式的聚合报告

6. **生成式 API 音乐**
   - 调用外部 AI 音乐生成服务，生成真正的旋律音频文件
   - 作为 Web Audio 合成的补充（双模态）

---

## 七、文件清单 (完整)

```
yin01/
├── api/
│   └── analyze-diagnosis.js    # 后端：AI望诊API (Vercel语法, 用 SiliconFlow Qwen VL)
├── src/
│   ├── App.vue                 # 根组件
│   ├── main.js                 # 入口
│   ├── style.css               # 全局样式 + Tailwind配置
│   ├── router/index.js         # 路由配置（10个路由）
│   ├── layout/MainLayout.vue   # 底部TabBar布局
│   ├── data/
│   │   ├── constitutions.js    # 9种体质 + 五音理论数据
│   │   ├── questions-free.js   # 27题问卷
│   │   └── ai-music.js         # 伪AI音乐映射(实为预置MP3)
│   ├── utils/
│   │   ├── storage.js          # localStorage封装 + 播放缓存
│   │   ├── scoring.js          # 国标体质计分算法
│   │   └── toneGenerator.js    # ★ Web Audio五音合成引擎 (450行)
│   ├── components/
│   │   ├── CameraCapture.vue   # 摄像头拍照组件
│   │   ├── ConstitutionTrendChart.vue  # 体质变化趋势图
│   │   ├── RatingEntry.vue     # 评分组件
│   │   └── ResearchStatus.vue  # 科研状态卡片
│   └── views/
│       ├── Home.vue            # ★ 主页 (1589行，含播放器+十二时辰+科研打卡)
│       ├── Diagnosis.vue       # 测评入口
│       ├── DiagnosisAI.vue     # AI望诊流程
│       ├── Assessment.vue      # 27题问卷
│       ├── Result.vue          # ★ 结果页 (1587行，含雷达图+播放器+评价)
│       ├── ResearchStudy.vue   # ★ 科研系统 (841行)
│       ├── MusicLibrary.vue    # 五音曲库
│       ├── Profile.vue         # 个人中心
│       ├── Theory.vue          # 五音理论
│       ├── FaceDiagnosis.vue   # 面诊
│       └── TongueDiagnosis.vue # 舌诊
├── public/music/               # 传统古曲MP3文件
├── docs/
│   ├── PROJECT_STATUS.md       # 本文件
│   └── PRD_AI_INNOVATION.md    # 竞赛PRD
├── package.json
├── vite.config.js
├── vercel.json                 # (待清理)
└── netlify.toml                # (待清理)
```

---

**最后更新**: 2026-04-03T06:45 by Antigravity (基于完整代码审计)
