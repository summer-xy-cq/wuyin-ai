import { GoogleGenerativeAI } from '@google-generative-ai';

// This function will run on Vercel as a Serverless Function
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { faceImage, tongueImage } = req.body

        if (!faceImage || !tongueImage) {
            return res.status(400).json({ error: 'Missing images' })
        }

        // Check for API Key
        const apiKey = process.env.GEMINI_API_KEY

        // MOCK MODE: If no API key is present, return a simulated response
        if (!apiKey) {
            console.log('No GEMINI_API_KEY found, returning mock response')
            await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate delay

            return res.status(200).json({
                face: {
                    color: '面色淡白',
                    luster: '少泽',
                    features: ['眼袋明显', '额头无痘']
                },
                tongue: {
                    color: '舌质淡',
                    coating: '苔白腻',
                    shape: '边有齿痕'
                },
                diagnosis: '脾虚湿盛',
                advice: '检测结果显示您有脾虚湿盛的倾向。建议强健脾胃，祛湿化痰。饮食上宜清淡，少食生冷油腻，多食山药、薏米、赤小豆。作息上注意避免熬夜，适当运动以助阳气升发。'
            })
        }

        // REAL MODE: Call Google Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-1.5-flash for speed and multimodal capability, or gemini-pro-vision
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Helper to convert base64 to Google Generative AI format
        function fileToGenerativePart(base64Data, mimeType) {
            // Remove header if present (e.g., "data:image/jpeg;base64,")
            const base64Content = base64Data.split(',')[1] || base64Data;
            return {
                inlineData: {
                    data: base64Content,
                    mimeType
                },
            };
        }

        const facePart = fileToGenerativePart(faceImage, "image/jpeg");
        const tonguePart = fileToGenerativePart(tongueImage, "image/jpeg");

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

根据望诊特征，推断最接近的中医体质类型：

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

必须以严格JSON格式输出，不要任何markdown标记：

{
  "face": {
    "color": "面色颜色（从青/赤/黄/白/黑/红润中选择最贴切的一个）",
    "luster": "光泽度（得神/少神/失神）",
    "features": ["特征1", "特征2", "特征3"]
  },
  "tongue": {
    "color": "舌质颜色（淡红/淡白/红/绛/青紫）",
    "coating": "舌苔描述（如：薄白/黄腻/白厚腻/少苔等）",
    "shape": "舌形描述（如：胖大边有齿痕/瘦薄/有裂纹等）"
  },
  "diagnosis": "从九种体质中选择最贴切的一种（平和质/气虚质/阳虚质/阴虚质/痰湿质/湿热质/血瘀质/气郁质/特禀质）",
  "advice": "针对该体质的调理建议，包括饮食、起居、运动三方面，100-150字"
}

注意：
1. 如果无法清晰判断，选择最接近的体质类型
2. 特征描述要具体、专业、符合中医术语
3. 严禁输出JSON以外的任何内容`,

        const result = await model.generateContent([prompt, facePart, tonguePart]);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const jsonResult = JSON.parse(text);
        return res.status(200).json(jsonResult);

    } catch (error) {
        console.error('AI Analysis Error:', error)
        return res.status(500).json({ error: 'Analysis failed: ' + error.message })
    }
}
