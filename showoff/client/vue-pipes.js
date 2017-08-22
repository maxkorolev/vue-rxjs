import Vue from 'vue';
import Rx from 'rxjs/Rx';
import {isFunction, isObject, forEach, merge} from 'lodash';

function upperOnlyFirst(str) {
    if (!str || str.length < 1) {
        return str;
    }
    else {
        return str.substr(0, 1).toUpperCase() + str.substr(1);
    }
}

export default cfg => {
    cfg = merge(cfg, {
        pipe: 'pipe',
        errorPipe: 'errorPipe',
        oldPipe: 'oldPipe',
        apply: 'apply',
        value: 'value',
        old: 'old',
        error: 'error',
        process: 'process'
    });

    return {
        created () {
            const vm = this;
            let pipes = vm.$options.pipes;
            if (isFunction(pipes)) {
                pipes = pipes.call(vm);
            }
            if (pipes && isObject(pipes)) {

                vm._pipeSubs = [];
                vm._watchSubs = [];
                vm.$pipes = vm.$pipes || {};
                vm.$pipesError = vm.$pipesError || {};
                vm.$pipesOld = vm.$pipesOld || {};
                vm.$inits = vm.$inits || {};
                vm.$refreshAll = () => {
                    forEach(vm.$inits, (func, key) => link(func, key, vm))
                };

                function link(func, key, ...params) {
                    const value = func.call(vm, ...params);

                    if (isFunction(value)) {
                        // if there is a prop for onMethod - it means that we are in a second loop
                        vm[key][cfg.apply] = (...args) => {
                            link(value, key, ...args);
                        };

                    } else if (isObject(value) && isFunction(value.next)) {

                        vm[key][cfg.apply] = (arg) => {
                            vm[key][cfg.pipe].next(arg);
                        };

                        vm._pipeSubs.push(value.subscribe(
                            v => vm[key][cfg.pipe].next(v),
                            v => vm[key][cfg.errorPipe].next(v)
                        ));
                    } else {

                        const obs = isObject(value) && isFunction(value.subscribe) ?
                            value : Rx.Observable.of(value);

                        vm[key][cfg.process] = true;
                        vm[key][cfg.value] = null;
                        vm[key][cfg.error] = null;

                        // if there is a prop for onMethod - it means that we are in a second loop
                        if (!vm[key][cfg.apply]) {
                            vm.$inits[key] = func;
                            vm[key][cfg.apply] = (arg) => {
                                vm[key][cfg.pipe].next(arg);
                            };
                        }

                        obs.subscribe(
                            v => vm[key][cfg.pipe].next(v),
                            v => vm[key][cfg.errorPipe].next(v)
                        );
                    }
                }
                forEach(pipes, (func, key) => {
                    vm[key] = {};
                });

                forEach(vm.$props, (prop, key) => {
                    const subj = new Rx.Subject();
                    const subjOld = new Rx.Subject();

                    Vue.util.defineReactive(vm[key], cfg.old, undefined);

                    vm[key][cfg.pipe] = subj;
                    vm[key][cfg.oldPipe] = subjOld;

                    vm._watchSubs.push(vm.$watch(key, (newValue, oldValue) => {
                        subj.next(newValue);
                        subjOld.next(oldValue);
                    }));

                    vm._pipeSubs.push(subj.subscribe(
                        value => {
                            vm[key][cfg.value] = value;
                        }
                    ));
                    vm._pipeSubs.push(subjOld.subscribe(
                        value => {
                             vm[key][cfg.old] = value;
                        }
                    ));
                });

                forEach(pipes, (func, key) => {

                    const subj = new Rx.BehaviorSubject();
                    const subjError = new Rx.BehaviorSubject();
                    const subjOld = new Rx.BehaviorSubject();

                    Vue.util.defineReactive(vm[key], cfg.value, undefined);
                    Vue.util.defineReactive(vm[key], cfg.error, undefined);
                    Vue.util.defineReactive(vm[key], cfg.process, false);
                    Vue.util.defineReactive(vm[key], cfg.old, undefined);

                    vm[key][cfg.pipe] = subj;
                    vm[key][cfg.errorPipe] = subjError;
                    vm[key][cfg.oldPipe] = subjOld;
                    vm.$pipes[key] = subj;
                    vm.$pipesError[key] = subjError;
                    vm.$pipesOld[key] = subjOld;

                    vm._pipeSubs.push(subj.subscribe(
                        value => {
                            vm.$emit(`${key}.${cfg.process}`, false);
                            vm.$emit(`${key}.${cfg.value}`, value);
                            vm.$emit(`${key}.${cfg.error}`, null);

                            subjOld.next(vm[key][cfg.value]);

                            vm[key][cfg.process] = false;
                            vm[key][cfg.value] = value;
                            vm[key][cfg.error] = null;
                        }
                    ));

                    vm._pipeSubs.push(subjOld.subscribe(
                        value => {
                            vm[key][cfg.old] = value;
                        }
                    ));

                    vm._pipeSubs.push(subjError.filter(v => !!v).subscribe(
                        error => {
                            console.error(error);

                            vm.$emit(`${key}.${cfg.process}`, false);
                            vm.$emit(`${key}.${cfg.value}`, null);
                            vm.$emit(`${key}.${cfg.error}`, error);

                            vm[key][cfg.process] = false;
                            vm[key][cfg.value] = null;
                            vm[key][cfg.error] = error;
                        }
                    ));

                    link(func, key, vm);
                });
            }
        },

        beforeDestroy () {
            this._pipeSubs && this._pipeSubs.forEach(
                sub => sub && (sub.dispose && sub.dispose() || sub.unsubscribe && sub.unsubscribe())
            );
            this._watchSubs && this._watchSubs.forEach(sub => sub && sub());
        }
    }
}
