

let Rx;

export const getRx = () => Rx;

export const initCombo = _Rx => {
    Rx = _Rx;
    Rx.Observable.prototype.notNull = notNull;
    Rx.Observable.prototype.errorIf = errorIf;
    Rx.Observable.prototype.errorIfNull = errorIfNull;
    Rx.Observable.prototype.ifNull = ifNull;


    function errorIf(clause, err) {
        const self = this;
        return Rx.Observable.merge(
            self.filter(clause).flatMap(v =>
                Rx.Observable.throw(isFunction(err) ? err(v) : err)
            ),
            self.filter(v => !clause(v)),
        );
    }

    function ifNull(arg) {
        const self = this;
        return self.flatMap(v => {
            if (v) return Rx.Observable.of(v);
            if (isFunction(arg)) return arg(v);
            return arg;
        });
    }

    function notNull(arg) {
        return this.filter(v => v);
    }

    function errorIfNull(err) {
        const self = this;
        return self.errorIf(v => !v, err);
    }

    Rx.Observable.throwIf = (cond, err) =>
        Rx.Observable.of(null).errorIf(isFunction(cond) ? cond : () => cond, err);
};
