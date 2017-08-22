import Vue from 'vue';
import Rx from 'rxjs/Rx';
import {isFunction, isObject, forEach, curry} from 'lodash';


function upperOnlyFirst(str) {
  if (!str || str.length < 1) {
    return str;
  }
  else {
    return str.substr(0, 1).toUpperCase() + str.substr(1);
  }
}

export default {
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

      const propPipeName = key => key + 'Pipe';
      const propErrorPipeName = key => key + 'ErrorPipe';
      const propOnName = key => 'on' + upperOnlyFirst(key);
      const propName = key => key;
      const propErrorName = key => key + 'Error';
      const propProcessName = key => key + 'Process';
      const propOldPipeName = key => key + 'OldPipe';
      const propOldName = key => key + 'Old';

      function link(func, key, ...params) {
        const value = func.call(vm, ...params);

        if (isFunction(value)) {
          // if there is a prop for onMethod - it means that we are in a second loop
          vm[propOnName(key)] = (...args) => {
            link(value, key, ...args);
          };

        } else if (isObject(value) && isFunction(value.next)) {

          vm[propOnName(key)] = (arg) => {
            vm[propPipeName(key)].next(arg);
          };

          vm._pipeSubs.push(value.subscribe(
            v => vm[propPipeName(key)].next(v),
            v => vm[propErrorPipeName(key)].next(v)
          ));
        } else {

          const obs = isObject(value) && isFunction(value.subscribe) ?
            value : Rx.Observable.of(value);

          vm[propProcessName(key)] = true;
          vm[propName(key)] = null;
          vm[propErrorName(key)] = null;

          // if there is a prop for onMethod - it means that we are in a second loop
          if (!vm[propOnName(key)]) {
            vm.$inits[key] = func;
            vm[propOnName(key)] = (arg) => {
              vm[propPipeName(key)].next(arg);
            };
          }

          obs.subscribe(
            v => vm[propPipeName(key)].next(v),
            v => vm[propErrorPipeName(key)].next(v)
          );
        }
      }

      forEach(vm.$props, (prop, key) => {
        const subj = new Rx.Subject();
        const subjOld = new Rx.Subject();

        Vue.util.defineReactive(vm, propOldName(key), undefined);

        vm[propPipeName(key)] = subj;
        vm[propOldPipeName(key)] = subjOld;

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

        Vue.util.defineReactive(vm, propName(key), undefined);
        Vue.util.defineReactive(vm, propErrorName(key), undefined);
        Vue.util.defineReactive(vm, propProcessName(key), false);
        Vue.util.defineReactive(vm, propOldName(key), undefined);

        vm[propPipeName(key)] = subj;
        vm[propErrorPipeName(key)] = subjError;
        vm[propOldPipeName(key)] = subjOld;
        vm.$pipes[key] = subj;
        vm.$pipesError[key] = subjError;
        vm.$pipesOld[key] = subjOld;

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

        vm._pipeSubs.push(subjError.subscribe(
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

  beforeDestroy () {
    this._pipeSubs && this._pipeSubs.forEach(
      sub => sub && (sub.dispose && sub.dispose() || sub.unsubscribe && sub.unsubscribe())
    );
    this._watchSubs && this._watchSubs.forEach(sub => sub && sub());
  }
}
