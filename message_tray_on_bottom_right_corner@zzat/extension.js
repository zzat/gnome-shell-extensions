
const Meta = imports.gi.Meta;

const LayoutManager = imports.ui.main.layoutManager;

function init() {

    LayoutManager._trayBarrier_ = null;

    //patches default _updateTrayBarrier
    LayoutManager._updateTrayBarrier = function() {
        let monitor = this.bottomMonitor;

        if (this._trayBarrier) {
            this._trayPressure.removeBarrier(this._trayBarrier);
            this._trayBarrier.destroy();
            this._trayBarrier = null;
        }

        if (this._trayBarrier_) {
            this._trayPressure.removeBarrier(this._trayBarrier_);
            this._trayBarrier_.destroy();
            this._trayBarrier = null;
        }

        //makes bottom barrier to occupy only 10px on right
        this._trayBarrier = new Meta.Barrier({ display: global.display,
                                               x1: monitor.x + monitor.width - 10, x2: monitor.x + monitor.width,
                                               y1: monitor.y + monitor.height, y2: monitor.y + monitor.height,
                                               directions: Meta.BarrierDirection.NEGATIVE_Y });

        //adds a barrier of 10px in y direction
        //enabling application of pressure diagonally
        this._trayBarrier_ = new Meta.Barrier({ display: global.display,
                                                x1: monitor.x +monitor.width, x2: monitor.x + monitor.width,
                                                y1: monitor.y + monitor.height -10, y2: monitor.y + monitor.height,
                                                directions: Meta.BarrierDirection.NEGATIVE_X });
      
        this._trayPressure.addBarrier(this._trayBarrier);
        this._trayPressure.addBarrier(this._trayBarrier_);
    };

    LayoutManager._updateTrayBarrier();
}


function enable() {
}

function disable() {
    
    //reset everything

    if (this._trayBarrier_) {
        this._trayPressure.removeBarrier(this._trayBarrier_);
        this._trayBarrier_.destroy();
        LayoutManager._trayBarrier_ = null;
    }

    LayoutManager._updateTrayBarrier = function() {
        let monitor = this.bottomMonitor;

        if (this._trayBarrier) {
            this._trayPressure.removeBarrier(this._trayBarrier);
            this._trayBarrier.destroy();
            this._trayBarrier = null;
        }

        this._trayBarrier = new Meta.Barrier({ display: global.display,
                                               x1: monitor.x, x2: monitor.x + monitor.width,
                                               y1: monitor.y + monitor.height, y2: monitor.y + monitor.height,
                                               directions: Meta.BarrierDirection.NEGATIVE_Y });

        this._trayPressure.addBarrier(this._trayBarrier);
    };

    LayoutManager._updateTrayBarrier();
}
