// 体质类型数据
export const CONSTITUTIONS = {
    pinghe: {
        key: 'pinghe',
        name: '平和质',
        element: '平',
        desc: '阴阳气血调和，体态适中，面色红润，精力充沛。',
        feature: '身体健康，较少患病，对自然环境和社会环境适应能力较强。',
        tone: 'gong',
        toneName: '宫',
        toneElement: '土',
        musicDesc: '宫音悠扬和谐，中正平和，如大地般宽厚，调和五脏。',
        tracks: [
            { title: '春江花月夜', src: '/music/chunjiang.mp3' },
            { title: '高山流水', src: '/music/gaoshan.mp3' }
        ],
        advice: {
            diet: '饮食有节，不吃过冷过热，细嚼慢咽，饮食多样化。',
            living: '起居规律，睡眠充足，劳逸结合，保持乐观心态。',
            sports: '根据年龄和体力，坚持适当运动，如散步、慢跑、太极拳。'
        },
        color: '#D4AF37'
    },
    qixu: {
        key: 'qixu',
        name: '气虚质',
        element: '虚',
        desc: '元气不足，肌肉松软，声音低弱，易气短，易疲乏，易感冒。',
        feature: '气短懒言，容易疲劳，常自汗出，舌淡红，舌边有齿痕。',
        tone: 'gong',
        toneName: '宫',
        toneElement: '土',
        musicDesc: '宫音入脾，脾为气血生化之源。听宫音可健脾益气，改善疲乏。',
        tracks: [
            { title: '平湖秋月', src: '/music/pinghu.mp3' },
            { title: '春江花月夜', src: '/music/chunjiang.mp3' }
        ],
        advice: {
            diet: '多吃益气健脾的食物，如黄豆、白扁豆、鸡肉、大枣。少吃空心菜、生萝卜等耗气食物。',
            living: '注意保暖，避免劳动过度，不要熬夜，保持充足睡眠。',
            sports: '适合柔缓的运动，如八段锦、太极拳，不宜剧烈运动。'
        },
        color: '#D4AF37'
    },
    yangxu: {
        key: 'yangxu',
        name: '阳虚质',
        element: '寒',
        desc: '阳气不足，手脚发凉，怕冷，喜热饮，性格安静，面色偏白。',
        feature: '畏寒怕冷，手足不温，喜热饮食，精神不振，舌淡胖嫩。',
        tone: 'zhi',
        toneName: '徵',
        toneElement: '火',
        musicDesc: '徵音入心，属火。听徵音可振奋阳气，温暖身心，热烈激昂。',
        tracks: [
            { title: '百鸟朝凤', src: '/music/bainiao.mp3' },
            { title: '喜相逢', src: '/music/xixiangfeng.mp3' }
        ],
        advice: {
            diet: '多吃甘温益气的食物，如羊肉、韭菜、生姜、桂圆。少吃生冷寒凉食物。',
            living: '居住环境宜阳光充足，注意足部、背部保暖，多晒太阳。',
            sports: '适合动静结合的运动，要在阳光充足时锻炼，如快走、慢跑。'
        },
        color: '#A63434'
    },
    yinxu: {
        key: 'yinxu',
        name: '阴虚质',
        element: '热',
        desc: '阴液亏少，手心脚心热，口干咽燥，易失眠，性急躁，体形偏瘦。',
        feature: '口燥咽干，手足心热，喜冷饮，大便干燥，舌红少津。',
        tone: 'yu',
        toneName: '羽',
        toneElement: '水',
        musicDesc: '羽音入肾，属水。听羽音可滋阴润燥，清热安神，深沉悠远。',
        tracks: [
            { title: '二泉映月', src: '/music/erquan.mp3' },
            { title: '汉宫秋月', src: '/music/hangong.mp3' }
        ],
        advice: {
            diet: '多吃甘凉滋润的食物，如鸭肉、百合、银耳、黑芝麻。少吃温热燥烈之品。',
            living: '避免熬夜，保持皮肤清洁，中午宜小睡，居室保持安静。',
            sports: '适合中小强度运动，如太极、游泳，控制出汗量，避免大汗伤阴。'
        },
        color: '#1E3A5F'
    },
    tanshi: {
        key: 'tanshi',
        name: '痰湿质',
        element: '湿',
        desc: '痰湿凝聚，腹部肥满，皮肤油腻，汗多黏腻，身重困倦，口黏。',
        feature: '形体肥胖，腹部肥满松软，面部油脂较多，舌苔厚腻。',
        tone: 'gong',
        toneName: '宫',
        toneElement: '土',
        musicDesc: '宫音健脾除湿，帮助身体运化水湿，厚重稳健。',
        tracks: [
            { title: '高山流水', src: '/music/gaoshan.mp3' },
            { title: '云水禅心', src: '/music/yunshui.mp3' }
        ],
        advice: {
            diet: '饮食清淡，多吃健脾利湿的食物，如冬瓜、薏米、赤小豆。少吃甜食、肥肉。',
            living: '居住环境宜干燥，穿衣宽大透气，多晒太阳，避免潮湿。',
            sports: '应长期坚持中长跑、球类等运动，增加出汗量，促进代谢。'
        },
        color: '#D4AF37'
    },
    shire: {
        key: 'shire',
        name: '湿热质',
        element: '蕴',
        desc: '湿热内蕴，面垢油光，易生痤疮，口苦口臭，心烦懈怠，小便短赤。',
        feature: '面部油脂分泌多，容易长痘，身重困倦，大便黏滞。',
        tone: 'jiao',
        toneName: '角',
        toneElement: '木',
        musicDesc: '角音入肝，疏泄郁热，舒展生发，配合清热利湿。',
        tracks: [
            { title: '阳关三叠', src: '/music/yangguan.mp3' },
            { title: '广陵散', src: '/music/guangling.mp3' }
        ],
        advice: {
            diet: '饮食清淡，多吃甘寒食物，如绿豆、空心菜、芹菜。禁酒，少吃辛辣滋腻食物。',
            living: '避开潮湿环境，保持二便通畅，穿宽松透气衣物。',
            sports: '大强度运动以消耗体力，如长跑、爬山，要在凉爽时段进行。'
        },
        color: '#2D6A4F'
    },
    xueyu: {
        key: 'xueyu',
        name: '血瘀质',
        element: '滞',
        desc: '血行不畅，面色晦暗，皮肤粗糙，易有瘀斑，健忘，口唇黯淡。',
        feature: '肤色晦黯，色素沉着，容易出现瘀斑，口唇黯淡紫暗。',
        tone: 'jiao',
        toneName: '角',
        toneElement: '木',
        musicDesc: '角音入肝，主疏泄。听角音可帮助行气活血，化瘀通络。',
        tracks: [
            { title: '广陵散', src: '/music/guangling.mp3' },
            { title: '胡笳十八拍', src: '/music/hujia.mp3' }
        ],
        advice: {
            diet: '多吃具有行气活血功能的食物，如山楂、黑豆、金桔、玫瑰花。',
            living: '保持心情舒畅，不可过于安逸，以免气机郁滞。',
            sports: '可进行舞蹈、瑜伽、太极剑等有助于气血流通的运动。'
        },
        color: '#2D6A4F'
    },
    qiyu: {
        key: 'qiyu',
        name: '气郁质',
        element: '郁',
        desc: '气机郁滞，神情抑郁，多愁善感，常叹气，乳房胀痛，胸闷。',
        feature: '神情抑郁，忧虑脆弱，情绪低落，容易紧张焦虑。',
        tone: 'jiao',
        toneName: '角',
        toneElement: '木',
        musicDesc: '角音入肝，调达气机。听角音可疏肝解郁，开阔心胸，舒展生发。',
        tracks: [
            { title: '胡笳十八拍', src: '/music/hujia.mp3' },
            { title: '阳关三叠', src: '/music/yangguan.mp3' }
        ],
        advice: {
            diet: '多吃行气解郁的食物，如佛手、橙子、玫瑰花。少吃收敛酸涩之物。',
            living: '多参加社交活动，居住环境宜明亮，听欢快音乐。',
            sports: '参加团体运动，如球类、登山、旅游，大声喊叫抒发胸志。'
        },
        color: '#2D6A4F'
    },
    tebing: {
        key: 'tebing',
        name: '特禀质',
        element: '敏',
        desc: '先天失常，容易过敏，药物、食物、花粉过敏，或有遗传病。',
        feature: '过敏体质，易患哮喘、荨麻疹、花粉症等过敏性疾病。',
        tone: 'gong',
        toneName: '宫',
        toneElement: '土',
        musicDesc: '特禀体质需固本培元，宫音作为五音之首，可调和气血，增强体质。',
        tracks: [
            { title: '云水禅心', src: '/music/yunshui.mp3' },
            { title: '平湖秋月', src: '/music/pinghu.mp3' }
        ],
        advice: {
            diet: '饮食清淡粗细搭配，少吃荞麦、蚕豆等发物。根据过敏源避免特定食物。',
            living: '保持室内清洁，避免接触花粉、宠物毛发等致敏源。',
            sports: '不宜过于剧烈，根据具体过敏源选择室内或室外运动。'
        },
        color: '#D4AF37'
    }
}

