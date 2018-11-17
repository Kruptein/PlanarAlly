import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const router = new VueRouter({
    routes: [
        {
            path: '/', component: { template: '<div>WAT</div>' },
            children: [

            ]
        }
    ],
})

router.beforeEach(
    (to, from, next) => {
        if 
    }
)

const app = new Vue({ router }).$mount('#app');
