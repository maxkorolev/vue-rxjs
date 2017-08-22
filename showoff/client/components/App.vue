<template>
    <div id="app">
        <section class="todoapp" v-cloak>
            <router-view></router-view>
        </section>
        <footer class="info">
            <p>Double-click to edit a todo</p>
            <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
        </footer>
    </div>
</template>

<style>
    body {
        margin: 0;
        font-size: 2rem;
        font-family: -apple-system, BlinkMacSystemFont,
        'avenir next', avenir,
        helvetica, 'helvetica neue',
        Ubuntu,
        'segoe ui', arial,
        sans-serif;
    }

    .page {
        text-align: center;
    }
</style>
