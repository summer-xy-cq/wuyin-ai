// 免费版问卷 - 27题（精简版）
// 基于GB/T 46939-2025《中医体质分类与判定》国家标准

export const QUESTIONS_FREE = [
    // 平和质 (3题)
    { id: 1, text: '您精力充沛吗？', type: 'pinghe' },
    { id: 2, text: '您容易疲乏吗？', type: 'pinghe', reverse: true },
    { id: 3, text: '您适应环境的能力（如寒热干湿）很强吗？', type: 'pinghe' },

    // 气虚质 (3题)
    { id: 4, text: '您容易气短、呼吸短促吗？', type: 'qixu' },
    { id: 5, text: '您说话声音低弱无力吗？', type: 'qixu' },
    { id: 6, text: '您比别人容易感冒吗？', type: 'qixu' },

    // 阳虚质 (3题)
    { id: 7, text: '您手脚发凉吗？', type: 'yangxu' },
    { id: 8, text: '您感到怕冷、衣服比别人穿得多吗？', type: 'yangxu' },
    { id: 9, text: '您吃凉的东西会感到不舒服吗？', type: 'yangxu' },

    // 阴虚质 (3题)
    { id: 10, text: '您感到口干咽燥、总想喝水吗？', type: 'yinxu' },
    { id: 11, text: '您手心脚心发热吗？', type: 'yinxu' },
    { id: 12, text: '您眼睛干涩吗？', type: 'yinxu' },

    // 痰湿质 (3题)
    { id: 13, text: '您感到腹部肥满松软吗？', type: 'tanshi' },
    { id: 14, text: '您感到身体沉重不轻松吗？', type: 'tanshi' },
    { id: 15, text: '您嘴里有黏黏的感觉吗？', type: 'tanshi' },

    // 湿热质 (3题)
    { id: 16, text: '您面部或鼻部有油腻感吗？', type: 'shire' },
    { id: 17, text: '您易生痤疮或疮疖吗？', type: 'shire' },
    { id: 18, text: '您感到口苦或嘴里有异味吗？', type: 'shire' },

    // 血瘀质 (3题)
    { id: 19, text: '您皮肤不知不觉出现青紫瘀斑吗？', type: 'xueyu' },
    { id: 20, text: '您面色或口唇黯淡吗？', type: 'xueyu' },
    { id: 21, text: '您容易忘事吗？', type: 'xueyu' },

    // 气郁质 (3题)
    { id: 22, text: '您感到闷闷不乐、情绪低沉吗？', type: 'qiyu' },
    { id: 23, text: '您容易精神紧张、焦虑不安吗？', type: 'qiyu' },
    { id: 24, text: '您无缘无故叹气吗？', type: 'qiyu' },

    // 特禀质 (3题)
    { id: 25, text: '您容易过敏（药物、食物、花粉等）吗？', type: 'tebing' },
    { id: 26, text: '您皮肤一抓就红，并出现抓痕吗？', type: 'tebing' },
    { id: 27, text: '即使不感冒，您也经常打喷嚏、流鼻涕吗？', type: 'tebing' }
]

// 选项
export const OPTIONS = [
    { value: 1, label: '没有' },
    { value: 2, label: '很少' },
    { value: 3, label: '有时' },
    { value: 4, label: '经常' },
    { value: 5, label: '总是' }
]
