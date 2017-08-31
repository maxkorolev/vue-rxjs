<template>
    <div>
        <header class="header">
            <h1>todos</h1>
            <input class="new-todo" autofocus autocomplete="off" placeholder="What needs to be done?" v-model="newTodo"
                   @keyup.enter="addTodoApply(newTodo)">
        </header>
        <section class="main">
            <input id="toggle-all" class="toggle-all" type="checkbox" v-model="allDone" @click="allDoneClickApply">
            <label for="toggle-all">Mark all as complete</label>
            <ul class="todo-list">
                <li v-for="todo in filteredTodos" :class="{completed: todo.completed, editing: todo == editedTodo}">
                    <div class="view">
                        <input class="toggle" type="checkbox" v-model="todo.completed" @click="doneClickApply">
                        <label @dblclick="editTodoApply(todo)">{{todo.title}}</label>
                        <button class="destroy" @click="removeTodoApply(todo)"></button>
                    </div>
                    <input class="edit" type="text" v-model="todo.title" v-todo-focus="todo == editedTodo"
                           @blur="doneEditApply(todo)" @keyup.enter="doneEditApply(todo)" @keyup.esc="cancelEditApply(todo)">
                </li>
            </ul>
        </section>
        <footer class="footer" v-show="todos.length">
            <span class="todo-count">{{itemsLeft}}</span>
            <ul class="filters">
                <li> <router-link tag="a" to="/all" :class="{selected: isAll}">All</router-link> </li>
                <li> <router-link tag="a" to="/active" :class="{selected: isActive}">Active</router-link> </li>
                <li> <router-link tag="a" to="/completed" :class="{selected: isCompleted}">Completed</router-link> </li>
            </ul>
            <button class="clear-completed" @click="removeCompletedApply" v-show="todos.length > remaining">
                Clear completed
            </button>
        </footer>
    </div>
</template>

<script>

    import Rx from 'rxjs/Rx';

    Rx.Observable.prototype.notNull = function () {
        return this.filter(v => !!v);
    };

    export default {
        props: {
            path: String,
            items: Array
        },
        pipes: {
            // pipes can use as usual data tag
            newTodo: () => '',
            beforeEditCache: () => null,

            // pipes can receive Rx.Observable, and put value to the scope
            editedTodo: () => Rx.Observable.of(null),

            // pipes can receive Rx.Observable from somewhere else
            todos: vm => vm.itemsPipe,

            // pipes can handle other pipes which you previously created
            isAll: vm => vm.pathPipe.map(path => path === '/all'),
            isActive: vm => vm.pathPipe.map(path => path === '/active'),
            isCompleted: vm => vm.pathPipe.map(path => path === '/completed'),

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
            // you can set value of pipe by calling someNameApply function
            allDoneClick: vm => () => vm.todosApply(
                vm.todos.map(t => {
                    t.completed = vm.allDone;
                    return t;
                })
            ),

            // pipes can receive parameter in methods
            doneClick: vm => todo => vm.todosApply(
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
                    vm.todosApply(vm.todos.concat({title: value, completed: false}));
                    vm.newTodoApply('');
                }
            },

            // pipes store just usual state - so it can be even mutable
            removeTodo: vm => todo => {
                const index = vm.todos.indexOf(todo);
                vm.todos.splice(index, 1);
                vm.todosApply(vm.todos);
            },

            editTodo: vm => todo => {
                vm.beforeEditCacheApply(todo.title);
                vm.editedTodoApply(todo);
            },

            doneEdit: vm => todo => {
                if (!vm.editedTodo) {
                    return;
                }
                vm.editedTodoApply(null);
                todo.title = todo.title.trim();
                if (!todo.title) {
                    vm.removeTodoApply(todo);
                }
            },

            cancelEdit: vm => todo => {
                vm.editedTodoApply(null);
                todo.title = vm.beforeEditCache;
            },

            removeCompleted: vm => () => {
                vm.todosApply(vm.todos.filter(t => !t.completed));
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

