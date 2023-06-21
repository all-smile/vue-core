class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm
    this.expr = expr
    this.cb = cb
    // 默认存放老值
    this.oldV = this.get()
  }
  get() {
    Dep.target = this; // 把 Watcher 挂到 Dep 上
    // 取值，把观察者和数据关联起来
    let val = CompileUtil.getVal(this.vm, this.expr)
    Dep.target = null; // 用完即释放, 监听器之间解耦，不然任何值（不相关的属性）取值都会触发Watcher
    return val
  }
  // 更新操作 （数据更新后，调用观察者的update方法）
  update() {
    let newV = CompileUtil.getVal(this.vm, this.expr)
    if (newV != this.oldV) {
      this.cb(newV)
    }
  }
}