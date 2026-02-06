import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/Home.vue')
    },
    {
        path: '/theory',
        name: 'Theory',
        component: () => import('../views/Theory.vue')
    },
    {
        path: '/assessment',
        name: 'Assessment',
        component: () => import('../views/Assessment.vue')
    },
    {
        path: '/result',
        name: 'Result',
        component: () => import('../views/Result.vue')
    },
    {
        path: '/music',
        name: 'Music',
        component: () => import('../views/MusicLibrary.vue')
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
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
