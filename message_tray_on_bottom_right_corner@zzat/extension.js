
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const St = imports.gi.St;

const LayoutManager = imports.ui.main.layoutManager;
const Tweener = imports.ui.tweener;

//Modified Jasper's tray pressure visualizer
//to show visualizer at bottom right corner 
const PressureViz = new Lang.Class({
    Name: 'PressureViz',

    _init: function(threshold) {
        this.actor = new St.Widget({ style_class: 'pressure-viz',
                                     opacity: 0});
        this._threshold = threshold;
        this.value = 0;
        this.x = LayoutManager.trayBox.get_width();
    },

    get value() {
        return this._value;
    },

    set value(value) {
        value = Math.min(value, this._threshold);

        this._value = value;
        let percent = value / this._threshold;

        this.actor.opacity = percent * 255;
        let translationFactor = percent * 150;
        this.actor.height = translationFactor;
        this.actor.width = translationFactor;
        this.actor.x = this.x - translationFactor;
        this.actor.translation_x = translationFactor / 2;
        this.actor.translation_y = -(translationFactor / 2);
    },

    destroy: function() {
        this.actor.destroy();
    },
});

let trayBarrierHitId = 0;
let trayPressureViz = null;
let origReset = null;

function init() {
}

function enable() {
    let pressure = LayoutManager._trayPressure;

    trayPressureViz = new PressureViz(pressure._threshold);
    LayoutManager.trayBox.add_child(trayPressureViz.actor);

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

    trayBarrierHitId = LayoutManager._trayBarrier.connect('hit', function() {
        if (pressure._isTriggered)
            return;

        Tweener.removeTweens(trayPressureViz);
        trayPressureViz.value = pressure._currentPressure;
        Tweener.addTween(trayPressureViz, { time: pressure._timeout / 1000,
                                            onUpdate: function() {
                                                pressure._lastTime = global.display.get_current_time_roundtrip();
                                                trayPressureViz.value = pressure._currentPressure;
                                                pressure._trimBarrierEvents();
                                            } });
    });

    origReset = pressure._reset;
    pressure._reset = function() {
        origReset();
        Tweener.removeTweens(trayPressureViz);
        Tweener.addTween(trayPressureViz, { value: 0, time: 0.5 });
    };
}

function disable() {
    
    //reset everything
    
    let pressure = Main.layoutManager._trayPressure;
    trayPressureViz.destroy();
    trayPressureViz = null;
    pressure._reset = origReset;
    origReset = null;
    Main.layoutManager._trayBarrier.disconnect(trayBarrierHitId);
    trayBarrierHitId = 0;

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
