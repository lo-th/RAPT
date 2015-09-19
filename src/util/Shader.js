
// 2D TRANSFORM

// tile move
// pos = position of tile ex:(0.0,0.0) for first tile
// ntile = number of tile in map

RAPT.tileUV = [
    'vec2 tileUV(vec2 uv, vec2 pos, float ntile){',
    '    pos.y = ntiles-pos.y-1.0;',
    '    vec2 sc = vec2(1.0/ntile, 1.0/ntile);',
    '    return vec2(uv*sc)+(pos*sc);',
    '}',
].join("\n");

// tile rotation 
// angle in radian

RAPT.rotUV = [
    'vec2 rotUV(vec2 uv, float angle){',
    '    float s = sin(angle);',
    '    float c = cos(angle);',
    '    mat2 r = mat2( c, -s, s, c);',
    '    r *= 0.5; r += 0.5; r = r * 2.0 - 1.0;',
    '    uv -= 0.5; uv = uv * r; uv += 0.5;',
    '    return uv;',
    '}',
].join("\n");


RAPT.decalUV = [
    'vec2 decalUV(vec2 uv, float pix, float max){',
    '    float ps = uv.x / max;',
    '    float mx = uv.x / (uv.x-(ps*2.0));',
    '    vec2 decal = vec2( (ps*pix), - (ps*pix));',
    '    vec2 sc = vec2(uv.x*mx,uv.y*mx);',
    //'    uv -= ((2.0*pix)*ps);',
    '    return (uv);',
    '}',
].join("\n");

RAPT.MakeBasicShader = function(obj){
    return {
        uniforms:{
            map : { type: 't', value: obj.map || null },
            color : { type:'c', value: new THREE.Color(obj.color || 0xFFFFFF) },
            alphaTest : { type:'f', value: obj.alphaTest || 0 }
        },
        fragmentShader:[
            'uniform sampler2D map;',
            'uniform vec3 color;',
            'uniform float alphaTest;',
            'varying vec2 vUv;',
            'void main(){',
            '    vec4 diffuseColor = vec4(color, 1.0);',
            '    vec4 texelColor = texture2D(map, vUv);',
            '    diffuseColor *= texelColor;',
            '    gl_FragColor = diffuseColor;',
            '    if ( gl_FragColor.a < alphaTest ) discard;',
            '}'
        ].join('\n'),
        vertexShader:[
            'varying vec2 vUv;',
            'void main(){',
            '    vUv = uv;',
            '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);',
            '}'
        ].join('\n'),
        side: obj.side || THREE.FrontSide,
        transparent: obj.transparent || false,
        //alphaTest:obj.alphaTest || 0,
        shading: THREE.FlatShading,
        lights:false,
        fog:false

    }
}