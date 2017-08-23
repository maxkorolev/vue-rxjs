import pipes from './pipes';

export default function VueRxJS(Vue, Rx) {
    Vue.mixin(pipes(Vue, Rx));
};
