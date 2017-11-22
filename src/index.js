import pipes from './pipes';

export default (Vue, Rx) => {
    Vue.mixin(pipes(Vue, Rx));
};
