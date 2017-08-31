import pipes from './pipes';
import {initCombo} from './combo/init';

export default function VueRxJS(Vue, Rx) {
    Vue.mixin(pipes(Vue, Rx));
    initCombo(Rx);
};
