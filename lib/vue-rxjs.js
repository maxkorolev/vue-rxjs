(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("vue-rxjs", [], factory);
	else if(typeof exports === 'object')
		exports["vue-rxjs"] = factory();
	else
		root["vue-rxjs"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
var isObject = exports.isObject = function isObject(value) {
    return value instanceof Object;
};

var isFunction = exports.isFunction = function isFunction(value) {
    return isObject(value) && value instanceof Function;
};

var isArray = exports.isArray = function isArray(value) {
    return isObject(value) && value instanceof Array;
};

var forEach = exports.forEach = function forEach(object, iteratee) {
    var iterable = Object(object);
    var props = Object.keys(iterable);
    var length = props.length;

    var index = -1;

    while (length--) {
        var key = props[++index];
        if (iteratee(iterable[key], key, iterable) === false) {
            break;
        }
    }
    return object;
};

var every = exports.every = function every(array, predicate) {
    var index = -1;
    var length = array ? array.length : 0;

    while (++index < length) {
        if (!predicate(array[index], index, array)) {
            return false;
        }
    }
    return true;
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = VueRxJS;

var _pipes = __webpack_require__(2);

var _pipes2 = _interopRequireDefault(_pipes);

var _combo = __webpack_require__(3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function VueRxJS(Vue, Rx) {
    Vue.mixin((0, _pipes2.default)(Vue, Rx));
    (0, _combo.initCombo)(Rx);
};
module.exports = exports['default'];

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _utils = __webpack_require__(0);

exports.default = function (Vue, Rx) {
    return {
        created: function created() {
            var vm = this;
            var pipes = vm.$options.pipes;
            if ((0, _utils.isFunction)(pipes)) {
                pipes = pipes.call(vm);
            }
            if (pipes && (0, _utils.isObject)(pipes)) {
                var _link = function _link(func, key) {
                    for (var _len = arguments.length, params = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                        params[_key - 2] = arguments[_key];
                    }

                    var value = func.call.apply(func, [vm].concat(params));

                    if ((0, _utils.isFunction)(value)) {
                        // if there is a prop for onMethod - it means that we are in a second loop
                        vm[propApplyName(key)] = function () {
                            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                                args[_key2] = arguments[_key2];
                            }

                            _link.apply(undefined, [value, key].concat(args));
                        };
                    } else if ((0, _utils.isObject)(value) && (0, _utils.isFunction)(value.next)) {

                        vm[propApplyName(key)] = function (arg) {
                            vm[propPipeName(key)].next(arg);
                        };

                        vm._pipeSubs.push(value.subscribe(function (v) {
                            return vm[propPipeName(key)].next(v);
                        }, function (v) {
                            return vm[propErrorPipeName(key)].next(v);
                        }));
                    } else {

                        var obs = value && !(0, _utils.isFunction)(value.subscribe) ? Rx.Observable.of(value) : value;

                        vm[propProcessName(key)] = true;
                        vm[propName(key)] = null;
                        vm[propErrorName(key)] = null;

                        // if there is a prop for onMethod - it means that we are in a second loop
                        if (!vm[propApplyName(key)]) {
                            vm.$inits[key] = func;
                            vm[propApplyName(key)] = function (arg) {
                                vm[propPipeName(key)].next(arg);
                            };
                        }

                        obs.subscribe(function (v) {
                            return vm[propPipeName(key)].next(v);
                        }, function (v) {
                            return vm[propErrorPipeName(key)].next(v);
                        });
                    }
                };

                vm._pipeSubs = [];
                vm._watchSubs = [];
                vm.$pipes = vm.$pipes || {};
                vm.$pipesError = vm.$pipesError || {};
                vm.$pipesOld = vm.$pipesOld || {};
                vm.$inits = vm.$inits || {};
                vm.$refreshAll = function () {
                    (0, _utils.forEach)(vm.$inits, function (func, key) {
                        return _link(func, key, vm);
                    });
                };

                var propName = function propName(key) {
                    return key;
                };
                var propOldName = function propOldName(key) {
                    return key + 'Old';
                };
                var propErrorName = function propErrorName(key) {
                    return key + 'Error';
                };
                var propProcessName = function propProcessName(key) {
                    return key + 'Process';
                };
                var propApplyName = function propApplyName(key) {
                    return key + 'Apply';
                };
                var propPipeName = function propPipeName(key) {
                    return key + 'Pipe';
                };
                var propOldPipeName = function propOldPipeName(key) {
                    return key + 'OldPipe';
                };
                var propErrorPipeName = function propErrorPipeName(key) {
                    return key + 'ErrorPipe';
                };

                (0, _utils.forEach)(vm.$props, function (prop, key) {
                    var subj = new Rx.BehaviorSubject();
                    var subjOld = new Rx.BehaviorSubject();

                    Vue.util.defineReactive(vm, propOldName(key), undefined);

                    vm[propPipeName(key)] = subj;
                    vm[propOldPipeName(key)] = subjOld;

                    subj.next(vm[propName(key)]);
                    vm._watchSubs.push(vm.$watch(key, function (newValue, oldValue) {
                        subj.next(newValue);
                        subjOld.next(oldValue);
                    }));

                    vm._pipeSubs.push(subj.subscribe(function (value) {
                        vm[propName(key)] = value;
                    }));
                    vm._pipeSubs.push(subjOld.subscribe(function (value) {
                        vm[propOldName(key)] = value;
                    }));
                });

                (0, _utils.forEach)(pipes, function (func, key) {

                    var subj = new Rx.BehaviorSubject();
                    var subjError = new Rx.BehaviorSubject();
                    var subjOld = new Rx.BehaviorSubject();

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

                    vm._pipeSubs.push(subj.subscribe(function (value) {
                        vm.$emit(propProcessName(key), false);
                        vm.$emit(propName(key), value);
                        vm.$emit(propErrorName(key), null);

                        subjOld.next(vm[propName(key)]);

                        vm[propProcessName(key)] = false;
                        vm[propName(key)] = value;
                        vm[propErrorName(key)] = null;
                    }));

                    vm._pipeSubs.push(subjOld.subscribe(function (value) {
                        vm[propOldName(key)] = value;
                    }));

                    vm._pipeSubs.push(subjError.filter(function (v) {
                        return !!v;
                    }).subscribe(function (error) {
                        console.error(error);

                        vm.$emit(propProcessName(key), false);
                        vm.$emit(propName(key), null);
                        vm.$emit(propErrorName(key), error);

                        vm[propProcessName(key)] = false;
                        vm[propName(key)] = null;
                        vm[propErrorName(key)] = error;
                    }));

                    _link(func, key, vm);
                });
            }
        },
        beforeDestroy: function beforeDestroy() {
            this._pipeSubs && this._pipeSubs.forEach(function (sub) {
                return sub && (sub.dispose && sub.dispose() || sub.unsubscribe && sub.unsubscribe());
            });
            this._watchSubs && this._watchSubs.forEach(function (sub) {
                return sub && sub();
            });
        }
    };
};

module.exports = exports['default'];

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.combo = exports.initCombo = undefined;

var _utils = __webpack_require__(0);

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Rx = void 0;

var initCombo = exports.initCombo = function initCombo(_Rx) {
    Rx = _Rx;
    Rx.Observable.prototype.notNull = notNull;
    Rx.Observable.prototype.errorIf = errorIf;
    Rx.Observable.prototype.errorIfNull = errorIfNull;
    Rx.Observable.prototype.ifNull = ifNull;

    function errorIf(clause, err) {
        var self = this;
        return Rx.Observable.merge(self.filter(clause).flatMap(function (v) {
            return Rx.Observable.throw((0, _utils.isFunction)(err) ? err(v) : err);
        }), self.filter(function (v) {
            return !clause(v);
        }));
    }

    function ifNull(arg) {
        var self = this;
        return self.flatMap(function (v) {
            if (v) return Rx.Observable.of(v);
            if ((0, _utils.isFunction)(arg)) return arg(v);
            return arg;
        });
    }

    function notNull(arg) {
        return this.filter(function (v) {
            return v;
        });
    }

    function errorIfNull(err) {
        var self = this;
        return self.errorIf(function (v) {
            return !v;
        }, err);
    }

    Rx.Observable.throwIf = function (cond, err) {
        return Rx.Observable.of(null).errorIf((0, _utils.isFunction)(cond) ? cond : function () {
            return cond;
        }, err);
    };
};

var combo = exports.combo = function combo(func) {

    var execute = function execute(generator, yieldValue) {

        var next = generator.next(yieldValue);

        var obs = void 0;
        if ((0, _utils.isObject)(next.value) && (0, _utils.isFunction)(next.value.subscribe)) {
            obs = next.value;
        } else if ((0, _utils.isArray)(next.value) && (0, _utils.every)(next.value, function (obs) {
            return (0, _utils.isFunction)(obs.subscribe);
        })) {
            var _Rx$Observable;

            obs = (_Rx$Observable = Rx.Observable).concat.apply(_Rx$Observable, _toConsumableArray(next.value)).toArray();
        } else {
            obs = Rx.Observable.of(next.value);
        }

        if (next.done) {
            return obs;
        } else {
            return obs.flatMap(function (result) {
                return execute(generator, result);
            });
        }
    };

    return Rx.Observable.of(null).flatMap(function () {
        return execute(func());
    });
};

/***/ })
/******/ ]);
});
//# sourceMappingURL=vue-rxjs.js.map