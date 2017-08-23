import Vue from 'vue'
import Rx from 'rxjs/Rx'
import App from './components/App.vue'
import router from './router'
import VueRxJS from 'vue-rxjs'
import 'todomvc-app-css/index.css';
import 'todomvc-common/base.css';

Vue.use(VueRxJS, Rx);

new Vue({
    router,
    ...App
}).$mount('#app');
