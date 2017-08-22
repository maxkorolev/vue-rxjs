import Vue from 'vue'
import Router from 'vue-router'
import ToDo from './components/ToDo.vue'

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    { path: '/all', component: ToDo },
    { path: '/active', component: ToDo },
    { path: '/completed', component: ToDo },
    { path: '*', redirect: '/all' }
  ]
})
