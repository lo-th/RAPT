RAPT.EdgeQuad = function () {
	this.nullifyEdges();
	this.quantities = [0, 0, 0, 0];
}

RAPT.EdgeQuad.prototype = {
	constructor: RAPT.EdgeQuad,
	nullifyEdges : function() {
		this.edges = [null, null, null, null];
	},
	minimize : function(edge, quantity) {
		var orientation = edge.getOrientation();
		if(this.edges[orientation] == null || quantity < this.quantities[orientation]) {
			this.edges[orientation] = edge;
			this.quantities[orientation] = quantity;
		}
	},
	throwOutIfGreaterThan : function(minimum) {
		for(var i = 0; i < 4; i++) {
			if(this.quantities[i] > minimum) {
				this.edges[i] = null;
			}
		}
	}
}