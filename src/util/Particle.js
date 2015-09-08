// Particles are statically allocated in a big array so that creating a
// new particle doesn't need to allocate any memory (for speed reasons).
// To create one, call Particle(), which will return one of the elements
// in that array with all values reset to defaults.  To change a property
// use the function with the name of that property.  Some property functions
// can take two values, which will pick a random number between those numbers.
// Example:
//
// Particle().position(center).color(0.9, 0, 0, 0.5).mixColor(1, 0, 0, 1).gravity(1).triangle()
// Particle().position(center).velocity(velocity).color(0, 0, 0, 1).gravity(0.4, 0.6).circle()

var RAPT = RAPT || {};

RAPT.PARTICLE_CIRCLE = 0;
RAPT.PARTICLE_TRIANGLE = 1;
RAPT.PARTICLE_LINE = 2;
RAPT.PARTICLE_CUSTOM = 3;

// class Particle
RAPT.ParticleInstance = function () {
}

RAPT.ParticleInstance.prototype = {
	constructor: RAPT.ParticleInstance,
	init : function() {
		// must use 'm_' here because many setting functions have the same name as their property
		this.m_bounces = 0;
		this.m_color =  new THREE.Vector4();
		this.m_type = 0;
		this.m_radius = 0;
		this.m_gravity = new THREE.Vector3();
		this.m_elasticity = 0;
		this.m_decay = 1;
		this.m_expand = 1;
		this.m_uvpos =  new THREE.Vector2();
		this.m_pos = new THREE.Vector3();
		this.m_velocity = new THREE.Vector3();
		this.m_angle = 0;
		this.m_angularVelocity = 0;
		this.m_drawFunc = null;
	},
	tick : function(seconds) {
		if(this.m_bounces < 0)  return false;

		this.m_color.w *= Math.pow(this.m_decay, seconds);// alpha
		this.m_radius *= Math.pow(this.m_expand, seconds);
		//
		if(this.m_gravity.x!==0)this.m_velocity.x -= this.m_gravity.x * seconds;
		if(this.m_gravity.y!==0)this.m_velocity.y -= this.m_gravity.y * seconds;
		if(this.m_gravity.z!==0)this.m_velocity.z -= this.m_gravity.z * seconds;
		//this.m_velocity.sub(this.m_gravity.clone().multiplyScalar(seconds));
		this.m_pos.add(this.m_velocity.clone().multiplyScalar(seconds));
		
		this.m_angle += this.m_angularVelocity * seconds;
		if(this.m_alpha < 0.05) this.m_bounces = -1;
		if(this.m_color.w < 0.05) this.m_bounces = -1;
		return (this.m_bounces >= 0);
	},

	randOrTakeFirst : function (min, max) {
		return (typeof max !== 'undefined') ? RAPT.randInRange(min, max) : min;
	},
	cssRGBA : function (r, g, b, a) {
		return 'rgba(' + Math.round(r * 255) + ', ' + Math.round(g * 255) + ', ' + Math.round(b * 255) + ', ' + a + ')';
	},

	// all of these functions support chaining to fix constructor with 200 arguments
	fixangle : function(){
		var v1 = this.m_pos;
		var v2 = this.m_pos.clone().add(this.m_velocity.clone().multiplyScalar(10));
		this.m_angle = -(Math.atan2((v2.y-v1.y) , (v2.x-v1.x))+Math.PI);
        return this;
	},
	bounces : function(min, max) { this.m_bounces = Math.round(this.randOrTakeFirst(min, max)); return this; },
	type:function(t) {
		var x = 0, y = 0;
		switch(t){
			case 'circle': x=0; y=1; break;
			case 'triangle': x=2; y=1; break;
			case 'line': x=4; y=1; break;
			case 'custom': x=6; y=1; break;
		}
		this.m_uvpos.set(x,y);
		return this;
	},
	circle : function() { this.m_type = RAPT.PARTICLE_CIRCLE; return this; },
	triangle : function() { this.m_type = RAPT.PARTICLE_TRIANGLE; return this; },
	line : function() { this.m_type = RAPT.PARTICLE_LINE; return this; },
	custom : function(drawFunc) { this.m_type = RAPT.PARTICLE_CUSTOM; this.m_drawFunc = drawFunc; return this; },
	customSprite : function(sprite) { /*this.m_type = RAPT.PARTICLE_CUSTOM; this.m_drawFunc = drawFunc; */return this; },
	color : function(r, g, b, a) { this.m_color.set(r||0, g||0, b||0, a||0); return this; },
	mixColor : function(r, g, b, a) { var percent = Math.random(); this.m_color.lerp(new THREE.Vector4(r, g, b, a), percent); return this; },
	radius : function(min, max) { this.m_radius = this.randOrTakeFirst(min, max); return this; },
	gravity : function(min, max, axe) { this.m_gravity[axe || 'y'] = this.randOrTakeFirst(min, max); return this; },
	elasticity : function(min, max) { this.m_elasticity = this.randOrTakeFirst(min, max); return this; },
	decay : function(min, max) { this.m_decay = this.randOrTakeFirst(min, max); return this; },
	expand : function(min, max) { this.m_expand = this.randOrTakeFirst(min, max); return this; },
	angle : function(min, max) { this.m_angle = this.randOrTakeFirst(min, max); return this; },
	angularVelocity : function(min, max) { this.m_angularVelocity = this.randOrTakeFirst(min, max); return this; },
	position : function(pos) { this.m_pos.set( pos.x || 0, pos.y || 0, pos.z || 0); return this; },
	velocity : function(vel) { this.m_velocity.set( vel.x || 0, vel.y || 0, vel.z || 0); return this; }
};

