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
	}
}

RAPT.getOrientation = function(normal) {
		if (normal.x > 0.9) return RAPT.EDGE_LEFT;
		if (normal.x < -0.9) return RAPT.EDGE_RIGHT;
		if (normal.y < 0) return RAPT.EDGE_CEILING;
		return RAPT.EDGE_FLOOR;
}