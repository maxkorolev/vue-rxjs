<template>
    <div>
        <header class="header">
            <h1>todos</h1>
            <input class="new-todo" autofocus autocomplete="off" placeholder="What needs to be done?" v-model="newTodo.value"
                   @keyup.enter="addTodo.apply(newTodo.value)">
        </header>
        <section class="main">
            <input id="toggle-all" class="toggle-all" type="checkbox" v-model="allDone.value" @click="allDoneClick.apply">
            <label for="toggle-all">Mark all as complete</label>
            <ul class="todo-list">
                <li v-for="todo in filteredTodos.value" :class="{completed: todo.completed, editing: todo == editedTodo.value}">
                    <div class="view">
                        <input class="toggle" type="checkbox" v-model="todo.completed" @click="doneClick.apply">
                        <label @dblclick="editTodo.apply(todo)">{{todo.title}}</label>
                        <button class="destroy" @click="removeTodo.apply(todo)"></button>
                    </div>
                    <input class="edit" type="text" v-model="todo.title" v-todo-focus="todo == editedTodo.value"
                           @blur="doneEdit.apply(todo)" @keyup.enter="doneEdit.apply(todo)" @keyup.esc="cancelEdit.apply(todo)">
                </li>
            </ul>
        </section>
        <footer class="footer" v-show="todos.value.length">
            <span class="todo-count">{{itemsLeft.value}}</span>
            <ul class="filters">
                <li> <router-link tag="a" to="/all" :class="{selected: isAll.value}">All</router-link> </li>
                <li> <router-link tag="a" to="/active" :class="{selected: isActive.value}">Active</router-link> </li>
                <li> <router-link tag="a" to="/completed" :class="{selected: isCompleted.value}">Completed</router-link> </li>
            </ul>
            <button class="clear-completed" @click="removeCompleted.apply" v-show="todos.value.length > remaining.value">
                Clear completed
            </button>
        </footer>
    </div>
</template>

<script>

    import {fetch, save} from '../storage';
    import Rx from 'rxjs/Rx';

    Rx.Observable.prototype.notNull = function () {
        return this.filter(v => !!v);
    };

    export default {

        beforeRouteEnter (to, from, next) {
            next(vm => vm.currentPath.apply(to.path))
        },
        pipes: {
            // pipes can be used as usual data tag
            // lets declare some initial values
            newTodo: () => '',
            beforeEditCache: () => '',

            // pipes can receive Rx.Observable, and put value to the scope
            editedTodo: () => Rx.Observable.of(null),

            // pipes can receive Rx.Observable from somewhere else
            // list of todos
            todos: () => fetch(),

            // pipes can receive external subject
            // current router path ['/all' | '/active' | '/completed']
            currentPath: vm => new Rx.Subject(),

            // pipes can handle other pipes which you previously created
            isAll: vm => vm.currentPath.pipe.map(path => path === '/all'),
            isActive: vm => vm.currentPath.pipe.map(path => path === '/active'),
            isCompleted: vm => vm.currentPath.pipe.map(path => path === '/completed'),

            // pipes can be computed properties
            filteredTodos: vm => vm.todos.pipe.flatMap(todos =>
                Rx.Observable.merge(
                    vm.isAll.pipe.map(v => v && todos).notNull(),
                    vm.isActive.pipe.map(v => v && todos.filter(t => !t.completed)).notNull(),
                    vm.isCompleted.pipe.map(v => v && todos.filter(t => t.completed)).notNull(),
                )
            ),

            // every pipe handler is called sequentially in that order which you set
            remaining: vm => vm.todos.pipe.map(todos =>
                todos.filter(t => !t.completed).length
            ),

            itemsLeft: vm => vm.remaining.pipe.map(rem =>
                `${rem} item${rem === 1 ? '' : 's'} left`
            ),

            allDone: vm => vm.remaining.pipe.map(rem => rem === 0),

            // pipes can be methods
            // you can set value of pipe by calling onPipeName function
            allDoneClick: vm => () => vm.todos.apply(
                vm.todos.value.map(t => {
                    t.completed = vm.allDone.value;
                    return t;
                })
            ),

            // pipes can receive parameter in methods
            doneClick: vm => todo => vm.todos.apply(
                vm.todos.value.map(t => {
                    if (todo === t) {
                        t.completed = !t.completed;
                    }
                    return t;
                })
            ),

            // if you want to change current state of come pipe - just say it
            addTodo: vm => newTodo => {
                const value = newTodo && newTodo.trim();
                if (value) {
                    vm.todos.apply(vm.todos.value.concat({title: value, completed: false}));
                    vm.newTodo.apply('');
                }
            },

            // pipes store just usual state - so it can be even mutable
            removeTodo: vm => todo => {
                const index = vm.todos.value.indexOf(todo);
                vm.todos.value.splice(index, 1);
                vm.todos.apply(vm.todos.value);
            },

            editTodo: vm => todo => {
                vm.beforeEditCache.apply(todo.title);
                vm.editedTodo.apply(todo);
            },

            doneEdit: vm => todo => {
                if (!vm.editedTodo.value) {
                    return;
                }
                vm.editedTodo.apply(null);
                todo.title = todo.title.trim();
                if (!todo.title) {
                    vm.removeTodo.apply(todo);
                }
            },

            cancelEdit: vm => todo => {
                vm.editedTodo.apply(null);
                todo.title = vm.beforeEditCache.value;
            },

            removeCompleted: vm => () => {
                vm.todos.apply(vm.todos.value.filter(t => !t.completed));
            }

        },

        // a custom directive to wait for the DOM to be updated
        // before focusing on the input field.
        // http://vuejs.org/guide/custom-directive.html
        directives: {
            'todo-focus': function (el, binding) {
                if (binding.value) {
                    el.focus();
                }
            }
        }
    };

</script>

