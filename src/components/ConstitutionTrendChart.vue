<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  }
})

const chartRef = ref(null)
let chart = null

// 体质类型映射到数值（用于趋势展示）
const constitutionMap = {
  'balanced': { name: '平和质', value: 9, color: '#22c55e' },     // 最佳
  'qi_deficiency': { name: '气虚质', value: 7, color: '#f59e0b' },
  'yang_deficiency': { name: '阳虚质', value: 6, color: '#3b82f6' },
  'yin_deficiency': { name: '阴虚质', value: 6, color: '#ef4444' },
  'phlegm_dampness': { name: '痰湿质', value: 5, color: '#8b5cf6' },
  'damp_heat': { name: '湿热质', value: 5, color: '#f97316' },
  'blood_stasis': { name: '血瘀质', value: 4, color: '#dc2626' },
  'qi_stagnation': { name: '气郁质', value: 4, color: '#6366f1' },
  'special': { name: '特禀质', value: 3, color: '#ec4899' }
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '0分'
  if (seconds < 60) return `${seconds}秒`
  return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
}

// 处理图表数据
const chartData = computed(() => {
  if (!props.history || props.history.length === 0) return null
  
  // 倒序（按时间顺序）
  const reversed = [...props.history].reverse()
  
  return {
    dates: reversed.map(h => {
      const d = new Date(h.date)
      return `${d.getMonth() + 1}/${d.getDate()}`
    }),
    values: reversed.map(h => {
      const key = h.constitutionKey || 'balanced'
      return constitutionMap[key]?.value || 5
    }),
    names: reversed.map(h => h.constitutionName),
    colors: reversed.map(h => {
      const key = h.constitutionKey || 'balanced'
      return constitutionMap[key]?.color || '#6b7280'
    }),
    ratings: reversed.map(h => h.feedback?.rating || 0),
    durations: reversed.map(h => (h.feedback?.listenDuration || 0) / 60) // 转为分钟
  }
})

// 初始化图表
const initChart = () => {
  if (!chartRef.value || !chartData.value) return
  
  if (chart) {
    chart.dispose()
  }
  
  chart = echarts.init(chartRef.value)
  
  const option = {
    backgroundColor: 'transparent',
    grid: {
      top: 40,
      right: 40,
      bottom: 30,
      left: 40
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 27, 24, 0.95)',
      borderColor: '#d4c4b0',
      borderWidth: 1,
      textStyle: { color: '#f5f0e8' },
      formatter: (params) => {
        const idx = params[0].dataIndex
        const name = chartData.value.names[idx]
        const rating = chartData.value.ratings[idx]
        const duration = Math.round(chartData.value.durations[idx] * 60)
        
        let html = `<div class="font-bold border-b border-gray-600 pb-1 mb-1">${params[0].axisValue}</div>`
        html += `<div class="flex justify-between gap-4"><span>体质:</span> <span style="color:${chartData.value.colors[idx]}">${name}</span></div>`
        
        if (duration > 0) {
          html += `<div class="flex justify-between gap-4"><span>听歌:</span> <span>${formatDuration(duration)}</span></div>`
        }
        
        if (rating > 0) {
          html += `<div class="flex justify-between gap-4"><span>评价:</span> <span class="text-yellow-400">${'★'.repeat(rating)}</span></div>`
        }
        
        return html
      }
    },
    legend: {
      data: ['体质评分', '听歌时长'],
      textStyle: { color: '#8b7355', fontSize: 10 },
      top: 0
    },
    xAxis: {
      type: 'category',
      data: chartData.value.dates,
      axisLine: { lineStyle: { color: '#d4c4b0' } },
      axisLabel: { color: '#8b7355', fontSize: 10 }
    },
    yAxis: [
      {
        type: 'value',
        name: '体质分',
        nameTextStyle: { color: '#8b7355', fontSize: 10 },
        min: 0,
        max: 10,
        splitNumber: 5,
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false }
      },
      {
        type: 'value',
        name: '分钟',
        nameTextStyle: { color: '#8b7355', fontSize: 10 },
        splitLine: { lineStyle: { color: '#e8e0d4', type: 'dashed' } },
        axisLabel: { color: '#8b7355', fontSize: 10 }
      }
    ],
    series: [
      {
        name: '体质评分',
        type: 'line',
        yAxisIndex: 0,
        data: chartData.value.values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#c53030' },
            { offset: 1, color: '#22c55e' }
          ]),
          width: 3
        },
        itemStyle: {
          color: (params) => chartData.value.colors[params.dataIndex],
          borderColor: '#fff',
          borderWidth: 2
        }
      },
      {
        name: '听歌时长',
        type: 'bar',
        yAxisIndex: 1,
        data: chartData.value.durations,
        barWidth: '20%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }
  
  chart.setOption(option)
}

onMounted(() => {
  if (chartData.value) {
    initChart()
  }
})

watch(() => props.history, () => {
  initChart()
}, { deep: true })

// 响应式resize
window.addEventListener('resize', () => {
  chart?.resize()
})
</script>

<template>
  <div class="w-full relative">
    <div v-if="history.length >= 2" ref="chartRef" class="w-full h-56"></div>
    <div v-else class="text-center py-8 text-ink-light text-sm bg-ink/5 rounded-xl">
      <p class="font-medium mb-1">数据积累中...</p>
      <p class="text-xs opacity-70">至少需要2次测评记录才能生成双轴趋势分析</p>
    </div>
  </div>
</template>
