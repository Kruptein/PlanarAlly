import Vue from 'vue';
import VueRouter from 'vue-router';

import router from './router';
import store from './store';

Vue.use(VueRouter);

const app = new Vue({ router, store }).$mount('#app');
(<any>window).vm = app;
