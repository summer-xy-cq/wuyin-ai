// AI风格音乐数据
// 模拟AI生成的五音风格音乐（实际使用预置曲目）

export const AI_MUSIC = {
    gong: {
        tone: '宫',
        element: '土',
        title: '大地之韵·AI',
        description: 'AI合成的宫调旋律，厚重稳健，健脾和胃。',
        src: '/music/guzheng_generic.mp3', // AI合成宫调
        duration: '5:30'
    },
    shang: {
        tone: '商',
        element: '金',
        title: '秋风清韵·AI',
        description: 'AI合成的商调旋律，清亮肃静，宣肺理气。',
        src: '/music/shimian.mp3', // 使用十面埋伏模拟
        duration: '4:45'
    },
    jiao: {
        tone: '角',
        element: '木',
        title: '春生之声·AI',
        description: 'AI合成的角调旋律，舒展生发，疏肝解郁。',
        src: '/music/chunjiang.mp3', // 使用春江花月夜模拟
        duration: '5:15'
    },
    zhi: {
        tone: '徵',
        element: '火',
        title: '烈阳欢歌·AI',
        description: 'AI合成的徵调旋律，热烈激昂，养心安神。',
        src: '/music/xixiangfeng.mp3', // 使用喜相逢模拟
        duration: '4:30'
    },
    yu: {
        tone: '羽',
        element: '水',
        title: '深水静流·AI',
        description: 'AI合成的羽调旋律，深沉悠远，补肾固精。',
        src: '/music/hangong.mp3', // 使用汉宫秋月模拟
        duration: '6:00'
    }
}

// 根据体质获取AI音乐
export function getAIMusicByConstitution(constitutionKey) {
    const toneMap = {
        pinghe: 'gong',
        qixu: 'gong',
        yangxu: 'zhi',
        yinxu: 'yu',
        tanshi: 'gong',
        shire: 'jiao',
        xueyu: 'jiao',
        qiyu: 'jiao',
        tebing: 'gong'
    }

    const toneKey = toneMap[constitutionKey] || 'gong'
    return AI_MUSIC[toneKey]
}