// wrap in anonymous function for private variables
RAPT.Particle = (function() {
	var geometry = null;
	var positions = null;
	var uvpos = null;
	var colors = null;
	var values_size = null;
	
    //this.scene.add( this.particlesCloud );

	// particles is an array of ParticleInstances where the first count are in use
	//var particles = new Array(3000);
	var particles = new Array(6000);
	var maxCount = particles.length;
	var count = 0;
	var i = maxCount;
	while(i--){
		particles[i] = new RAPT.ParticleInstance();
	}
	/*for(var i = 0; i < particles.length; i++) {
		particles[i] = new RAPT.ParticleInstance();
	}*/


	RAPT.Particle = function()  {
		var particle = (count < maxCount) ? particles[count++] : particles[maxCount - 1];
		particle.init();
		return particle;
	}

	RAPT.Particle.reset = function() {
		count = 0;
		var v = 3000;
		while(v--){
			positions[v*3+0] = 0.0;
	    	positions[v*3+1] = 0.0;
	    	positions[v*3+2] = 0.0;
			colors[v*4+3] = 0.0;
		}
	};

	RAPT.Particle.init3d = function(scene, mapping)  {
		geometry = new THREE.BufferGeometry();
		var n = 3000;

		positions = new Float32Array( n * 3 );
	    uvpos = new Float32Array( n * 2 );
	    colors = new Float32Array( n * 4 );
	    angles = new Float32Array( n );
	    sizes = new Float32Array( n );

	    var v = n;

	    while(v--){

	        sizes[v] = 0.3;
	        uvpos[v*2+1] = 1.0;
	    }

	    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	    geometry.addAttribute( 'colors', new THREE.BufferAttribute( colors, 4 ) );
	    geometry.addAttribute( 'uvPos', new THREE.BufferAttribute( uvpos, 2 ) );
	    geometry.addAttribute( 'angle', new THREE.BufferAttribute( angles, 1 ) );
	    geometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );

		var particleMaterial = new THREE.ShaderMaterial( {
	        //attributes:[ 'size', 'colors', 'uvPos', 'angle' ],
			uniforms:{
			    ntiles :  { type: 'f', value: 8.0 },
			    scale :  { type: 'f', value: 800.0 },
			    map: { type: 't', value: null }
			},
			fragmentShader:[
			    'uniform sampler2D map;',
			    'uniform float ntiles;',
			    'varying vec4 vColor;',
			    'varying vec2 vPos;',
			    'varying float vAngle;',

			    // map tile position see Shader.js
			    RAPT.tileUV,
			    // map tile rotation see Shader.js
			    RAPT.rotUV,

			    'void main(){',
			    '    vec2 uv = rotUV(vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y ), vAngle);',
			    '    vec2 coord = tileUV(uv, vPos, ntiles);',
			    '    vec4 texture = texture2D( map, coord );',
			    '    gl_FragColor = texture * vColor;',
			    '}'
			].join('\n'),
			vertexShader:[    
			    'attribute float angle;',
			    'attribute vec4 colors;',
			    'attribute vec2 uvPos;',
			    'attribute float size;',
			    'uniform float scale;',
			    'varying vec2 vPos;',
			    'varying vec4 vColor;',
			    'varying float vAngle;',

			    'void main(){',
			    '    vPos = uvPos;',
			    '    vColor = colors;',
			    '    vAngle = angle;',
			    '    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
			    //'    gl_PointSize = size * scale;',
			    '    gl_PointSize = size * ( scale / length( mvPosition.xyz ) );',
			    '    gl_Position = projectionMatrix * mvPosition;',
			    '}'
			].join('\n'),
	        //vertexColors:   THREE.VertexColors,
	        depthTest: false,
	        depthWrite: true,
	        transparent: true
	    });

        particleMaterial.uniforms.map.value = mapping;


	    var particlesCloud = new THREE.PointCloud( geometry, particleMaterial );
	    particlesCloud.position.set(0,0,0.01);
	    particlesCloud.frustumCulled = false;
		scene.add( particlesCloud );
	};

	RAPT.Particle.tick = function(seconds) {
		for(var i = 0; i < count; i++) {
			var isAlive = particles[i].tick(seconds);

			//

			positions[i * 3 + 0] = particles[i].m_pos.x.toFixed(3);
			positions[i * 3 + 1] = particles[i].m_pos.y.toFixed(3);
			positions[i * 3 + 2] = particles[i].m_pos.z.toFixed(3);

			//if(i===0) console.log(positions[i * 3 + 0], positions[i * 3 + 1]);

			colors[i * 4 + 0] = particles[i].m_color.x;
			colors[i * 4 + 1] = particles[i].m_color.y;
			colors[i * 4 + 2] = particles[i].m_color.z;
			colors[i * 4 + 3] = particles[i].m_color.w;

			if(particles[i].m_uvpos.x!==0 && particles[i].m_uvpos.y!==0){
				uvpos[i * 2 + 0] = particles[i].m_uvpos.x;
				uvpos[i * 2 + 1] = particles[i].m_uvpos.y;
			} else {
				uvpos[i * 2 + 0] = particles[i].m_type*2;
			}

			
			angles[i] = particles[i].m_angle;
			sizes[i] = particles[i].m_radius * 3;

			if (!isAlive) {
				
				// swap the current particle with the last active particle (this will swap with itself if this is the last active particle)
				var temp = particles[i];
				//
				particles[i] = particles[count - 1];

				colors[(count - 1) * 4 + 3] = 0.0;
				
				particles[count - 1] = temp;
				
				// forget about the dead particle that we just moved to the end of the active particle list
				count--;
				
				// don't skip the particle that we just swapped in
				i--;
			}
		}

		
	};

	RAPT.Particle.scalemat = function(z) {
		particleMaterial.uniforms.scale.value = z;
	}

	RAPT.Particle.update = function() {
		geometry.attributes.position.needsUpdate = true;
		geometry.attributes.colors.needsUpdate = true;
		geometry.attributes.uvPos.needsUpdate = true;
		geometry.attributes.angle.needsUpdate = true;
		geometry.attributes.size.needsUpdate = true;
	}

	return RAPT.Particle;
})();