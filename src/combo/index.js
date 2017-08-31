
import {isFunction, isObject, isArray, every} from '../utils';
import {getRx} from './init';


export default func => {
    const Rx = getRx();

    const execute = (generator, yieldValue) => {

        let next = generator.next(yieldValue);

        let obs;
        if (isObject(next.value) && isFunction(next.value.subscribe)) {
            obs = next.value
        } else if (isArray(next.value) && every(next.value, obs => isFunction(obs.subscribe))) {
            obs = Rx.Observable.concat(...next.value).toArray()
        } else {
            obs = Rx.Observable.of(next.value);
        }

        if (next.done) {
            return obs;
        } else {
            return obs.flatMap(result => execute(generator, result));
        }
    };

    return Rx.Observable.of(null).flatMap(() => execute(func()));
};

