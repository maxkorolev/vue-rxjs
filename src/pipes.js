export default function(Vue, Rx) {
    return {
        created() {
            const vm = this;
            let pipes = vm.$options.pipes;

            if (pipes instanceof Function) {
                pipes = pipes.call(vm);
            }

            if (pipes && pipes instanceof Object) {
                vm._pipeSubs = [];
                vm._watchSubs = [];
                vm.$pipes = vm.$pipes || {};
                vm.$pipesError = vm.$pipesError || {};
                vm.$pipesOld = vm.$pipesOld || {};
                vm.$inits = vm.$inits || {};

                vm.$refreshAll = () => {
                    Object.keys(vm.$inits).forEach(
                        (key) => link(vm.$inits[key], key, vm)
                    )
                };

                const propName = key => key;
                const propOldName = key => `${key}Old`;
                const propPipeName = key => `${key}Pipe`;
                const propApplyName = key => `${key}Apply`;
                const propErrorName = key => `${key}Error`;
                const propProcessName = key => `${key}Process`;
                const propOldPipeName = key => `${key}OldPipe`;
                const propErrorPipeName = key => `${key}ErrorPipe`;

                const link = function(func, key, ...params) {
                    const value = func.call(vm, ...params);

                    if (value instanceof Function) {
                        vm[propApplyName(key)] = (...args) => {
                            link(value, key, ...args);
                        };
                    } else if (value instanceof Object && value.next instanceof Function) {
                        vm[propApplyName(key)] = (arg) => {
                            vm[propPipeName(key)].next(arg);
                        };

                        vm._pipeSubs.push(value.subscribe(
                            v => vm[propPipeName(key)].next(v),
                            v => vm[propErrorPipeName(key)].next(v)
                        ));
                    } else {
                        const observable = value instanceof Object && value.subscribe instanceof Function ?
                            value :
                            Rx.Observable.of(value);

                        vm[propProcessName(key)] = true;
                        vm[propName(key)] = null;
                        vm[propErrorName(key)] = null;

                        if (!vm[propApplyName(key)]) {
                            vm.$inits[key] = func;
                            vm[propApplyName(key)] = (arg) => {
                                vm[propPipeName(key)].next(arg);
                            };
                        }

                        observable.subscribe(
                            v => vm[propPipeName(key)].next(v),
                            v => vm[propErrorPipeName(key)].next(v)
                        );
                    }
                };

                Object.keys(vm.$props).forEach(key => {
                    const subj = new Rx.Subject();
                    const subjOld = new Rx.Subject();

                    Vue.util.defineReactive(vm, propOldName(key), undefined);

                    vm[propPipeName(key)] = subj;
                    vm[propOldPipeName(key)] = subjOld;

                    vm._watchSubs.push(vm.$watch(key, (newValue, oldValue) => {
                        subj.next(newValue);
                        subjOld.next(oldValue);
                    }));

                    vm._pipeSubs.push(subj.subscribe(value => {
                        vm[propName(key)] = value;
                    }));

                    vm._pipeSubs.push(subjOld.subscribe(value => {
                        vm[propOldName(key)] = value;
                    }));
                });

                Object.keys(pipes).forEach(key => {
                    const subj = new Rx.BehaviorSubject();
                    const subjOld = new Rx.BehaviorSubject();
                    const subjError = new Rx.BehaviorSubject();

                    Vue.util.defineReactive(vm, propName(key), undefined);
                    Vue.util.defineReactive(vm, propOldName(key), undefined);
                    Vue.util.defineReactive(vm, propErrorName(key), undefined);
                    Vue.util.defineReactive(vm, propProcessName(key), false);

                    vm[propPipeName(key)] = subj;
                    vm[propOldPipeName(key)] = subjOld;
                    vm[propErrorPipeName(key)] = subjError;
                    vm.$pipes[key] = subj;
                    vm.$pipesOld[key] = subjOld;
                    vm.$pipesError[key] = subjError;

                    vm._pipeSubs.push(subj.subscribe(
                        value => {
                            vm.$emit(propProcessName(key), false);
                            vm.$emit(propName(key), value);
                            vm.$emit(propErrorName(key), null);

                            subjOld.next(vm[propName(key)]);

                            vm[propProcessName(key)] = false;
                            vm[propName(key)] = value;
                            vm[propErrorName(key)] = null;
                        }
                    ));

                    vm._pipeSubs.push(subjOld.subscribe(
                        value => {
                            vm[propOldName(key)] = value;
                        }
                    ));

                    vm._pipeSubs.push(subjError.filter(v => v).subscribe(
                        error => {
                            console.error(error);

                            vm.$emit(propName(key), null);
                            vm.$emit(propErrorName(key), error);
                            vm.$emit(propProcessName(key), false);

                            vm[propName(key)] = null;
                            vm[propErrorName(key)] = error;
                            vm[propProcessName(key)] = false;
                        }
                    ));

                    link(pipes[key], key, vm);
                });
            }
        },

        beforeDestroy() {
            this._pipeSubs.length && this._pipeSubs.forEach(
                sub => sub && (sub.dispose && sub.dispose() || sub.unsubscribe && sub.unsubscribe())
            );
            this._watchSubs.length && this._watchSubs.forEach(sub => sub && sub());
        }
    };
};
