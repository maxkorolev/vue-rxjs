import Vue from 'vue'
import Router from 'vue-router'
import Main from './components/Main.vue'

Vue.use(Router);

export default new Router({
    mode: 'history',
    routes: [
        {path: '/all', component: Main},
        {path: '/active', component: Main},
        {path: '/completed', component: Main},
        {path: '*', redirect: '/all'}
    ]
})
