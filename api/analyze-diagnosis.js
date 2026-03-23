/**
 * 望诊分析 API - 使用硅基流动 Qwen VL 模型
 *
 * 切换说明：
 * - 原 Google Gemini → 现用 SiliconFlow Qwen2.5-VL-72B-Instruct
 * - base_url: https://api.siliconflow.cn/v1
 * - 模型: Qwen/Qwen2.5-VL-72B-Instruct (支持多图输入)
 */

// Node 18+ 自带 fetch，无需额外导入

// CORS headers - 允许跨域访问
const CORS_HEADERS = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
}

export default async function handler(req, res) {
    // 处理 CORS 预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).set(CORS_HEADERS).end()
        return
    }

    if (req.method !== 'POST') {
        res.status(405).set({ 'Content-Type': 'application/json' }).json({ error: 'Method not allowed' })
        return
    }

    try {
        const { faceImage, tongueImage } = req.body

        if (!faceImage || !tongueImage) {
            res.status(400).json({ error: 'Missing faceImage or tongueImage' })
            return
        }

        const apiKey = process.env.SILICONFLOW_API_KEY

        // MOCK 模式：无 API Key 时返回模拟数据
        if (!apiKey) {
            console.log('[望诊API] 未配置 SILICONFLOW_API_KEY，返回模拟数据')
            await new Promise(resolve => setTimeout(resolve, 2000))

            res.status(200).set(CORS_HEADERS).json({
                face: { color: '面色淡白', luster: '少泽', features: ['眼袋明显', '额头无痘'] },
                tongue: { color: '舌质淡', coating: '苔白腻', shape: '边有齿痕' },
                diagnosis: '脾虚湿盛',
                advice: '检测结果显示您有脾虚湿盛的倾向。建议强健脾胃，祛湿化痰。饮食上宜清淡，少食生冷油腻，多食山药、薏米、赤小豆。作息上注意避免熬夜，适当运动以助阳气升发。'
            })
            return
        }

        // --- 真实模式：调用硅基流动 Qwen VL ---
        const siliconFlowUrl = 'https://api.siliconflow.cn/v1/chat/completions'

        const prompt = `你是一位拥有30年临床经验的中医望诊专家。请根据用户提供的面部照片和舌象照片，严格按照以下标准进行专业分析。

## 一、面色分析标准

观察面部整体色泽，按中医五色辨证：
- **青色**：主寒证、痛证、气滞、血瘀
- **赤色**：主热证（满面通红为实热，两颧潮红为虚热）
- **黄色**：主脾虚、湿证（萎黄为脾胃气虚，黄胖为脾虚湿蕴）
- **白色**：主虚证、寒证（㿠白为阳虚，淡白为血虚）
- **黑色**：主肾虚、寒证、水饮、血瘀

光泽度判断：
- **得神**：面色荣润，含蓄不露，光明润泽
- **少神**：面色少华，晦暗不润
- **失神**：面色晦暗，枯槁无华

## 二、舌象分析标准

**舌质（舌体）**：
- **颜色**：淡红（正常）、淡白（气血两虚/阳虚）、红（热证）、绛（热入营血）、青紫（血瘀）
- **老嫩**：苍老（实证）、娇嫩（虚证）
- **胖瘦**：胖大（脾虚湿盛）、瘦薄（气血两虚/阴虚）
- **齿痕**：边有齿痕（脾虚湿盛）
- **裂纹**：有裂纹（阴血亏虚）

**舌苔**：
- **颜色**：白苔（表证/寒证）、黄苔（里证/热证）、灰黑苔（寒极/热极）
- **厚薄**：薄苔（正常/病轻）、厚苔（病邪较盛/痰湿食积）
- **润燥**：润苔（正常）、燥苔（津液已伤）、滑苔（寒湿内盛）
- **腻腐**：腻苔（湿浊/痰饮/食积）、腐苔（食积/痰浊）

## 三、九种体质对应特征

1. **平和质**：面色红润有光泽，舌质淡红，舌苔薄白
2. **气虚质**：面色㿠白或萎黄，少气懒言，舌淡胖有齿痕
3. **阳虚质**：面色㿠白或晦暗，畏寒肢冷，舌淡胖嫩，苔白滑
4. **阴虚质**：面色潮红，两颧红赤，舌红少津，少苔或无苔
5. **痰湿质**：面色黄胖，油脂较多，舌体胖大，苔白腻
6. **湿热质**：面垢油光，易生痤疮，舌质偏红，苔黄腻
7. **血瘀质**：面色晦暗，色素沉着，口唇黯淡，舌质紫暗或有瘀斑
8. **气郁质**：面色忧郁，神情抑郁，舌淡红，苔薄白
9. **特禀质**：面色可能正常或有过敏表现，舌质可正常或偏红

## 四、输出要求

严格以JSON格式输出，不要任何markdown标记：

{
  "face": {
    "color": "面色颜色",
    "luster": "光泽度（得神/少神/失神）",
    "features": ["特征1", "特征2", "特征3"]
  },
  "tongue": {
    "color": "舌质颜色",
    "coating": "舌苔描述",
    "shape": "舌形描述"
  },
  "diagnosis": "九种体质之一",
  "advice": "调理建议，100-150字，包含饮食、起居、运动"
}

注意：
1. 如果无法清晰判断，选择最接近的体质类型
2. 特征描述要具体、专业、符合中医术语
3. 严禁输出JSON以外的任何内容`

        // 构建消息内容 - 第一张是面部，第二张是舌象
        // Qwen VL 支持 base64 data URL 格式
        const messages = [
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: { url: normalizeBase64Image(faceImage), detail: 'high' }
                    },
                    {
                        type: 'image_url',
                        image_url: { url: normalizeBase64Image(tongueImage), detail: 'high' }
                    },
                    {
                        type: 'text',
                        text: `请分析上面两张图片：第一张是面部照片，第二张是舌象照片。\n\n${prompt}`
                    }
                ]
            }
        ]

        const siliconResponse = await fetch(siliconFlowUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'Qwen/Qwen2.5-VL-72B-Instruct',
                messages: messages,
                temperature: 0.3,
                max_tokens: 2048
            })
        })

        if (!siliconResponse.ok) {
            const errText = await siliconResponse.text()
            console.error('[望诊API] 硅基流动调用失败:', siliconResponse.status, errText)
            res.status(500).set(CORS_HEADERS).json({ error: `AI服务调用失败: ${siliconResponse.status}` })
            return
        }

        const result = await siliconResponse.json()
        let text = result.choices?.[0]?.message?.content || ''

        // 清理可能的 markdown 代码块
        text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

        // 解析 JSON 结果
        let jsonResult
        try {
            jsonResult = JSON.parse(text)
        } catch (parseErr) {
            console.error('[望诊API] JSON解析失败:', text)
            // 尝试提取 JSON 部分
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                jsonResult = JSON.parse(jsonMatch[0])
            } else {
                res.status(500).set(CORS_HEADERS).json({ error: 'AI返回格式解析失败' })
                return
            }
        }

        res.status(200).set(CORS_HEADERS).json(jsonResult)

    } catch (error) {
        console.error('[望诊API] 错误:', error)
        res.status(500).set(CORS_HEADERS).json({ error: 'Analysis failed: ' + error.message })
    }
}

/**
 * 将 base64 数据标准化为 data URL 格式
 * 支持的输入格式：
 *   - "data:image/jpeg;base64,/9j/4AAQ..." (已有 data URL 头)
 *   - "/9j/4AAQ..." (纯 base64 字符串，无头)
 *   - "data:image/png;base64,iVBORw0..." (已有 PNG 头)
 */
function normalizeBase64Image(imageData) {
    if (!imageData) return null
    // 如果已经有 data URL 格式，直接返回
    if (imageData.startsWith('data:')) {
        return imageData
    }
    // 默认假设是 JPEG（移动端相机常用格式）
    return `data:image/jpeg;base64,${imageData}`
}
