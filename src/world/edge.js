// enum EdgeType
RAPT.EDGE_FLOOR = 0;
RAPT.EDGE_LEFT = 1;
RAPT.EDGE_RIGHT = 2;
RAPT.EDGE_CEILING = 3;

// enum EdgeColor
RAPT.EDGE_NEUTRAL = 0;
RAPT.EDGE_RED = 1;
RAPT.EDGE_BLUE = 2;
RAPT.EDGE_PLAYERS = 3;
RAPT.EDGE_ENEMIES = 4;

// class Edge
RAPT.Edge = function (start, end, color, type) {
	this.segment = new RAPT.Segment(start, end);
	this.color = color;
	this.type = type || 0;

	// for full 3d
	this.rtype = 0;
	this.r = 0;
}
RAPT.Edge.prototype = {
	constructor: RAPT.Edge,
	blocksColor : function(entityColor) {
		switch(this.color) {
			case RAPT.EDGE_NEUTRAL: return true;
			case RAPT.EDGE_RED: return entityColor != RAPT.EDGE_RED;
			case RAPT.EDGE_BLUE: return entityColor != RAPT.EDGE_BLUE;
			case RAPT.EDGE_PLAYERS: return entityColor != RAPT.EDGE_RED && entityColor != RAPT.EDGE_BLUE;
			case RAPT.EDGE_ENEMIES: return entityColor != RAPT.EDGE_ENEMIES;
		}
		return false;
	},
	getStart : function() {
		return this.segment.start;
	},
	getEnd : function() {
		return this.segment.end;
	},
	getOrientation : function() {
		return RAPT.getOrientation(this.segment.normal);
	},
	draw : function(c) {
		switch(this.color) {
			case RAPT.EDGE_NEUTRAL: c.strokeStyle = 'black'; break;
			case RAPT.EDGE_RED: c.strokeStyle = '#C00000'; break;
			case RAPT.EDGE_BLUE: c.strokeStyle = '#0000D2'; break;
		}
		this.segment.draw(c);

		var xOffset = this.segment.normal.x * 0.1;
		var yOffset = this.segment.normal.y * 0.1;

		c.beginPath();
		for(var i = 1, num = 10; i < num - 1; ++i) {
			var fraction = i / (num - 1);
			var start = this.segment.start.mul(fraction).add(this.segment.end.mul(1 - fraction));
			c.moveTo(start.x, start.y);
			c.lineTo(start.x - xOffset, start.y - yOffset);
		}
		c.stroke();
	}
}

RAPT.getOrientation = function(normal) {
		if (normal.x > 0.9) return RAPT.EDGE_LEFT;
		if (normal.x < -0.9) return RAPT.EDGE_RIGHT;
		if (normal.y < 0) return RAPT.EDGE_CEILING;
		return RAPT.EDGE_FLOOR;
}