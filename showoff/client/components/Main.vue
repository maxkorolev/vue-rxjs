<template>
    <to-do :path="$route.path" :items="todos" @todos="changedApply" ></to-do>
</template>

<script>

    import {fetch, save} from '../storage';
    export default {

        pipes: {
            // pipes can receive Rx.Observable from somewhere else
            todos: vm => fetch().delay(1000),

            // pipes can be methods
            changed: vm => todos => fetch()
                .flatMap(() => save(todos))
                .flatMap(() => fetch())
        },


    }
</script>

