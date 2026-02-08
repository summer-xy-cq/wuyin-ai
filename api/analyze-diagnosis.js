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

        const prompt = `
    你是一位精通中医望诊的专家。请根据提供的两张图片（第一张为面部，第二张为舌象）进行综合分析。
    
    任务：
    1. 分析面部：面色（红/白/黄/青/黑）、光泽（得神/失神）、五官特征（如眼袋、黑眼圈、痘痘位置）。
    2. 分析舌象：舌质（颜色、老嫩）、舌苔（颜色、厚薄、润燥）、舌形（胖大、齿痕、裂纹）。
    3. 综合辩证：结合面部和舌象，推断体质类型（如脾虚湿盛、阴虚火旺等）。
    4. 给出建议：针对该体质的饮食和生活调理建议。

    输出必须为严格的 JSON 格式，不包含 markdown 标记（如 \`\`\`json）：
    {
      "face": {
        "color": "面色描述",
        "luster": "光泽描述",
        "features": ["特征1", "特征2"]
      },
      "tongue": {
        "color": "舌质描述",
        "coating": "舌苔描述",
        "shape": "舌形描述"
      },
      "diagnosis": "核心体质诊断（4-8字）",
      "advice": "100字左右的调理建议"
    }
    `;

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
