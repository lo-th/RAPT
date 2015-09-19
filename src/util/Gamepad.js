RAPT.Gamepad = function(){
    this.pads = [];
    this.available = navigator.getGamepads || !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;
    this.poll = false;

    var _this = this;
    window.addEventListener('gamepadconnected', _this.onConnect, false);
    window.addEventListener('gamepaddisconnected', _this.onDisconnect, false);

}

RAPT.Gamepad.prototype = {
    constructor: RAPT.Gamepad,

    onConnect:function(e){
        this.pads.push(e.gamepad);
        console.log(e.gamepad)
        this.poll = true;
    },
    onDisconnect:function(e){
        for (var i in this.pads) {
            if (this.pads[i].index == e.gamepad.index) {
                this.pads.splice(i, 1);
                break;
            }
        }
        // If no gamepads are left, stop the polling loop.
        if (this.pads.length == 0) this.poll = false;
    },
    tick:function(){
        if(!this.available) return;
        if(!this.poll) return;

        for (var i in this.pads) {
            RAPT.W3D.tell('yoo'+this.pads[i].axes[0])
            console.log(this.pads[i])
        }
        /*var gamepads = (navigator.webkitGetGamepads && navigator.webkitGetGamepads()) ||
            navigator.webkitGamepads || navigator.mozGamepads ||
            navigator.msGamepads || navigator.gamepads || 
            (navigator.getGamepads && navigator.getGamepads());

        if (gamepads) {
            var i = gamepads.length;
            while(i--){
                //console.log(gamepads[i])
                //this.pads[i].update(gamepads[i]);
                this.pads[i] = gamepads[i];
            }

            RAPT.W3D.tell(this.pads[i])
        }*/
    }

}

RAPT.Pad = function(){
    this.map = {
        buttons : [],
        axes:[]
    }
}

RAPT.Pad.prototype = {
    constructor: RAPT.Pad,
    update:function(gamepad){
        var i; 
        if(gamepad.buttons){
                i = gamepad.buttons.length;
                while(i--){
                    this.map.buttons[i] = gamepad.buttons[i];
                }}
        /*i = gamepad.axes.length;
        while(i--){
            this.map.axes[i] = gamepad.axes[i];
        }*/


    }
}