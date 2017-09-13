import {isObject, isFunction, forEach} from './utils';

export default (Vue, Rx) => ({
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

            const prop = new Proxy(prop, {
                get (target, property) {
                    return function (key = '') {
                        return key + property.slice(0, -4)
                    }
                }
            })

            function link(func, key, ...params) {
                const value = func.call(vm, ...params);

                if (isFunction(value)) {
                    // if there is a prop for onMethod - it means that we are in a second loop
                    vm[prop.ApplyName(key)] = (...args) => {
                        link(value, key, ...args);
                    };

                } else if (isObject(value) && isFunction(value.next)) {

                    vm[prop.ApplyName(key)] = (arg) => {
                        vm[prop.PipeName(key)].next(arg);
                    };

                    vm._pipeSubs.push(value.subscribe(
                        v => vm[prop.PipeName(key)].next(v),
                        v => vm[prop.ErrorPipeName(key)].next(v)
                    ));
                } else {

                    const obs = isFunction(value && value.subscribe) ?
                        value : Rx.Observable.of(value);

                    vm[prop.ProcessName(key)] = true;
                    vm[prop.Name(key)] = null;
                    vm[prop.ErrorName(key)] = null;

                    // if there is a prop for onMethod - it means that we are in a second loop
                    if (!vm[prop.ApplyName(key)]) {
                        vm.$inits[key] = func;
                        vm[prop.ApplyName(key)] = (arg) => {
                            vm[prop.PipeName(key)].next(arg);
                        };
                    }

                    obs.subscribe(
                        v => vm[prop.PipeName(key)].next(v),
                        v => vm[prop.ErrorPipeName(key)].next(v)
                    );
                }
            }

            forEach(vm.$props, (prop, key) => {
                const subj = new Rx.BehaviorSubject();
                const subjOld = new Rx.BehaviorSubject();

                Vue.util.defineReactive(vm, prop.OldName(key), undefined);

                vm[prop.PipeName(key)] = subj;
                vm[prop.OldPipeName(key)] = subjOld;

                subj.next(vm[prop.Name(key)]);
                vm._watchSubs.push(vm.$watch(key, (newValue, oldValue) => {
                    subj.next(newValue);
                    subjOld.next(oldValue);
                }));

                vm._pipeSubs.push(subj.subscribe(
                    value => {
                        vm[prop.Name(key)] = value;
                    }
                ));
                vm._pipeSubs.push(subjOld.subscribe(
                    value => {
                        vm[prop.OldName(key)] = value;
                    }
                ));
            });

            forEach(pipes, (func, key) => {

                const subj = new Rx.BehaviorSubject();
                const subjError = new Rx.BehaviorSubject();
                const subjOld = new Rx.BehaviorSubject();

                Vue.util.defineReactive(vm, prop.Name(key), undefined);
                Vue.util.defineReactive(vm, prop.ErrorName(key), undefined);
                Vue.util.defineReactive(vm, prop.ProcessName(key), false);
                Vue.util.defineReactive(vm, prop.OldName(key), undefined);

                vm[prop.PipeName(key)] = subj;
                vm[prop.ErrorPipeName(key)] = subjError;
                vm[prop.OldPipeName(key)] = subjOld;
                vm.$pipes[key] = subj;
                vm.$pipesError[key] = subjError;
                vm.$pipesOld[key] = subjOld;

                // skip first null
                vm._pipeSubs.push(subj.skip(1).subscribe(
                    value => {
                        vm.$emit(prop.ProcessName(key), false);
                        vm.$emit(prop.Name(key), value);
                        vm.$emit(prop.ErrorName(key), null);

                        subjOld.next(vm[prop.Name(key)]);

                        vm[prop.ProcessName(key)] = false;
                        vm[prop.Name(key)] = value;
                        vm[prop.ErrorName(key)] = null;
                    }
                ));

                vm._pipeSubs.push(subjOld.skip(1).subscribe(
                    value => {
                        vm[prop.OldName(key)] = value;
                    }
                ));

                vm._pipeSubs.push(subjError.skip(1).filter(v => !!v).subscribe(
                    error => {
                        console.error(error);

                        vm.$emit(prop.ProcessName(key), false);
                        vm.$emit(prop.Name(key), null);
                        vm.$emit(prop.ErrorName(key), error);

                        vm[prop.ProcessName(key)] = false;
                        vm[prop.Name(key)] = null;
                        vm[prop.ErrorName(key)] = error;
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
})
