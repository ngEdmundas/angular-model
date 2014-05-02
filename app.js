(function (sandbox) {
    'use strict';

    var app = sandbox.angular.module('app', ['ng']);

    app.run(function ($rootScope) {
        $rootScope.elementNumber = 9;
        $rootScope.user = new User('Jon', 'Doe');
        $rootScope.coll = new Collection(upTo($rootScope.elementNumber), 3);
        $rootScope.changeNumberOfElements = function () {
            $rootScope.coll.els = upTo($rootScope.elementNumber);
        };
    });

    function User(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.age = 0;
    }

    createDynamicProperties(User, {
        name: ['firstName', 'lastName', function () {
            return [this.firstName, this.lastName].join(' ');
        }]
    });



    // array push or remove?

    function Collection(els, size) {
        this.els = els;
        this.size = size;
        this.page = 0;
    }

    createDynamicProperties(Collection, {
        view: ['els', 'size', 'page', function () {
            var offset = this.page * this.size;
            return this.els.slice(offset, offset + parseInt(this.size));
        }],
        pages: ['els', 'size', function () {
            return upTo(Math.ceil(this.els.length / this.size));
        }]
    });

    function upTo(n) {
        var lst = [];
        for (; n; n--) lst.push(n - 1);
        return lst.reverse();
    }



    function createDynamicProperties(Model, getters) {
        var reverseDeps = {}, fnMap = {}, prop, fn, deps;

        each(getters, function (prop) {
            fn = getters[prop].slice(-1)[0];
            deps = getters[prop].slice(0, -1);

            // save getter
            fnMap[prop] = fn;

            // create getter
            Object.defineProperty(Model.prototype, prop, {
                enumerable: true,
                get: function () {
                    this._calculated = this._calculated || {};
                    if (!this._calculated[prop]) {
                        // initial
                        this._calculated[prop] = fn.call(this);
                    }
                    return this._calculated[prop];
                }
            });

            // revert deps
            deps.forEach(function (dep) {
                reverseDeps[dep] = reverseDeps[dep] || [];
                reverseDeps[dep].push(prop);
            });
        }, this);

        // create dynamic property setters
        each(reverseDeps, function (prop) {
            Object.defineProperty(Model.prototype, prop, {
                enumerable: true,
                get: function () {
                    this._data = this._data || {};
                    return this._data[prop];
                },
                set: function (val) {
                    this._data = this._data || {};
                    this._data[prop] = val;
                    // recalculate all values based on this
                    reverseDeps[prop].forEach(function (dep) {
                        console.log('update ' + dep);
                        this._calculated = this._calculated || {};
                        this._calculated[dep] = fnMap[dep].call(this);
                    }, this);
                    return this._data[prop];
                }
            });
        }, this);
    }

    function each(collection, fn, that) {
        var key;
        for (key in collection) {
            if (collection.hasOwnProperty(key)) {
                fn.call(that, key);
            }
        }
    }

    //
    //
    // function User(firstName, lastName) {
    //     this._data = {};
    //     this._calculated = {};
    //
    //     // this calls the setter!
    //     // this also means that you dont have to bother about calling it in old user,
    //     // will be updated accordingly - you could take current function from user for this AND call it
    //     this.firstName = firstName || '';
    //     this.lastName = lastName || '';
    //
    //     // this would auto call the setter - so wont work, can update all transparent
    //     this.name = 'asd';
    // }
    //
    // Object.defineProperty(User.prototype, 'firstName', {
    //     enumerable: true,
    //     get: function () {
    //         return this._data.firstName;
    //     },
    //     set: function (firstName) {
    //         this._calculated.name = [this.firstName, this.lastName].join(' ');
    //         return this._data.firstName = firstName;
    //     }
    // });
    // Object.defineProperty(User.prototype, 'lastName', {
    //     enumerable: true,
    //     get: function () {
    //         return this._data.lastName;
    //     },
    //     set: function (lastName) {
    //         this._calculated.name = [this.firstName, this.lastName].join(' ');
    //         return this._data.lastName = lastName;
    //     }
    // });
    //
    // Object.defineProperty(User.prototype, 'name', {
    //     enumerable: true,
    //     get: function () {
    //
    //         return this._calculated.name;
    //     }
    // });


// var User = function (firstName) {
//     this.firstName = firstName;
// };
//
// Object.defineProperty(User.prototype, 'name', {
//     enumerable: true,
//     get: function () { return this.firstName; }
// });
//
// var me = new User('me');
// console.log(me.name);
// console.log(me);
// var zou = new User('zou');
// console.log(zou.name);
// console.log(zou);

// keep prototype correct

// var user = {
//     firstName: '',
//     lastName: ''
// };
//
// createObject(user, {
//     name: [
//         'firstName',
//         'lastName',
//         function () { // getter
//             return this.firstName + this.lastName;
//         }
//     ]
// });


}(this));