// 五音理论数据
export const FIVE_TONES = {
    gong: {
        name: '宫',
        element: '土',
        organ: '脾',
        emotion: '思',
        feature: '厚重稳健，健脾和胃',
        description: '宫音浑厚、庄重、沉稳，如大地般宽广厚实。能健脾益胃，调理消化功能，安定情绪。',
        color: '#D4AF37'
    },
    shang: {
        name: '商',
        element: '金',
        organ: '肺',
        emotion: '悲',
        feature: '清亮肃静，宣肺理气',
        description: '商音清亮、刚健、肃穆，如秋风般清爽萧瑟。能宣肺理气，调节呼吸，缓解悲伤。',
        color: '#9CA3AF'
    },
    jiao: {
        name: '角',
        element: '木',
        organ: '肝',
        emotion: '怒',
        feature: '舒展生发，疏肝解郁',
        description: '角音舒展、流畅、生机，如春天般蓬勃向上。能疏肝解郁，调畅气机，平息怒气。',
        color: '#2D6A4F'
    },
    zhi: {
        name: '徵',
        element: '火',
        organ: '心',
        emotion: '喜',
        feature: '热烈激昂，养心安神',
        description: '徵音热烈、欢快、激昂，如夏日般炽热奔放。能养心安神，振奋精神，调节喜乐。',
        color: '#A63434'
    },
    yu: {
        name: '羽',
        element: '水',
        organ: '肾',
        emotion: '恐',
        feature: '深沉悠远，补肾固精',
        description: '羽音深沉、柔和、悠远，如冬水般静谧深邃。能补肾固精，滋阴降火，化解恐惧。',
        color: '#1E3A5F'
    }
}
