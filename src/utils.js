
export {default as cloneDeep} from 'clone-deep'

export const isEvent = value =>
    isObject(value) && value instanceof Event;

export const isObject = value =>
    value instanceof Object;

export const isFunction = value =>
    isObject(value) && value instanceof Function;

export const isArray = value =>
    isObject(value) && value instanceof Array;

export const forEach = (object, iteratee) => {
    const iterable = Object(object);
    const props = Object.keys(iterable);
    let { length } = props;
    let index = -1;

    while (length--) {
        const key = props[++index];
        if (iteratee(iterable[key], key, iterable) === false) {
            break;
        }
    }
    return object
};

export const every = (array, predicate) => {
    let index = -1;
    const length = array ? array.length : 0;

    while (++index < length) {
        if (!predicate(array[index], index, array)) {
            return false;
        }
    }
    return true;
};
