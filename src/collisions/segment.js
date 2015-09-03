RAPT.Segment = function (start, end) {
	this.start = start;
	this.end = end;
	this.normal = end.sub(start).flip().unit();
}
RAPT.Segment.prototype = {
	constructor: RAPT.Segment,
	offsetBy : function(offset) {
		return new RAPT.Segment(this.start.add(offset), this.end.add(offset));
	},
	draw : function(c) {
		c.beginPath();
		c.moveTo(this.start.x, this.start.y);
		c.lineTo(this.end.x, this.end.y);
		c.stroke();
	}
}
