/**
  *  For the polygon class, the segments and the bounding box are all relative to the center of the polygon.
  *  That is, when the polygon moves, the center is the only thing that changes.  This is to prevent
  *  floating-point arithmetic errors that would be caused by maintaining several sets of absolute coordinates.
  *
  *  Segment i goes from vertex i to vertex ((i + 1) % vertices.length)
  *
  *  When making a new polygon, please declare the vertices in counterclockwise order.	I'm not sure what will
  *  happen if you don't do that.
  */

RAPT.Polygon = function (center, vertices) {
	// center is the first argument, the next arguments are the vertices relative to the center
	//arguments = Array.prototype.slice.call(arguments);
	var arg = Array.prototype.slice.call(arguments);
	//this.center = arguments.shift();
    //this.vertices = arguments;
	this.center = arg.shift();
	this.vertices = arg;

	this.segments = [];
	for(var i = 0; i < this.vertices.length; i++) {
		this.segments.push(new RAPT.Segment(this.vertices[i], this.vertices[(i + 1) % this.vertices.length]));
	}

	this.boundingBox = new RAPT.AABB(this.vertices[0], this.vertices[0]);
	this.initializeBounds();
}

RAPT.Polygon.prototype = {
	constructor: RAPT.Polygon,
	copy : function() {
		var polygon = new RAPT.Polygon(this.center, this.vertices[0]);
		polygon.vertices = this.vertices;
		polygon.segments = this.segments;
		polygon.initializeBounds();
		return polygon;
	},
	getType : function() {
		return RAPT.SHAPE_POLYGON;
	},
	moveBy : function(delta) {
		this.center = this.center.add(delta);
	},
	moveTo : function(destination) {
		this.center = destination;
	},
	getVertex : function(i) {
		return this.vertices[i].add(this.center);
	},
	getSegment : function(i) {
		return this.segments[i].offsetBy(this.center);
	},
	getAabb : function() {
		return this.boundingBox.offsetBy(this.center);
	},
	getCenter : function() {
		return this.center;
	},

	// expand the aabb and the bounding circle to contain all vertices
	initializeBounds : function() {
		for(var i = 0; i < this.vertices.length; i++) {
			var vertex = this.vertices[i];

			// expand the bounding box to include this vertex
			this.boundingBox = this.boundingBox.include(vertex);
		}
	},
	draw : function(c) {
		c.strokeStyle = 'black';
		c.beginPath();
		for(var i = 0; i < this.vertices.length; i++) {
			c.lineTo(this.vertices[i].x + this.center.x, this.vertices[i].y + this.center.y);
		}
		c.closePath();
		c.stroke();
	}
}
