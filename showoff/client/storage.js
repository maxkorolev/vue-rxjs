import Rx from 'rxjs/Rx';
const STORAGE_KEY = 'todos-vuejs';

export const fetch = () => Rx.Observable
    .of(localStorage.getItem(STORAGE_KEY) || '[]')
    .map(JSON.parse);

export const save = todos => Rx.Observable
    .of(todos)
    .map(JSON.stringify)
    .map(ts => localStorage.setItem(STORAGE_KEY, ts));

