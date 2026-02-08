import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'

const routes = [
    {
        path: '/',
        component: MainLayout,
        redirect: '/home',
        children: [
            {
                path: 'home',
                name: 'Home',
                component: () => import('../views/Home.vue')
            },
            {
                path: 'diagnosis',
                name: 'Diagnosis',
                component: () => import('../views/Diagnosis.vue')
            },
            {
                path: 'result-tab',
                name: 'ResultTab',
                component: () => import('../views/Result.vue')
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('../views/Profile.vue')
            }
        ]
    },
    {
        path: '/theory',
        name: 'Theory',
        component: () => import('../views/Theory.vue')
    },
    { path: '/diagnosis', component: () => import('../views/Diagnosis.vue') },
    { path: '/result', component: () => import('../views/Result.vue') },
    { path: '/profile', component: () => import('../views/Profile.vue') },
    { path: '/diagnosis-ai', component: () => import('../views/DiagnosisAI.vue') },
    {
        path: '/assessment',
        name: 'Assessment',
        component: () => import('../views/Assessment.vue')
    },
    {
        path: '/result', // 保持旧路由以防外部链接或特定跳转，但通常应用内会用 Tab
        name: 'Result', // 或许可以重定向到 Tab?
        component: () => import('../views/Result.vue')
    },
    {
        path: '/tongue',
        name: 'Tongue',
        component: () => import('../views/TongueDiagnosis.vue')
    },
    {
        path: '/face',
        name: 'Face',
        component: () => import('../views/FaceDiagnosis.vue')
    },
    {
        path: '/research',
        name: 'ResearchStudy',
        component: () => import('../views/ResearchStudy.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
