RAPT.CELL_EMPTY = 0;
RAPT.CELL_SOLID = 1;
RAPT.CELL_FLOOR_DIAG_LEFT = 2;
RAPT.CELL_FLOOR_DIAG_RIGHT = 3;
RAPT.CELL_CEIL_DIAG_LEFT = 4;
RAPT.CELL_CEIL_DIAG_RIGHT = 5;

RAPT.Cell = function (x, y, type) {
	this.x = x;
	this.y = y;
	this.type = type;
	this.supType = 0;
	this.edges = [];
	this.ne = 0;
}
RAPT.Cell.prototype = {
	constructor: RAPT.Cell,
	bottomLeft : function() { return new RAPT.Vector(this.x, this.y); },
	bottomRight : function() { return new RAPT.Vector(this.x + 1, this.y); },
	topLeft : function() { return new RAPT.Vector(this.x, this.y + 1); },
	topRight : function() { return new RAPT.Vector(this.x + 1, this.y + 1); },
	ceilingOccupied : function() {
	    return this.type === RAPT.CELL_SOLID || this.type === RAPT.CELL_CEIL_DIAG_LEFT || this.type === RAPT.CELL_CEIL_DIAG_RIGHT;
	},
	floorOccupied : function() {
	    return this.type === RAPT.CELL_SOLID || this.type === RAPT.CELL_FLOOR_DIAG_LEFT || this.type === RAPT.CELL_FLOOR_DIAG_RIGHT;
	},
	leftWallOccupied : function() {
	    return this.type === RAPT.CELL_SOLID || this.type === RAPT.CELL_FLOOR_DIAG_LEFT || this.type === RAPT.CELL_CEIL_DIAG_LEFT;
	},
	rightWallOccupied : function() {
	    return this.type === RAPT.CELL_SOLID || this.type === RAPT.CELL_FLOOR_DIAG_RIGHT || this.type === RAPT.CELL_CEIL_DIAG_RIGHT;
	},

	// This diagonal: /
	posDiagOccupied : function() {
	    return this.type === RAPT.CELL_SOLID || this.type === RAPT.CELL_FLOOR_DIAG_RIGHT || this.type === RAPT.CELL_CEIL_DIAG_LEFT;
	},

	// This diagonal: \
	negDiagOccupied : function() {
	    return this.type === RAPT.CELL_SOLID || this.type === RAPT.CELL_FLOOR_DIAG_LEFT || this.type === RAPT.CELL_CEIL_DIAG_RIGHT;
	},

	addEdge : function(newEdge) {
		this.edges.push(newEdge);
	},
	getLastEdge:function(){
		return this.edges[this.edges.length-1];
	},
	removeEdge : function(edge) {
		var edgeIndex = this.getEdge(edge);
		this.edges.splice(edgeIndex, 1);
	},

	// returns all edges that block this color
	getBlockingEdges : function(color) {
		var blockingEdges = [];
		for(var i = 0; i < this.edges.length; i++) {
			if(this.edges[i].blocksColor(color)) {
				blockingEdges.push(this.edges[i]);
			}
		}
		return blockingEdges;
	},

	getEdge : function(edge) {
		for (var i = 0; i < this.edges.length; ++i) {
			var thisEdge = this.edges[i];
			if ((thisEdge.getStart().sub(edge.getStart())).lengthSquared() < 0.001 &&
			   (thisEdge.getEnd().sub(edge.getEnd())).lengthSquared() < 0.001) {
				return i;
			}
		}
		return -1;
	},

	// returns a polygon that represents this cell
	getShape : function() {
		var vxy = new RAPT.Vector(this.x, this.y);
		var v00 = new RAPT.Vector(0, 0);
		var v01 = new RAPT.Vector(0, 1);
		var v10 = new RAPT.Vector(1, 0);
		var v11 = new RAPT.Vector(1, 1);
		switch(this.type) {
			case RAPT.CELL_SOLID: return new RAPT.Polygon(vxy, v00, v10, v11, v01);
			case RAPT.CELL_FLOOR_DIAG_LEFT: return new RAPT.Polygon(vxy, v00, v10, v01);
			case RAPT.CELL_FLOOR_DIAG_RIGHT: return new RAPT.Polygon(vxy, v00, v10, v11);
			case RAPT.CELL_CEIL_DIAG_LEFT: return new RAPT.Polygon(vxy, v00, v11, v01);
			case RAPT.CELL_CEIL_DIAG_RIGHT: return new RAPT.Polygon(vxy, v01, v10, v11);
		}
		return null;
	},
	draw : function(c) {
		var x = this.x, y = this.y;
		c.beginPath();
		if(this.type == RAPT.CELL_SOLID){
			c.moveTo(x, y);
			c.lineTo(x, y + 1);
			c.lineTo(x + 1, y + 1);
			c.lineTo(x + 1, y);
		}
		else if(this.type == RAPT.CELL_FLOOR_DIAG_LEFT){
			c.moveTo(x, y);
			c.lineTo(x + 1, y);
			c.lineTo(x, y + 1);
		}
		else if(this.type == RAPT.CELL_FLOOR_DIAG_RIGHT){
			c.moveTo(x, y);
			c.lineTo(x + 1, y + 1);
			c.lineTo(x + 1, y);
		}
		else if(this.type == RAPT.CELL_CEIL_DIAG_LEFT){
			c.moveTo(x, y);
			c.lineTo(x, y + 1);
			c.lineTo(x + 1, y + 1);
		}
		else if(this.type == RAPT.CELL_CEIL_DIAG_RIGHT){
			c.moveTo(x + 1, y);
			c.lineTo(x, y + 1);
			c.lineTo(x + 1, y + 1);
		}
		c.closePath()
		c.fill();
		c.stroke();
	},
	drawEdges : function(c) {
		for(var i = 0; i < this.edges.length; i++) {
			this.edges[i].draw(c);
		}
	}
}
