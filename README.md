
Simple rxjs binding for Vue.js. This small library allows you to use rxjs without any difficulties. 
Inspired by [vue-rx](https://github.com/vuejs/vue-rx).


### Installation

``` bash
npm install vue vue-rxjs rxjs --save
```

``` js
import Vue from 'vue'
import Rx from 'rxjs/Rx'
import VueRxJs from 'vue-rxjs'

// tada!
Vue.use(VueRxJs, Rx)
```

### Usage

vue-rxjs provides mixin 'pipes'. It can be used as data, computed properties and methods.

``` js
def getUser = () => Rx.Observable.of({name: 'peter', cityID: 1}).delay(2000);
def getCity = cityID => Rx.Observable.of('NYC').delay(2000);
def saveUser = user => Rx.Observable.of({result: 'success'}).delay(2000);

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

``` html
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

<!-- user it's just an object in scope -->
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

### Example

See /showoff for some simple examples.

