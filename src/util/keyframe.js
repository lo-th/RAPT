

RAPT.Keyframe = function (x, y) {
	this.center = new RAPT.Vector(x, y);
	this.angles = [];
}

RAPT.Keyframe.prototype = {
	constructor: RAPT.Keyframe,
	add : function(/* one or more angles */) {
		for(var i = 0; i < arguments.length; i++) {
			this.angles.push(arguments[i] * RAPT.ToRad);
		}
		return this;
	},
	lerpWith : function(keyframe, percent) {
		var result = new RAPT.Keyframe(
			RAPT.lerp(this.center.x, keyframe.center.x, percent),
			RAPT.lerp(this.center.y, keyframe.center.y, percent)
		);
		for(var i = 0; i < this.angles.length; i++) {
			result.angles.push(RAPT.lerp(this.angles[i], keyframe.angles[i], percent));
		}
		return result;
	},
	lerp : function(keyframes, percent) {
		var lower = Math.floor(percent);
		percent -= lower;
		lower = lower % keyframes.length;
		var upper = (lower + 1) % keyframes.length;
		return keyframes[lower].lerpWith(keyframes[upper], percent);
	}
}