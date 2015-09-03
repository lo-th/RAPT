RAPT.Circle = function (center, radius) {
	this.center = center || new RAPT.Vector(0,0);
	this.radius = radius;
}

RAPT.Circle.prototype = {
	constructor: RAPT.Circle,
	copy : function() {
		return new RAPT.Circle(this.center, this.radius);
	},
	getType : function() {
		return RAPT.SHAPE_CIRCLE;
	},
	getAabb : function() {
		var radiusVector = new RAPT.Vector(this.radius, this.radius);
		return new RAPT.AABB(this.center.sub(radiusVector), this.center.add(radiusVector));
	},
	getCenter : function() {
		return this.center;
	},
	moveBy : function(delta) {
		this.center = this.center.add(delta);
	},
	moveTo : function(destination) {
		this.center = destination;
	},
	offsetBy : function(offset) {
		return new RAPT.Circle(this.center.add(offset), this.radius);
	},
	draw : function(c) {
		c.strokeStyle = 'black';
		c.beginPath();
		c.arc(this.center.x, this.center.y, this.radius, 0, Math.PI*2, false);
		c.stroke();
	}
}
