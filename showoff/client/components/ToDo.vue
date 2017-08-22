<template>
    <div>
        <header class="header">
            <h1>todos</h1>
            <input class="new-todo" autofocus autocomplete="off" placeholder="What needs to be done?" v-model="newTodo"
                   @keyup.enter="onAddTodo(newTodo)">
        </header>
        <!-- This section should be hidden by default and shown when there are todos -->
        <section class="main">
            <input id="toggle-all" class="toggle-all" type="checkbox" v-model="allDone" @click="onAllDoneClick">
            <label for="toggle-all">Mark all as complete</label>
            <ul class="todo-list">
                <!-- These are here just to show the structure of the list items -->
                <!-- List items should get the class `editing` when editing and `completed` when marked as completed -->
                <li v-for="todo in filteredTodos" :class="{completed: todo.completed, editing: todo == editedTodo}">
                    <div class="view">
                        <input class="toggle" type="checkbox" v-model="todo.completed" @click="onDoneClick">
                        <label @dblclick="onEditTodo(todo)">{{todo.title}}</label>
                        <button class="destroy" @click="onRemoveTodo(todo)"></button>
                    </div>
                    <input class="edit" type="text" v-model="todo.title" v-todo-focus="todo == editedTodo"
                           @blur="onDoneEdit(todo)" @keyup.enter="onDoneEdit(todo)" @keyup.esc="onCancelEdit(todo)">
                </li>
            </ul>
        </section>
        <!-- This footer should hidden by default and shown when there are todos -->
        <footer class="footer" v-show="todos.length">
            <!-- This should be `0 items left` by default -->
            <span class="todo-count">{{itemsLeft}}</span>
            <!-- Remove this if you don't implement routing -->
            <ul class="filters">
                <li> <router-link tag="a" to="/all" :class="{selected: isAll}">All</router-link> </li>
                <li> <router-link tag="a" to="/active" :class="{selected: isActive}">Active</router-link> </li>
                <li> <router-link tag="a" to="/completed" :class="{selected: isCompleted}">Completed</router-link> </li>
            </ul>
            <!-- Hidden if no completed items are left ↓ -->
            <button class="clear-completed" @click="onRemoveCompleted" v-show="todos.length > remaining">
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
            next(vm => vm.onCurrentPath(to.path))
        },
        pipes: {
            // pipes can use as usual data tag
            newTodo: () => '',
            beforeEditCache: () => '',

            // pipes can receive Rx.Observable, and put value to the scope
            editedTodo: () => Rx.Observable.of(null),

            // pipes can receive Rx.Observable from somewhere else
            todos: () => fetch(),

            // pipes can receive external subject
            currentPath: vm => new Rx.Subject(),

            // pipes can handle other pipes which you previously created
            isAll: vm => vm.currentPathPipe.map(path => path === '/all'),
            isActive: vm => vm.currentPathPipe.map(path => path === '/active'),
            isCompleted: vm => vm.currentPathPipe.map(path => path === '/completed'),

            // pipes can be computed properties
            filteredTodos: vm => vm.todosPipe.flatMap(todos =>
                Rx.Observable.merge(
                    vm.isAllPipe.map(v => v && todos).notNull(),
                    vm.isActivePipe.map(v => v && todos.filter(t => !t.completed)).notNull(),
                    vm.isCompletedPipe.map(v => v && todos.filter(t => t.completed)).notNull(),
                )
            ),

            // every pipe handler is called sequentially in that order which you set
            remaining: vm => vm.todosPipe.map(todos =>
                todos.filter(t => !t.completed).length
            ),

            itemsLeft: vm => vm.remainingPipe.map(rem =>
                `${rem} item${rem === 1 ? '' : 's'} left`
            ),

            allDone: vm => vm.remainingPipe.map(rem => rem === 0),

            // pipes can be methods
            // you can set value of pipe by calling onPipeName function
            allDoneClick: vm => () => vm.onTodos(
                vm.todos.map(t => {
                    t.completed = vm.allDone;
                    return t;
                })
            ),

            // pipes can receive parameter in methods
            doneClick: vm => todo => vm.onTodos(
                vm.todos.map(t => {
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
                    vm.onTodos(vm.todos.concat({title: value, completed: false}));
                    vm.onNewTodo('');
                }
            },

            // pipes store just usual state - so it can be even mutable
            removeTodo: vm => todo => {
                const index = vm.todos.indexOf(todo);
                vm.todos.splice(index, 1);
                vm.onTodos(vm.todos);
            },

            editTodo: vm => todo => {
                vm.onBeforeEditCache(todo.title);
                vm.onEditedTodo(todo);
            },

            doneEdit: vm => todo => {
                if (!vm.editedTodo) {
                    return;
                }
                vm.onEditedTodo(null);
                todo.title = todo.title.trim();
                if (!todo.title) {
                    vm.onRemoveTodo(todo);
                }
            },

            cancelEdit: vm => todo => {
                vm.onEditedTodo(null);
                todo.title = vm.beforeEditCache;
            },

            removeCompleted: vm => () => {
                vm.onTodos(vm.todos.filter(t => !t.completed));
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

