
Simple rxjs binding for Vue.js. This small library allows you to use rxjs without any difficulties. 
Inspired by [vue-rx](https://github.com/vuejs/vue-rx).


### Installation

```bash
npm install vue vue-rxjs rxjs --save
```

```js
import Vue from 'vue'
import Rx from 'rxjs/Rx'
import VueRxJs from 'vue-rxjs'

// tada!
Vue.use(VueRxJs, Rx)
```

### Usage

vue-rxjs provides mixin `pipes`. It can be used as data, computed properties and methods.

```js
const getUser = () => Rx.Observable.of({name: 'peter', cityID: 1}).delay(2000);
const getCity = cityID => Rx.Observable.of('NYC').delay(2000);
const saveUser = user => Rx.Observable.of({result: 'success'}).delay(2000);

new Vue({
    el: '#app',
    pipes: {
        msg: vm => 'some message',  // just message
        user: vm => getFromServer(),// get response from server
        city: vm => vm.userPipe     // when user is received - get city
            .map(u => u.cityID)
            .flatMap(getCity),      //.flatMap(cityID => getCity(cityID))
        
        updateUser: vm => user => saveUser(user) // save user
            .map(resp => resp.result)            // put result to scope
  }
})
```

```html
<!-- bind to it normally in templates -->
<!-- show message -->
<div>{{ msg }}</div>
<!-- progress bar is shown while request is sending -->
<div v-if="userProcess">Loading user</div>
<!-- show me the user name: 'peter' -->
<div v-if="!userProcess">User: {{ user.name }}</div>
<!-- something bad happened -->
<div v-if="userError">User not found</div>
<!-- show me the city -->
<div>City: {{ city.name }}</div>

<!-- user is just an object in scope -->
<input type="text" v-model="user.name">
<!-- wait for response -->
<div v-if="updateUserProcess">Saving user</div>
<!-- lets save user and call updateUserApply function-->
<button v-if="!updateUserProcess" @click="updateUserApply(user)">SAVE</button>
<!-- show me result of response: 'success' -->
<div v-if="updateUser">{{updateUser}}</div>
<!-- show me error -->
<div v-if="updateUserError">{{updateUserError}}</div>
```

### API
Let's start from simple examples which you know from vue.js
```js
    pipes: { 
        msg: vm => 'some message' 
    }  
```
this is the same as 
```js
    data: { 
        msg: 'some message' 
    }  
```
we created variable in scope with name `msg`. Actually with pure vue.js, 
you should write data as a function, which returns object with properties, 
it needs to not share objects between instances of vue-components. 

You can see that we use arrow function, vue.js doesn't recommend it in the data attribute,
because of wrong `this` pointer inside arrow functions, that's why we pass vm(current scope) as a first 
argument of function. By the way, that's why **every pipe must be a function**, 
first argument can be missed of course: `{ msg: () => 'some message' }`

#### Naming conventions
Actually I haven't been completely honest, when I said that, 
`msg` with pipes and `msg` with pure vue.js are the same. 
Every pipe creates several additional objects in scope.

When you write `{ msg: () => 'some message' }`, there are next objects in scope

- vm.msg - current value of pipe, that's why `<div>{{ msg }}</div>` 
- vm.msgError - special value for storing error
- vm.msgProcess - boolean flag which shows that `_Apply` is called, but result is not received
- vm.msgApply - function, in this case it will set current value `vm.msgApply('other message')`
- vm.msgOld - old value if current value was changed
- vm.msgPipe - Rx.Observable.BehaviorSubject - subject, which keeps current value
- vm.msgErrorPipe - Rx.Observable.BehaviorSubject - subject, which keeps error value
- vm.msgOldPipe - Rx.Observable.BehaviorSubject - subject, which keeps old value

#### Subjects
Ok, first subject is shown, let's make it clear. 
Every pipe creates three its own Rx.BehaviorSubjects: one for current value, 
one for error and one for old value. Each of them set its own value in scope:
- vm.msgPipe -> vm.msg
- vm.msgErrorPipe -> vm.msgError
- vm.msgOldPipe -> vm.msgOld

You can understand it like `vm.msgPipe.subscribe(value => vm.msg = value)`. 
After all subjects are created we can use it everywhere you want. 
So you can make graph of `pipes` calculation :
```js
    pipes: { 
        one: vm => 1, 
        two: vm => vm.onePipe.map(one => one + 1),
        fixRandom: vm => 42,
        result: vm => vm.twoPipe.flatMap(two => 
            vm.fixRandomPipe.map(r => two * r)
        )
        // result = (1 + 1) * 42 = 84
    }  
```

#### So what can I return to pipes?
The most import part on vue-rxjs is what function should return when they received vm. 
Well... everything you want. For pipes there are several types of constructing
- constant - number, string, boolean, array, object: `msg: vm => 1`
- Rx.Observable: `msg: vm => Rx.Observable.of(1)`  
- Rx.Subject: `msg: vm => Rx.Observable.interval(500)`  
- function as constant: `msg: vm => () => 1`  
- function as Rx.Observable: `msg: vm => () => Rx.Observable.of(1)`  
- function as Rx.Subject: `msg: vm => () => Rx.Observable.interval(500)`  

If pipe receives **constant**, it just wraps it to Rx.Observable and handles it in that way.

If pipe receives **Rx.Observable**, it subscribes on this observable (what means to run it), 
and if everything is ok, it puts value to `_Pipe` subject and value appears in scope, 
if something is wrong, it puts error to `_ErrorPipe` subject and error appears in scope.
`_OldPipe` is filled by current value if it is changed, old value means previous value.

If pipe receives **Rx.Subject** we have the same way to handle as Rx.Observable, 
but it we should distinguish them because they have different nature of subscription. 
You should know, that in case of Rx.Subject we create three new BehaviorSubject in scope, anyway

If pipe receives **function** - you are only saying, 
that pipe shouldn't execute it immediately, 
but you can run it by yourself - to call `_Apply` function. 
And when the function will be executed, result will be handled as constant or Rx.Observable or Rx.Subject. 


Using pipe as a method
```js
    const saveUserCall = () => Rx.Observable.of({name: 'peter'}).delay(2000);
    // ...
    pipes: { 
        updateUser: vm => saveUserCall 
    }
```
in comparison with pure 
```js
    const saveUserCall = () => Rx.Observable.of({name: 'peter'}).delay(2000);
    // ...
    data() {
        return {
            updateUser: null,           // result
            updateUserProcess: false,   // process
            updateUserError: null       // error
        };
    },
    methods: { 
        updateUserApply() {
            const vm = this;
            vm.updateUser = null;
            vm.updateUserProcess = true;
            vm.updateUserError = null;
            saveUserCall().subscribe(data => {
                vm.updateUser = data;
                vm.updateUserProcess = false;
                vm.updateUserError = null;
            }, err => {
                console.error(err);
                
                vm.updateUser = null;
                vm.updateUserProcess = false;
                vm.updateUserError = err;
            })
        }
    }  
```

### Components collaboration
vue-rxjs can help you to collaborate components between each other.

If there is `pipes` in component, it knows about existing props and creates Subjects for them.
```js
    props: {
        numb: Number
    }
    pipes: { 
        plusOne: vm => vm.numbPipe.map(numb => numb + 1) 
    }
```
Every pipe creates three types of events and emits them if it needs

```js
    name: 'comp',
    pipes: { 
        numb: vm => 1
    }
```
somewhere else
```html
    <comp @numb="" @numbError="" @numbProcess=""></comp>
```


### vue-rx
This library has almost the same name as [vue-rx](https://github.com/vuejs/vue-rx) by Evan You 
and it has almost the same aim, but do it in more elegant way (I hope). 

vue-rx has a mixin **`subscriptions`** which is like a `pipes`, 
there is a slightly difference in api, but `pipes` is covering  all functionality of `subscriptions`.

vue-rx has a **`v-stream`** directive which services for handling events from templates, 
`_Apply` function services for that purpose in vue-rxjs, imho has more natural api than `v-stream` 

```html
<button @click="plus$Apply(someData)">+</button>
<!-- vs -->
<button v-stream:click="{ subject: plus$, data: someData }">+</button>
```

vue-rx has a **$createObservableMethod** - it's appeared not so long ago, 
it seems like _Apply function. 

vue-rx has several other api methods:
- $watchAsObservable
- $eventToObservable
- $subscribeTo(observable, next, error, complete)
- $fromDOMEvent(selector, event)

there are no such functions in vue-rxjs, maybe all of them take a place in vue-rxjs, maybe not
There is no conflicts between vue-rx and vue-rxjs, so the can work together


### Example
See /showoff for some simple examples.

