function x(fn,ln,location, food) {
    console.log('hello')
    console.log('hello')
    console.log('hello')
    console.log('hello')
    console.log(fn)
    console.log(ln)
    console.log(location)
    console.log('i eat: ', food)
}

let obj = {
    lastName: 'chhinchani',
    fullname: function() {
        return `my name is ${this.name} ${this.lastName} i live in bbsr`
    }
}

console.log(obj.fullname())