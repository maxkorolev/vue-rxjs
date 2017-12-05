import {isObject, isFunction, forEach, isArray, isEvent, cloneDeep} from './utils';

export default (Vue, Rx) => ({
    created() {
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

            const propName = key => key;
            const propOldName = key => `${key}Old`;
            const propErrorName = key => `${key}Error`;
            const propProcessName = key => `${key}Process`;
            const propApplyName = key => `${key}Apply`;
            const propPipeName = key => `${key}Pipe`;
            const propOldPipeName = key => `${key}OldPipe`;
            const propErrorPipeName = key => `${key}ErrorPipe`;

            function link(func, key, ...params) {
                const value = func.call(vm, ...params);

                if (isFunction(value)) {
                    // if there is a prop for onMethod - it means that we are in a second loop
                    vm[propApplyName(key)] = (...args) => {
                        link(value, key, ...args);
                    };

                } else if (isObject(value) && isFunction(value.next)) {

                    vm[propApplyName(key)] = arg => {
                        vm[propName(key)] = cloneDeep(arg)
                    };

                    vm._pipeSubs.push(
                        value.catch(err => {
                            vm[propErrorPipeName(key)].next(err);
                            return Rx.Observable.of(null);
                        }).subscribe(v => {
                            vm[propName(key)] = cloneDeep(v)
                        })
                    );
                } else {

                    const obs = isFunction(value && value.subscribe) ?
                        value : Rx.Observable.of(value);

                    vm[propProcessName(key)] = true;
                    vm[propName(key)] = null;
                    vm[propErrorName(key)] = null;

                    // if there is a prop for onMethod - it means that we are in a second loop
                    if (!vm[propApplyName(key)]) {
                        vm.$inits[key] = func;
                        vm[propApplyName(key)] = arg => {
                            vm[propName(key)] = cloneDeep(arg)
                        };
                    }

                    obs.subscribe(
                        v => { vm[propName(key)] = cloneDeep(v) },
                        v => { vm[propErrorPipeName(key)].next(v) }
                    );
                }
            }

            function walk(obj, keyProp, init, emit, baseVal) {
                let subVal = init;

                if (isObject(subVal) && !isArray(subVal) && !isFunction(subVal) && !isEvent(subVal)) {
                    Object.keys(subVal).forEach(k => {
                        walk(subVal, k, subVal[k], emit, baseVal || subVal);
                    });
                }

                Object.defineProperty(obj, keyProp, {
                    enumerable: true,
                    configurable: true,
                    get() {
                        return subVal;
                    },
                    set(subValue) {

                        if (isObject(subValue) && !isArray(subValue) && !isFunction(subValue) && !isEvent(subValue)) {
                            Object.keys(subValue).forEach(k => {
                                walk(subValue, k, subValue[k], emit, baseVal || subValue);
                            });
                        }
                        emit && emit(baseVal || subValue);
                        subVal = subValue;
                    }
                });
            }

            forEach(vm.$props, (prop, key) => {
                const subj = new Rx.BehaviorSubject();
                const subjOld = new Rx.BehaviorSubject();

                Vue.util.defineReactive(vm, propOldName(key), undefined);

                vm[propPipeName(key)] = subj;
                vm[propOldPipeName(key)] = subjOld;

                subj.next(vm[propName(key)]);
                vm._watchSubs.push(vm.$watch(key, (newValue, oldValue) => {
                    subj.next(newValue);
                    subjOld.next(oldValue);
                }));

                vm._pipeSubs.push(subj.subscribe(
                    value => {
                        vm[propName(key)] = value;
                    }
                ));
                vm._pipeSubs.push(subjOld.subscribe(
                    value => {
                        vm[propOldName(key)] = value;
                    }
                ));
            });

            forEach(pipes, (func, key) => {

                const subj = new Rx.BehaviorSubject();
                const subjError = new Rx.BehaviorSubject();
                const subjOld = new Rx.BehaviorSubject();

                let val = undefined;
                walk(vm, propName(key), val, v => subj.next(v));

                Vue.util.defineReactive(vm, propName(key), val);
                Vue.util.defineReactive(vm, propErrorName(key), undefined);
                Vue.util.defineReactive(vm, propProcessName(key), false);
                Vue.util.defineReactive(vm, propOldName(key), undefined);

                vm[propPipeName(key)] = subj;
                vm[propErrorPipeName(key)] = subjError;
                vm[propOldPipeName(key)] = subjOld;
                vm.$pipes[key] = subj;
                vm.$pipesError[key] = subjError;
                vm.$pipesOld[key] = subjOld;

                // skip first null from behavior subject, after vue has initialized component
                vm._pipeSubs.push(subj.skip(1).subscribe(
                    value => {

                        console.warn(propName(key), value)
                        vm.$emit(propProcessName(key), false);
                        vm.$emit(propName(key), value);
                        vm.$emit(propErrorName(key), null);

                        // vm[propName(key)] = value;
                        vm[propProcessName(key)] = false;
                        vm[propErrorName(key)] = null;

                        subjOld.next(value);
                    }
                ));

                vm._pipeSubs.push(subjOld.skip(1).subscribe(
                    value => {
                        vm[propOldName(key)] = value;
                    }
                ));

                vm._pipeSubs.push(subjError.skip(1).filter(v => !!v).subscribe(
                    error => {
                        console.error(error);

                        vm.$emit(propProcessName(key), false);
                        vm.$emit(propName(key), null);
                        vm.$emit(propErrorName(key), error);

                        vm[propProcessName(key)] = false;
                        vm[propName(key)] = null;
                        vm[propErrorName(key)] = error;
                    }
                ));

                link(func, key, vm);
            });
        }
    },

    beforeDestroy() {
        this._pipeSubs && this._pipeSubs.forEach(
            sub => sub && (sub.dispose && sub.dispose() || sub.unsubscribe && sub.unsubscribe())
        );
        this._watchSubs && this._watchSubs.forEach(sub => sub && sub());
    }
})
