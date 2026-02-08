
# AI 智能望诊模块配置指南

本项目集成了 **Google Gemini Pro / Flash** 模型进行AI面诊和舌诊分析。

## 1. 本地测试 (Local Development)

### 方式一：模拟模式 (Mock Mode) - **推荐**
无需任何配置。如果系统检测不到 API Key，会自动使用内置的模拟数据进行演示。
- **优点**：快速验证流程，无需魔法上网，无需 API Key。
- **缺点**：分析结果是固定的（脾虚湿盛）。

### 方式二：真实 AI 模式 (Real AI Mode)
如果您想在本地调用真实的 Gemini 接口：

1.  复制 `.env.local.example` 为 `.env.local`
    ```bash
    cp .env.local.example .env.local
    ```
2.  在 `.env.local` 中填入您的 Gemini API Key：
    ```
    GEMINI_API_KEY=your_api_key_here
    ```
3.  **注意**：由于 Vercel Serverless Function (`api/analyze-diagnosis.js`) 依赖 Vercel 环境，在纯 Vite 环境 (`npm run dev`) 下无法直接运行后端 API。
    - **解决方法**：您需要安装 Vercel CLI 并使用 `vercel dev` 启动项目。
    ```bash
    npm i -g vercel
    vercel dev
    ```

## 2. 生产环境部署 (Vercel)

1.  在 Vercel 项目控制台，进入 **Settings -> Environment Variables**。
2.  添加变量：
    - Key: `GEMINI_API_KEY`
    - Value: `您的_Gemini_Key`
3.  重新部署项目 (Redeploy)。

## 3. 模型说明
目前默认使用 `gemini-1.5-flash` 模型，它具有：
- **速度快**：几秒内返回分析结果。
- **免费额度高**：适合个人开发者和测试使用。
- **多模态**：原生支持图片理解。
