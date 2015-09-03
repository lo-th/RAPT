
RAPT.makeAABB = function(c, width, height) {
	var center = new RAPT.Vector( 0, 0);
	if(c)center = new RAPT.Vector( c.x, c.y);
	//var center = new RAPT.Vector(c.x || 0,c.y || 0);
	var halfSize = new RAPT.Vector(width * 0.5, height * 0.5);
	var lowerLeft = center.sub(halfSize);
	var upperRight = center.add(halfSize);
	return new RAPT.AABB(lowerLeft, upperRight);
}

RAPT.AABB = function (lowerLeft, upperRight) {
	this.lowerLeft = new RAPT.Vector(
		Math.min(lowerLeft.x, upperRight.x),
		Math.min(lowerLeft.y, upperRight.y));
	this.size = new RAPT.Vector(
		Math.max(lowerLeft.x, upperRight.x),
		Math.max(lowerLeft.y, upperRight.y)).sub(this.lowerLeft);
}

RAPT.AABB.prototype = {
	constructor: RAPT.AABB,

	getTop : function() { return this.lowerLeft.y + this.size.y; },
	getLeft : function() { return this.lowerLeft.x; },
	getRight : function() { return this.lowerLeft.x + this.size.x; },
	getBottom : function() { return this.lowerLeft.y; },
	getWidth : function() { return this.size.x; },
	getHeight : function() { return this.size.y; },
	copy : function() {
		return new RAPT.AABB(this.lowerLeft, this.lowerLeft.add(this.size));
	},
	getPolygon : function() {
		var center = this.getCenter();
		var halfSize = this.size.div(2);
		return new RAPT.Polygon(center,
			new RAPT.Vector(+halfSize.x, +halfSize.y),
			new RAPT.Vector(-halfSize.x, +halfSize.y),
			new RAPT.Vector(-halfSize.x, -halfSize.y),
			new RAPT.Vector(+halfSize.x, -halfSize.y));
	},
	getType : function() {
		return RAPT.SHAPE_AABB;
	},
	getAabb : function() {
		return this;
	},
	moveBy : function(delta) {
		this.lowerLeft = this.lowerLeft.add(delta);
	},
	moveTo : function(destination) {
		this.lowerLeft = destination.sub(this.size.div(2));
	},
	getCenter : function() {
		return this.lowerLeft.add(this.size.div(2));
	},
	expand : function(margin) {
		var marginVector = new RAPT.Vector(margin, margin);
		return new RAPT.AABB(this.lowerLeft.sub(marginVector), this.lowerLeft.add(this.size).add(marginVector));
	},
	union : function(aabb) {
		return new RAPT.AABB(this.lowerLeft.minComponents(aabb.lowerLeft), this.lowerLeft.add(this.size).maxComponents(aabb.lowerLeft.add(aabb.size)));
	},
	include : function(point) {
		return new RAPT.AABB(this.lowerLeft.minComponents(point), this.lowerLeft.add(this.size).maxComponents(point));
	},
	offsetBy : function(offset) {
		return new RAPT.AABB(this.lowerLeft.add(offset), this.lowerLeft.add(this.size).add(offset));
	},

	draw : function(c) {
		c.strokeStyle = 'black';
		c.strokeRect(this.lowerLeft.x, this.lowerLeft.y, this.size.x, this.size.y);
	}
}
