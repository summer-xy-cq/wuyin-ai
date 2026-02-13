// 体质评分算法
// 基于《中医体质分类与判定》GB/T 46939-2025 国家标准

import { CONSTITUTIONS } from '../data/constitutions.js'

/**
 * 计算体质评分
 * @param {Object} answers - 用户答题结果 { questionId: score }
 * @param {Array} questions - 问卷题目
 * @returns {Object} 评分结果
 */
export function calculateScores(answers, questions) {
    console.log('[calculateScores] CONSTITUTIONS keys:', Object.keys(CONSTITUTIONS))
    console.log('[calculateScores] questions count:', questions.length)
    console.log('[calculateScores] answers:', answers)

    // 统计每种体质的原始分
    const rawScores = {}
    const questionCounts = {}

    // 初始化
    Object.keys(CONSTITUTIONS).forEach(key => {
        rawScores[key] = 0
        questionCounts[key] = 0
    })

    // 计算原始分
    questions.forEach(q => {
        const answer = answers[q.id]
        console.log(`[calculateScores] Q${q.id} (${q.type}): answer=${answer}`)
        if (answer !== undefined) {
            let score = answer
            // 反向计分题目
            if (q.reverse) {
                score = 6 - answer // 1->5, 2->4, 3->3, 4->2, 5->1
            }
            rawScores[q.type] += score
            questionCounts[q.type]++
        }
    })

    console.log('[calculateScores] rawScores:', rawScores)
    console.log('[calculateScores] questionCounts:', questionCounts)

    // 计算转化分
    // 公式：转化分 = [(原始分 - 条目数) / (条目数 × 4)] × 100
    const transformedScores = {}

    Object.keys(rawScores).forEach(key => {
        const raw = rawScores[key]
        const count = questionCounts[key]
        if (count > 0) {
            transformedScores[key] = Math.round(((raw - count) / (count * 4)) * 100)
        } else {
            transformedScores[key] = 0
        }
    })

    const result = {
        raw: rawScores,
        transformed: transformedScores,
        counts: questionCounts
    }

    console.log('[calculateScores] 结果:', result)
    return result
}

/**
 * 判定体质类型
 * @param {Object} transformedScores - 转化分
 * @returns {Object} 判定结果
 */
export function determineConstitution(transformedScores) {
    const results = {}
    console.log('[determineConstitution] 输入分数:', transformedScores)

    // 判定每种体质
    Object.keys(transformedScores).forEach(key => {
        const score = transformedScores[key]

        if (key === 'pinghe') {
            // 平和质判定标准
            const otherScores = Object.entries(transformedScores)
                .filter(([k]) => k !== 'pinghe')
                .map(([, v]) => v)
            const maxOther = Math.max(...otherScores)

            if (score >= 60 && maxOther < 30) {
                results[key] = { status: 'yes', label: '是' }
            } else if (score >= 60 && maxOther < 40) {
                results[key] = { status: 'basicYes', label: '基本是' }
            } else {
                results[key] = { status: 'no', label: '否' }
            }
        } else {
            // 偏颇体质判定标准
            if (score >= 40) {
                results[key] = { status: 'yes', label: '是' }
            } else if (score >= 30) {
                results[key] = { status: 'tendency', label: '倾向是' }
            } else {
                results[key] = { status: 'no', label: '否' }
            }
        }
    })

    console.log('[determineConstitution] 判定结果:', results)
    return results
}

/**
 * 获取主要体质类型
 * @param {Object} transformedScores - 转化分
 * @param {Object} judgments - 判定结果
 * @returns {Object} 主要体质信息
 */
export function getPrimaryConstitution(transformedScores, judgments) {
    console.log('[getPrimaryConstitution] transformedScores:', transformedScores)
    console.log('[getPrimaryConstitution] judgments:', judgments)

    // 检查是否是平和质
    if (judgments.pinghe?.status === 'yes' || judgments.pinghe?.status === 'basicYes') {
        console.log('[getPrimaryConstitution] 是平和质')
        return {
            key: 'pinghe',
            constitution: CONSTITUTIONS.pinghe,
            score: transformedScores.pinghe,
            judgment: judgments.pinghe
        }
    }

    // 找出偏颇体质中得分最高的（不管是否达到判定标准，直接比分数）
    let maxScore = -1
    let primaryKey = 'pinghe'

    Object.entries(transformedScores).forEach(([key, score]) => {
        if (key !== 'pinghe' && score > maxScore) {
            maxScore = score
            primaryKey = key
        }
    })

    console.log(`[getPrimaryConstitution] 最高偏颇体质: ${primaryKey}, 分数: ${maxScore}`)

    return {
        key: primaryKey,
        constitution: CONSTITUTIONS[primaryKey],
        score: maxScore,
        judgment: judgments[primaryKey]
    }
}

/**
 * 获取完整评估报告
 * @param {Object} answers - 用户答案
 * @param {Array} questions - 问卷
 * @returns {Object} 完整报告
 */
export function getFullAssessment(answers, questions) {
    const scores = calculateScores(answers, questions)
    const judgments = determineConstitution(scores.transformed)
    const primary = getPrimaryConstitution(scores.transformed, judgments)

    // 获取倾向体质
    const tendencies = Object.entries(judgments)
        .filter(([key, j]) => key !== primary.key && (j.status === 'yes' || j.status === 'tendency'))
        .map(([key, j]) => ({
            key,
            constitution: CONSTITUTIONS[key],
            score: scores.transformed[key],
            judgment: j
        }))
        .sort((a, b) => b.score - a.score)

    return {
        scores,
        judgments,
        primary,
        tendencies,
        radarData: Object.keys(CONSTITUTIONS).map(key => ({
            name: CONSTITUTIONS[key].name,
            score: scores.transformed[key],
            fullMark: 100
        }))
    }
}
