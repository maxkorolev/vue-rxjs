import pipes from './pipes';
import {initCombo} from './combo/init';
export {default as combo} from './combo';

export const VueRxJS = (Vue, Rx) => {
    Vue.mixin(pipes(Vue, Rx));
    initCombo(Rx);
};
