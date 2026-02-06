// VIP版问卷 - 60题（标准版）
// 基于中华中医药学会《中医体质分类与判定》标准完整版

export const QUESTIONS_VIP = [
    // ========== 平和质 (8题) ==========
    { id: 1, text: '您精力充沛吗？', type: 'pinghe' },
    { id: 2, text: '您容易疲乏吗？', type: 'pinghe', reverse: true },
    { id: 3, text: '您说话声音洪亮有力吗？', type: 'pinghe' },
    { id: 4, text: '您感到闷闷不乐、情绪低沉吗？', type: 'pinghe', reverse: true },
    { id: 5, text: '您睡眠质量好吗（入睡快、睡得深）？', type: 'pinghe' },
    { id: 6, text: '您容易感冒吗？', type: 'pinghe', reverse: true },
    { id: 7, text: '您适应环境的能力（如寒热干湿）很强吗？', type: 'pinghe' },
    { id: 8, text: '您的情绪稳定、心态平和吗？', type: 'pinghe' },

    // ========== 气虚质 (8题) ==========
    { id: 9, text: '您容易气短、呼吸短促吗？', type: 'qixu' },
    { id: 10, text: '您说话声音低弱无力吗？', type: 'qixu' },
    { id: 11, text: '您容易心慌吗？', type: 'qixu' },
    { id: 12, text: '您容易头晕或站起时眩晕吗？', type: 'qixu' },
    { id: 13, text: '您比别人容易感冒吗？', type: 'qixu' },
    { id: 14, text: '您喜欢安静、懒得说话吗？', type: 'qixu' },
    { id: 15, text: '您活动量稍大就容易出虚汗吗？', type: 'qixu' },
    { id: 16, text: '您感到精神疲惫、提不起劲吗？', type: 'qixu' },

    // ========== 阳虚质 (7题) ==========
    { id: 17, text: '您手脚发凉吗？', type: 'yangxu' },
    { id: 18, text: '您胃脘部、背部或腰膝部怕冷吗？', type: 'yangxu' },
    { id: 19, text: '您感到怕冷、衣服比别人穿得多吗？', type: 'yangxu' },
    { id: 20, text: '您比一般人耐受不了寒冷吗？', type: 'yangxu' },
    { id: 21, text: '您吃凉的东西会感到不舒服或怕吃凉东西吗？', type: 'yangxu' },
    { id: 22, text: '您受凉后容易腹泻吗？', type: 'yangxu' },
    { id: 23, text: '您小便清长、夜尿多吗？', type: 'yangxu' },

    // ========== 阴虚质 (8题) ==========
    { id: 24, text: '您感到口干咽燥、总想喝水吗？', type: 'yinxu' },
    { id: 25, text: '您手心脚心发热吗？', type: 'yinxu' },
    { id: 26, text: '您感到身体、脸上发热吗？', type: 'yinxu' },
    { id: 27, text: '您眼睛干涩吗？', type: 'yinxu' },
    { id: 28, text: '您的皮肤干燥起屑吗？', type: 'yinxu' },
    { id: 29, text: '您大便干结吗？', type: 'yinxu' },
    { id: 30, text: '您容易失眠、睡眠不好吗？', type: 'yinxu' },
    { id: 31, text: '您面颊潮红或偏红吗？', type: 'yinxu' },

    // ========== 痰湿质 (8题) ==========
    { id: 32, text: '您感到腹部肥满松软吗？', type: 'tanshi' },
    { id: 33, text: '您感到身体沉重不轻松吗？', type: 'tanshi' },
    { id: 34, text: '您额头部位油脂分泌多吗？', type: 'tanshi' },
    { id: 35, text: '您嘴里有黏黏的感觉吗？', type: 'tanshi' },
    { id: 36, text: '您上眼睑比别人肿（上眼睑有轻微隆起）吗？', type: 'tanshi' },
    { id: 37, text: '您痰多，特别是咽喉部总感到有痰堵着吗？', type: 'tanshi' },
    { id: 38, text: '您舌苔厚腻或有舌苔厚厚的感觉吗？', type: 'tanshi' },
    { id: 39, text: '您睡觉时打鼾吗？', type: 'tanshi' },

    // ========== 湿热质 (7题) ==========
    { id: 40, text: '您面部或鼻部有油腻感或者油亮发光吗？', type: 'shire' },
    { id: 41, text: '您易生痤疮或疮疖吗？', type: 'shire' },
    { id: 42, text: '您感到口苦或嘴里有异味吗？', type: 'shire' },
    { id: 43, text: '您大便黏滞不爽、有解不尽的感觉吗？', type: 'shire' },
    { id: 44, text: '您小便时尿道有发热感、尿色浓吗？', type: 'shire' },
    { id: 45, text: '您会阴部潮湿或下体有异味吗？', type: 'shire' },
    { id: 46, text: '您感到身体沉重困倦、头昏脑涨吗？', type: 'shire' },

    // ========== 血瘀质 (7题) ==========
    { id: 47, text: '您皮肤不知不觉出现青紫瘀斑吗？', type: 'xueyu' },
    { id: 48, text: '您两颧部有细微红丝（毛细血管扩张）吗？', type: 'xueyu' },
    { id: 49, text: '您身体上有哪里疼痛（头痛、胸痛、关节痛等）吗？', type: 'xueyu' },
    { id: 50, text: '您面色或口唇黯淡或发紫吗？', type: 'xueyu' },
    { id: 51, text: '您有黑眼圈吗？', type: 'xueyu' },
    { id: 52, text: '您容易忘事（健忘）吗？', type: 'xueyu' },
    { id: 53, text: '您皮肤粗糙、色素沉着吗？', type: 'xueyu' },

    // ========== 气郁质 (7题) ==========
    { id: 54, text: '您感到闷闷不乐、情绪低沉吗？', type: 'qiyu' },
    { id: 55, text: '您容易精神紧张、焦虑不安吗？', type: 'qiyu' },
    { id: 56, text: '您多愁善感、情绪敏感吗？', type: 'qiyu' },
    { id: 57, text: '您无缘无故叹气吗？', type: 'qiyu' },
    { id: 58, text: '您容易感到害怕或受到惊吓吗？', type: 'qiyu' },
    { id: 59, text: '您胸肋部或乳房有胀满感、走窜疼痛吗？', type: 'qiyu' },
    { id: 60, text: '您咽喉部有异物感、吐之不出、咽之不下吗？', type: 'qiyu' },

    // ========== 特禀质 (7题) ==========
    { id: 61, text: '您容易过敏（药物、食物、气味、花粉等）吗？', type: 'tebing' },
    { id: 62, text: '您没有感冒也经常打喷嚏吗？', type: 'tebing' },
    { id: 63, text: '您没有感冒也经常鼻塞、流鼻涕吗？', type: 'tebing' },
    { id: 64, text: '您容易患荨麻疹（皮肤过敏、风团、风疹块）吗？', type: 'tebing' },
    { id: 65, text: '您皮肤一抓就红，并出现抓痕吗？', type: 'tebing' },
    { id: 66, text: '您皮肤容易起湿疹（皮肤发红、瘙痒、起疱）吗？', type: 'tebing' },
    { id: 67, text: '您有过因某种食物、药物、花粉等引起哮喘的经历吗？', type: 'tebing' }
]

// 选项
export const OPTIONS = [
    { value: 1, label: '没有' },
    { value: 2, label: '很少' },
    { value: 3, label: '有时' },
    { value: 4, label: '经常' },
    { value: 5, label: '总是' }
]
