import Vue from 'vue'
import Rx from 'rxjs/Rx'
import App from './components/App.vue'
import ToDo from './components/ToDo.vue'
import router from './router'
import {VueRxJS} from '../../src/index'
// import VueRxJS from 'vue-rxjs'
import 'todomvc-app-css/index.css';
import 'todomvc-common/base.css';

Vue.use(VueRxJS, Rx);

Vue.component('to-do', ToDo);

new Vue({
    router,
    ...App
}).$mount('#app');
