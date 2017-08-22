import Vue from 'vue'
import App from './components/App.vue'
import router from './router'
import VuePipes from './vue-pipes'
import 'todomvc-app-css/index.css';
import 'todomvc-common/base.css';

Vue.mixin(VuePipes);

new Vue({
  router,
  ...App
}).$mount('#app')
