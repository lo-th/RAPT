"use strict";

var Gamepad = function(){
    this.isMobile = false;
    this.values = [];
}

Gamepad.prototype = {
    update:function(){
        var i,j,k,l, pad;
        var info = '';
        var fix = this.fix;
        var gamepads = navigator.getGamepads();
        for (i = 0; i < gamepads.length; i++) {
            pad = gamepads[i];
            if(pad){
                k = pad.axes.length;
                l = pad.buttons.length;
                if(l){
                    if(!this.values[i]) this.values[i] = [];
                    // axe
                    for (j = 0; j < k; j++) {
                        this.values[i][j] = fix(pad.axes[j], 0.08 );
                    }
                    // button
                    for (j = 0; j < l; j++) {
                        this.values[i][k+j] = fix(pad.buttons[j].value);
                    }
                } else {
                    if(this.values[i]) this.values[i] = null;
                }
            }
        }
    },
    fix:function(v, dead){ // dead zone 
        var n = Number((v.toString()).substring(0, 5));
        if(dead && n<dead && n>-dead) n = 0;
        return n;
    },
    log:function(){
        var info = "";
        var i = this.values.length;
        while(i--) info += 'gamepad-'+i+': '+this.values[i]+'<br>';
        return info;
    }
}