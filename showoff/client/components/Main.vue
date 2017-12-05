<template>
    <div>
        <!--<div v-if="todosProcess">Fetching...</div>-->
        <!--<div v-if="todosError">{{todosError}}</div>-->

        <input v-model="obj.a.b.c">
        <!--<to-do :path="$route.path" :items="todos" @todos="changedApply"></to-do>-->
    </div>
</template>

<script>

    import Rx from 'rxjs/Rx'
    import {fetch, save} from '../storage';
    export default {

        pipes: {
            obj: vm => ({a: {b : { c: ''}}}),
            log: vm => vm.objPipe.do(console.log),

            // pipes can receive Rx.Observable from somewhere else
//            todos: vm => fetch().delay(1000),

            // pipes can be methods
//            changed: vm => todos => save(todos)
        },

        mounted() {
            const self = this;
            setTimeout (() => {
                self.obj.a.b.c = '123123';
            }, 2000);
        }

    }
</script>

