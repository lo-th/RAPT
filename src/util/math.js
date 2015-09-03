RAPT.adjustAngleToTarget = function (currAngle, targetAngle, maxRotation) {
	if (targetAngle - currAngle > Math.PI) currAngle += 2 * Math.PI;
	else if (currAngle - targetAngle > Math.PI) currAngle -= 2 * Math.PI;

	var deltaAngle = targetAngle - currAngle;
	if (Math.abs(deltaAngle) > maxRotation) deltaAngle = (deltaAngle > 0 ? maxRotation : -maxRotation);
	currAngle += deltaAngle;
	currAngle -= Math.floor(currAngle / (2 * Math.PI)) * (2 * Math.PI);
	return currAngle;
}


RAPT.random = Math.random;
RAPT.lerp = function (a, b, percent) { return a + (b - a) * percent; }
RAPT.randInRange = function (a, b) { return RAPT.lerp(a, b, RAPT.random()); }
RAPT.randInt = function (a, b, n) { return RAPT.lerp(a, b, RAPT.random()).toFixed(n || 0)*1;}



RAPT.PI = Math.PI;
RAPT.PI90 = RAPT.PI*0.5;
RAPT.PI270 = RAPT.PI+RAPT.PI90;
RAPT.TwoPI = 2.0 * RAPT.PI;

RAPT.ToRad = RAPT.PI / 180;
RAPT.ToDeg = 180 / RAPT.PI;

// class Vector
RAPT.Vector = function (x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

RAPT.Vector.prototype = {
	constructor: RAPT.Vector,
	// math operations
	neg : function() { return new RAPT.Vector(-this.x, -this.y); },
	add : function(v) { return new RAPT.Vector(this.x + v.x, this.y + v.y); },
	sub : function(v) { return new RAPT.Vector(this.x - v.x, this.y - v.y); },
	mul : function(f) { return new RAPT.Vector(this.x * f, this.y * f); },
	div : function(f) { return new RAPT.Vector(this.x / f, this.y / f); },
	eq : function(v) { return Math.abs(this.x - v.x) + Math.abs(this.y - v.y) < 0.001; },

	// inplace operations
	inplaceNeg : function() { this.x = -this.x; this.y = -this.y; },
	inplaceAdd : function(v) { this.x += v.x; this.y += v.y; },
	inplaceSub : function(v) { this.x -= v.x; this.y -= v.y; },
	inplaceMul : function(f) { this.x *= f; this.y *= f; },
	inplaceDiv : function(f) { this.x /= f; this.y /= f; },
	inplaceFlip : function() { var t = this.x; this.x = this.y; this.y = -t; }, // turns 90 degrees right

	// other functions
	clone : function() { return new RAPT.Vector(this.x, this.y); },
	dot : function(v) { return this.x*v.x + this.y*v.y; },
	lengthSquared : function() { return this.dot(this); },
	length : function() { return Math.sqrt(this.lengthSquared()); },
	unit : function() { return this.div(this.length()); },
	normalize : function() { var len = this.length(); this.x /= len; this.y /= len; },
	flip : function() { return new RAPT.Vector(this.y, -this.x); }, // turns 90 degrees right
	atan2 : function() { return Math.atan2(this.y, this.x); },
	angleBetween : function(v) { return this.atan2() - v.atan2(); },
	rotate : function(theta) { var s = Math.sin(theta), c = Math.cos(theta); return new RAPT.Vector(this.x*c - this.y*s, this.x*s + this.y*c); },
	minComponents : function(v) { return new RAPT.Vector(Math.min(this.x, v.x), Math.min(this.y, v.y)); },
	maxComponents : function(v) { return new RAPT.Vector(Math.max(this.x, v.x), Math.max(this.y, v.y)); },
	projectOntoAUnitVector : function(v) { return v.mul(this.dot(v)); },
	toString : function() { return '(' + this.x.toFixed(3) + ', ' + this.y.toFixed(3) + ')'; },
	adjustTowardsTarget : function(target, maxDistance) {
		var v = ((target.sub(this)).lengthSquared() < maxDistance * maxDistance) ? target : this.add((target.sub(this)).unit().mul(maxDistance));
		this.x = v.x;
		this.y = v.y;
	},

	// static functions
	fromAngle : function(theta) { return new RAPT.Vector(Math.cos(theta), Math.sin(theta)); },
	lerp : function(a, b, percent) { return a.add(b.sub(a).mul(percent)); }
}
